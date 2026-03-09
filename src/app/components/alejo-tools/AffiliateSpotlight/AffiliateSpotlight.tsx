"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import YellowButton from "../../YellowButton/YellowButton";
import { AffiliateAssetResponse } from "../types";
import styles from "./AffiliateSpotlight.module.scss";

const FALLBACK_CARD: AffiliateAssetResponse = {
	id: "ugee-fallback",
	brand: "ugee",
	type: "storewide",
	title: "Oferta UGEE",
	description: "Descubre productos de dibujo digital en UGEE.",
	imageUrl: "https://shop.ugee.com/cdn/shop/files/UT3main02.jpg?v=1769074750&width=1946",
	trackingUrl: "https://shop.ugee.com/cdn/shop/files/UT3main02.jpg?v=1769074750&width=1946",
	ctaText: "Ver tienda",
};

export default function AffiliateSpotlight() {
	const [asset, setAsset] = useState<AffiliateAssetResponse>(FALLBACK_CARD);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [displayImageUrl, setDisplayImageUrl] = useState<string>(FALLBACK_CARD.imageUrl);

	useEffect(() => {
		setDisplayImageUrl(asset.imageUrl);
	}, [asset.imageUrl]);

	useEffect(() => {
		const controller = new AbortController();

		const loadAffiliateAsset = async () => {
			try {
				const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
				const response = await fetch(`${baseUrl}/affiliate/ugee/random`, {
					method: "GET",
					cache: "no-store",
					signal: controller.signal,
				});

				if (!response.ok) {
					return;
				}

				const data = (await response.json()) as AffiliateAssetResponse;
				if (!data?.trackingUrl || !data?.title) {
					return;
				}

				setAsset(data);
			} catch {
				// Keep fallback card when affiliate API is temporarily unavailable.
			} finally {
				setIsLoading(false);
			}
		};

		void loadAffiliateAsset();

		return () => {
			controller.abort();
		};
	}, []);

	const imageAlt = useMemo(() => `Asset afiliado de ${asset.brand}: ${asset.title}`, [asset.brand, asset.title]);

	const openTrackingLink = () => {
		window.open(asset.trackingUrl, "_blank", "noopener,noreferrer");
	};

	return (
		<aside className={styles.affiliateCard} aria-label="Oferta afiliada de UGEE">
			<a
				className={styles.mobileTapLink}
				href={asset.trackingUrl}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={`Ir a oferta afiliada: ${asset.title}`}
			/>

			<p className={styles.badge}>Patrocinado</p>
			<p className={styles.title}>{isLoading ? "Cargando oferta..." : asset.title}</p>
			<p className={styles.description}>{asset.description}</p>

			<div className={styles.imageWrap}>
				{displayImageUrl ? (
					<Image
						src={displayImageUrl}
						alt={imageAlt}
						fill
						unoptimized
						sizes="(max-width: 849px) 90vw, 300px"
						className={styles.image}
						onError={() => setDisplayImageUrl("")}
					/>
				) : (
					<div className={styles.imagePlaceholder}>UGEE</div>
				)}
			</div>

			<YellowButton
				Clickable={!isLoading}
				text={asset.ctaText}
				Action={openTrackingLink}
			/>
		</aside>
	);
}
