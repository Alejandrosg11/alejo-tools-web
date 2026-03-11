"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import YellowButton from "../../YellowButton/YellowButton";
import TurnstileVerificationModal from "../../TurnstileVerificationModal/TurnstileVerificationModal";
import { FaCloudUploadAlt } from "react-icons/fa";
import styles from "./ImageDropzone.module.scss";
import { DetectorApiResponse, DetectorResult } from "../types";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || 8);
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const isDev = process.env.NODE_ENV !== "production";
const TURNSTILE_DEV_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_CONFIGURED_SITE_KEY = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();
const USE_TURNSTILE_TEST_KEY_IN_DEV =
	process.env.NEXT_PUBLIC_TURNSTILE_USE_TEST_KEY_IN_DEV === "true";
const BYPASS_TURNSTILE_IN_LOCAL_DEV =
	process.env.NEXT_PUBLIC_BYPASS_TURNSTILE_IN_LOCAL_DEV === "true";
const TURNSTILE_SITE_KEY =
	isDev && USE_TURNSTILE_TEST_KEY_IN_DEV
		? TURNSTILE_DEV_TEST_SITE_KEY
		: TURNSTILE_CONFIGURED_SITE_KEY;
const TURNSTILE_TOKEN_FIELD = (process.env.NEXT_PUBLIC_BOT_TOKEN_FIELD || "turnstileToken").trim();
const BOT_SESSION_HEADER = (
	process.env.NEXT_PUBLIC_BOT_SESSION_HEADER || "x-bot-session-token"
).trim();
const BOT_SESSION_STORAGE_KEY = "alejo_bot_session_token";
const MAX_TURNSTILE_AUTO_RETRIES = 2;

declare global {
	interface Window {
		turnstile?: {
			render: (
				element: HTMLElement,
				options: {
					sitekey: string;
					callback: (token: string) => void;
					"expired-callback"?: () => void;
					"error-callback"?: (errorCode?: string) => void;
				}
			) => string;
			reset: (widgetId?: string) => void;
			remove?: (widgetId?: string) => void;
		};
	}
}

type ImageDropzoneProps = {
	onResult: (result: DetectorResult | null) => void;
};

export default function ImageDropzone({ onResult }: ImageDropzoneProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const turnstileContainerRef = useRef<HTMLDivElement>(null);
	const turnstileWidgetIdRef = useRef<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
	const [isTurnstileScriptLoaded, setIsTurnstileScriptLoaded] = useState<boolean>(false);
	const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
	const [isVerificationLoading, setIsVerificationLoading] = useState<boolean>(false);
	const [turnstileRetryCount, setTurnstileRetryCount] = useState<number>(0);
	const [botSessionToken, setBotSessionToken] = useState<string>("");
	const isLocalDevHost =
		isDev &&
		typeof window !== "undefined" &&
		(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
	const shouldBypassTurnstileInLocalDev =
		isLocalDevHost && !USE_TURNSTILE_TEST_KEY_IN_DEV && BYPASS_TURNSTILE_IN_LOCAL_DEV;

	const isBotProtectionEnabled = Boolean(TURNSTILE_SITE_KEY) && !shouldBypassTurnstileInLocalDev;
	const canUploadImage = !isAnalyzing;

	const saveBotSessionToken = useCallback((token: string) => {
		setBotSessionToken(token);

		if (typeof window !== "undefined") {
			window.localStorage.setItem(BOT_SESSION_STORAGE_KEY, token);
		}
	}, []);

	const clearBotSessionToken = useCallback(() => {
		setBotSessionToken("");

		if (typeof window !== "undefined") {
			window.localStorage.removeItem(BOT_SESSION_STORAGE_KEY);
		}
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const persistedSessionToken = window.localStorage.getItem(BOT_SESSION_STORAGE_KEY) || "";
		setBotSessionToken(persistedSessionToken);
	}, []);

	const resetTurnstileWidgetSafely = useCallback(() => {
		if (!window.turnstile || !turnstileWidgetIdRef.current) {
			return;
		}

		try {
			window.turnstile.reset(turnstileWidgetIdRef.current);
		} catch {
			if (isDev) {
				console.warn("Turnstile reset omitido: widget no disponible.");
			}
		}
	}, []);

	const removeTurnstileWidgetSafely = useCallback(() => {
		if (!window.turnstile || !turnstileWidgetIdRef.current) {
			return;
		}

		try {
			if (window.turnstile.remove) {
				window.turnstile.remove(turnstileWidgetIdRef.current);
			} else {
				window.turnstile.reset(turnstileWidgetIdRef.current);
			}
		} catch {
			if (isDev) {
				console.warn("Turnstile remove/reset omitido: widget no disponible.");
			}
		} finally {
			turnstileWidgetIdRef.current = null;
		}
	}, []);

	const retryTurnstileVerification = useCallback(() => {
		if (turnstileRetryCount >= MAX_TURNSTILE_AUTO_RETRIES) {
			return;
		}

		setTimeout(() => {
			setTurnstileRetryCount((currentCount) => currentCount + 1);
		}, 300);
	}, [turnstileRetryCount]);

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	const runDetection = useCallback(async (selectedFile: File, verificationToken?: string) => {
		try {
			setIsAnalyzing(true);
			setErrorMessage("");
			onResult(null);

			if (isBotProtectionEnabled && !verificationToken && !botSessionToken) {
				return;
			}

			const formData = new FormData();
			const fileFieldName = process.env.NEXT_PUBLIC_DETECT_FILE_FIELD || "image";
			formData.append(fileFieldName, selectedFile);

			if (isBotProtectionEnabled && verificationToken) {
				formData.append(TURNSTILE_TOKEN_FIELD, verificationToken);
			}

			const requestHeaders: HeadersInit = {};
			if (isBotProtectionEnabled && botSessionToken) {
				requestHeaders[BOT_SESSION_HEADER] = botSessionToken;
			}

			const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
			const response = await fetch(`${baseUrl}/detect/ai`, {
				method: "POST",
				headers: requestHeaders,
				body: formData,
			});

			const refreshedSessionToken = response.headers.get(BOT_SESSION_HEADER);
			if (refreshedSessionToken) {
				saveBotSessionToken(refreshedSessionToken);
			}

			if (!response.ok) {
				let backendErrorCode = "";

				try {
					const errorPayload = (await response.clone().json()) as {
						code?: string;
						error?: { code?: string };
					};
					backendErrorCode = (
						errorPayload.code ??
						errorPayload.error?.code ??
						""
					).toUpperCase();
				} catch {
					backendErrorCode = "";
				}

				if (response.status === 429) {
					const retryAfter = Number(response.headers.get("retry-after") || 30);
					setCooldownSeconds(Number.isNaN(retryAfter) ? 30 : retryAfter);
				}

				if (
					(backendErrorCode === "TOKEN_MISSING" || backendErrorCode === "TOKEN_INVALID") &&
					botSessionToken &&
					!verificationToken
				) {
					clearBotSessionToken();
					setPendingFile(selectedFile);
					setIsVerificationLoading(false);
					setTurnstileRetryCount(0);
					setIsVerificationModalOpen(true);
					setErrorMessage("Necesitamos validar seguridad una vez más para continuar.");
					return;
				}

				setErrorMessage(getSafeErrorMessage(response.status, backendErrorCode));
				return;
			}

			const data = (await response.json()) as DetectorApiResponse;
			onResult({
				percentage: data.result.percentage,
				label: data.result.label,
				message: data.result.message,
				disclaimer:
					data.disclaimer ??
					"Resultado probabilístico. Úsalo como señal, no como sentencia.",
			});
		} catch {
			setErrorMessage("No se pudo conectar con el servicio de análisis. Intenta de nuevo.");
			onResult(null);
		} finally {
			if (isBotProtectionEnabled) {
				resetTurnstileWidgetSafely();
			}

			setPendingFile(null);
			setTurnstileRetryCount(0);
			setIsVerificationLoading(false);
			setIsVerificationModalOpen(false);

			setIsAnalyzing(false);
		}
	}, [botSessionToken, clearBotSessionToken, isBotProtectionEnabled, onResult, resetTurnstileWidgetSafely, saveBotSessionToken]);

	useEffect(() => {
		if (
			!isBotProtectionEnabled ||
			!isTurnstileScriptLoaded ||
			!isVerificationModalOpen ||
			isVerificationLoading
		) {
			return;
		}

		if (!turnstileContainerRef.current || !window.turnstile) {
			return;
		}

		if (turnstileWidgetIdRef.current) {
			removeTurnstileWidgetSafely();
			turnstileContainerRef.current.innerHTML = "";
		}

		turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
			sitekey: TURNSTILE_SITE_KEY,
			callback: (token: string) => {
				setErrorMessage("");
				setTurnstileRetryCount(0);
				removeTurnstileWidgetSafely();

				if (turnstileContainerRef.current) {
					turnstileContainerRef.current.innerHTML = "";
				}

				if (!pendingFile) {
					setIsVerificationLoading(false);
					setIsVerificationModalOpen(false);
					setErrorMessage("No se encontró una imagen para analizar. Selecciona una de nuevo.");
					return;
				}

				setIsVerificationLoading(true);
				setIsVerificationModalOpen(true);

				void runDetection(pendingFile, token);
			},
			"expired-callback": () => {
				if (turnstileRetryCount < MAX_TURNSTILE_AUTO_RETRIES) {
					retryTurnstileVerification();
					return;
				}

				setErrorMessage("No pudimos validar automáticamente la verificación. Intenta una vez más.");
			},
			"error-callback": (errorCode?: string) => {
				if (isDev) {
					console.warn("Turnstile error-callback", errorCode);
				}

				if (turnstileRetryCount < MAX_TURNSTILE_AUTO_RETRIES) {
					retryTurnstileVerification();
					return;
				}

				if (errorCode?.startsWith("600")) {
					setIsVerificationLoading(false);
					setErrorMessage("No pudimos completar la verificación de seguridad. Intenta de nuevo en unos segundos.");
					return;
				}

				setIsVerificationLoading(false);
				setErrorMessage("No se pudo validar automáticamente la verificación. Intenta una vez más.");
			},
		});

		return () => {
			removeTurnstileWidgetSafely();
		};
	}, [isBotProtectionEnabled, isTurnstileScriptLoaded, isVerificationModalOpen, isVerificationLoading, pendingFile, removeTurnstileWidgetSafely, retryTurnstileVerification, runDetection, turnstileRetryCount]);

	useEffect(() => {
		if (cooldownSeconds <= 0) {
			return;
		}

		const intervalId = window.setInterval(() => {
			setCooldownSeconds((currentSeconds) => {
				if (currentSeconds <= 1) {
					window.clearInterval(intervalId);
					return 0;
				}

				return currentSeconds - 1;
			});
		}, 1000);

		return () => window.clearInterval(intervalId);
	}, [cooldownSeconds]);

	useEffect(() => {
		if (!isBotProtectionEnabled && isDev) {
			console.warn("Turnstile no está configurado. Define NEXT_PUBLIC_TURNSTILE_SITE_KEY para habilitar protección anti-abuso en frontend.");
		}

		if (isDev && USE_TURNSTILE_TEST_KEY_IN_DEV) {
			console.warn("Turnstile está en modo TEST para desarrollo local. Usa llaves reales en producción.");
		}

		if (isDev && typeof window !== "undefined") {
			const shortKey = TURNSTILE_SITE_KEY
				? `${TURNSTILE_SITE_KEY.slice(0, 8)}...${TURNSTILE_SITE_KEY.slice(-4)}`
				: "(vacía)";

			console.info(
				`Turnstile debug => host: ${window.location.hostname}, key: ${shortKey}, usingTestKey: ${String(
					USE_TURNSTILE_TEST_KEY_IN_DEV
				)}`
			);
		}

		if (
			isDev &&
			shouldBypassTurnstileInLocalDev &&
			typeof window !== "undefined" &&
			(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
		) {
			console.warn(
				"Turnstile desactivado en localhost por NEXT_PUBLIC_BYPASS_TURNSTILE_IN_LOCAL_DEV=true."
			);
		}
	}, [isBotProtectionEnabled, shouldBypassTurnstileInLocalDev]);

	const onSelectImage = () => {
		if (cooldownSeconds > 0) {
			setErrorMessage(`Espera ${cooldownSeconds}s antes de volver a intentar.`);
			return;
		}

		inputRef.current?.click();
	};

	const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];

		if (!selectedFile) {
			setErrorMessage("");
			return;
		}

		if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
			setErrorMessage("Solo se permiten imágenes JPG, PNG o WebP.");
			onResult(null);
			event.target.value = "";
			return;
		}

		if (selectedFile.size > MAX_UPLOAD_BYTES) {
			setErrorMessage(`La imagen supera el máximo permitido de ${MAX_UPLOAD_MB}MB.`);
			onResult(null);
			event.target.value = "";
			return;
		}

		setErrorMessage("");

		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}

		const objectUrl = URL.createObjectURL(selectedFile);
		setPreviewUrl(objectUrl);

		if (isBotProtectionEnabled) {
			setPendingFile(selectedFile);
			setTurnstileRetryCount(0);
			setIsVerificationLoading(false);
			setIsVerificationModalOpen(true);

			if (turnstileWidgetIdRef.current) {
				resetTurnstileWidgetSafely();
			}

			return;
		}

		void runDetection(selectedFile);
	};

	const closeVerificationModal = () => {
		if (isVerificationLoading) {
			return;
		}

		setIsVerificationModalOpen(false);
		setIsVerificationLoading(false);
		setPendingFile(null);
		setTurnstileRetryCount(0);
		removeTurnstileWidgetSafely();
	};

	const getSafeErrorMessage = (status: number, backendErrorCode?: string): string => {
		switch (status) {
			case 400:
				if (backendErrorCode === "TOKEN_MISSING") {
					return "No pudimos validar la solicitud en este momento. Intenta nuevamente.";
				}

				return "No se pudo procesar la imagen. Verifica formato y tamaño.";
			case 413:
				return `La imagen supera el límite permitido por el servidor. Usa un archivo de hasta ${MAX_UPLOAD_MB}MB.`;
			case 429:
				return "Demasiadas solicitudes. Espera unos segundos antes de reintentar.";
			case 401:
			case 403:
				return "No se pudo validar la verificación anti-bot. Intenta de nuevo.";
			default:
				if (status >= 500) {
					return "El servicio no está disponible por ahora. Intenta más tarde.";
				}

				return "No se pudo analizar la imagen.";
		}
	};

	return (
		<section className={styles.dropzoneWrapper}>
			{isBotProtectionEnabled && (
				<Script
					src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
					strategy="afterInteractive"
					onLoad={() => setIsTurnstileScriptLoaded(true)}
				/>
			)}

			<input
				ref={inputRef}
				type="file"
				accept="image/png, image/jpeg, image/webp"
				onChange={onImageChange}
				className={styles.hiddenInput}
			/>

			{previewUrl ? (
				<>
					<button
						type="button"
						onClick={onSelectImage}
						className={styles.imagePreview}
						aria-label="Cambiar imagen seleccionada"
						disabled={!canUploadImage}
					>
						<Image
							src={previewUrl}
							alt="Imagen seleccionada"
							fill
							unoptimized
							sizes="(max-width: 767px) 100vw, 600px"
							className={styles.previewImage}
						/>
					</button>
					<p className={styles.previewHint}>Toca la imagen para cambiarla</p>
				</>
			) : (
				<div className={styles.dropzoneInner}>
					<FaCloudUploadAlt className={styles.uploadIcon} />
					<p className={styles.dropText}>Arrastra una imagen aqui</p>
					<YellowButton
						Clickable={canUploadImage}
						text={isAnalyzing ? "Analizando..." : "Selecciona una imagen"}
						Action={onSelectImage}
					/>
				</div>
			)}

			{isAnalyzing && !isVerificationLoading && (
				<p className={styles.analyzingText}>Analizando imagen, espera un momento...</p>
			)}

			{isBotProtectionEnabled && (
				<TurnstileVerificationModal
					open={isVerificationModalOpen}
					mode={isVerificationLoading ? "loading" : "verify"}
					onCancel={closeVerificationModal}
					turnstileContainerRef={turnstileContainerRef}
				/>
			)}

			<p className={styles.supportedFormats}>
				Formatos soportados: JPG, PNG, WebP |
				<span className={styles.maxSize}> Máximo {MAX_UPLOAD_MB}MB</span>
			</p>
			{errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
		</section>
	);
}
