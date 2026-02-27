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
