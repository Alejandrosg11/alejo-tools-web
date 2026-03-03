"use client";

import { FaMugHot } from "react-icons/fa";
import YellowButton from "../../YellowButton/YellowButton";
import styles from "./SupportCard.module.scss";

type SupportCardProps = {
	onInviteCoffee?: () => void;
};

const KOFI_URL = (process.env.NEXT_PUBLIC_KOFI_URL || "https://ko-fi.com/alejo89_draws").trim();

export default function SupportCard({ onInviteCoffee }: SupportCardProps) {
	const handleInviteCoffee = () => {
		if (onInviteCoffee) {
			onInviteCoffee();
			return;
		}

		window.open(KOFI_URL, "_blank", "noopener,noreferrer");
	};

	return (
		<aside className={styles.supportCard} aria-label="Apoya Alejo Tools en Ko-fi">
			<div className={styles.supportCardHeader}>
				<p className={styles.supportCardTitle}>
					Apoya Alejo Tools
					<span className={styles.supportCardKoFi}>Ko-fi</span>
				</p>
				<FaMugHot className={styles.supportCardIcon} aria-hidden="true" />
			</div>
			<YellowButton
				Clickable={true}
				text="Invitame un café"
				Action={handleInviteCoffee}
			/>
			<p className={styles.supportCardHint}>
				Tu apoyo ayuda a mantener esta herramienta disponible.
			</p>
			
		</aside>
	);
}
