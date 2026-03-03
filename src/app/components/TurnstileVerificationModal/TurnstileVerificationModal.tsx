"use client";

import { RefObject } from "react";
import YellowButton from "../YellowButton/YellowButton";
import styles from "./TurnstileVerificationModal.module.scss";

type TurnstileVerificationModalProps = {
	open: boolean;
	mode?: "verify" | "loading";
	onCancel: () => void;
	turnstileContainerRef: RefObject<HTMLDivElement | null>;
};

export default function TurnstileVerificationModal({
	open,
	mode = "verify",
	onCancel,
	turnstileContainerRef,
}: TurnstileVerificationModalProps) {
	if (!open) {
		return null;
	}

	return (
		<div
			className={styles.turnstileModalOverlay}
			role="dialog"
			aria-modal="true"
			aria-labelledby="turnstile-modal-title"
			aria-busy={mode === "loading"}
		>
			<div className={styles.turnstileModal}>
				{mode === "loading" ? (
					<>
						<h3 id="turnstile-modal-title" className={styles.turnstileModalTitle}>
							Procesando solicitud
						</h3>
						<p className={styles.turnstileModalText}>
							Estamos analizando tu imagen. Esto puede tardar unos segundos.
						</p>
						<div className={styles.loadingSpinner} aria-hidden="true" />
					</>
				) : (
					<>
						<h3 id="turnstile-modal-title" className={styles.turnstileModalTitle}>
							Verifica que no eres un bot
						</h3>
						<p className={styles.turnstileModalText}>
							Completa esta verificación para analizar la imagen.
						</p>
						<div ref={turnstileContainerRef} className={styles.turnstileWidget} />
						<YellowButton Clickable={true} text="Cancelar" Action={onCancel} />
					</>
				)}
			</div>
		</div>
	);
}
