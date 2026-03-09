export type ConfidenceLabel = "baja" | "media" | "alta";

export type DetectorResult = {
	percentage: number;
	label: ConfidenceLabel;
	message: string;
	disclaimer: string;
};

export type DetectorApiResponse = {
	result: {
		percentage: number;
		label: ConfidenceLabel;
		message: string;
	};
	disclaimer?: string;
};

export type AffiliateAssetType = "product" | "storewide";

export type AffiliateAssetResponse = {
	id: string;
	brand: "ugee";
	type: AffiliateAssetType;
	title: string;
	description: string;
	imageUrl: string;
	trackingUrl: string;
	ctaText: string;
};
