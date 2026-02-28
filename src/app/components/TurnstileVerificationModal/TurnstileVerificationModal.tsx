"use client";

import { RefObject } from "react";
import YellowButton from "../YellowButton/YellowButton";
import styles from "./TurnstileVerificationModal.module.scss";

type TurnstileVerificationModalProps = {
	open: boolean;
	onCancel: () => void;
	turnstileContainerRef: RefObject<HTMLDivElement | null>;
};

export default function TurnstileVerificationModal({
	open,
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
		>
			<div className={styles.turnstileModal}>
				<h3 id="turnstile-modal-title" className={styles.turnstileModalTitle}>
					Verifica que no eres un bot
				</h3>
				<p className={styles.turnstileModalText}>
					Completa esta verificación para analizar la imagen.
				</p>
				<div ref={turnstileContainerRef} className={styles.turnstileWidget} />
				<YellowButton Clickable={true} text="Cancelar" Action={onCancel} />
			</div>
		</div>
	);
}
