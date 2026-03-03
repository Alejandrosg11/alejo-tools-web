"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar/Navbar";
import styles from "./page.module.scss";

export default function BetaAccessPage() {
	const [accessCode, setAccessCode] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!accessCode.trim()) {
			setErrorMessage("Ingresa tu código de acceso para continuar.");
			return;
		}

		setIsSubmitting(true);
		setErrorMessage("");

		try {
			const response = await fetch("/api/beta/session", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ accessCode: accessCode.trim() }),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => ({}))) as { message?: string };

				if (response.status === 401) {
					setErrorMessage(
						payload.message ||
							"El código de acceso no es válido. Revísalo e inténtalo nuevamente.",
					);
					return;
				}

				setErrorMessage(
					payload.message ||
						"No pudimos validar tu acceso en este momento. Revisa tu conexión e inténtalo en unos segundos.",
				);
				return;
			}

			router.replace("/alejo-tools");
			router.refresh();
		} catch {
			setErrorMessage(
				"No pudimos validar tu acceso en este momento. Revisa tu conexión e inténtalo en unos segundos.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className={styles.pageShell}>
			<Navbar />
			<main className={styles.pageContent}>
				<section className={styles.accessCard}>
					<h1 className={styles.title}>Beta cerrada</h1>
					<p className={styles.subtitle}>
						Ingresa tu código de acceso para probar Alejo Tools.
					</p>

					<form onSubmit={onSubmit} className={styles.form}>
						<label htmlFor="beta-code" className={styles.inputLabel}>
							Código de acceso
						</label>
						<input
							id="beta-code"
							type="password"
							autoComplete="off"
							value={accessCode}
							onChange={(event) => setAccessCode(event.target.value)}
							className={styles.input}
							disabled={isSubmitting}
						/>

						<button type="submit" className={styles.submitButton} disabled={isSubmitting}>
							{isSubmitting ? "Validando..." : "Entrar"}
						</button>
					</form>

					{errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
				</section>
			</main>
		</div>
	);
}
