import crypto from "node:crypto";

export const BETA_SESSION_COOKIE_NAME = "alejo_beta_session";
export const BETA_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 2;

type BetaSessionPayload = {
	exp: number;
};

function toBase64Url(value: string): string {
	return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
	return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret(): string {
	return (
		process.env.BETA_SESSION_SECRET ||
		(process.env.NODE_ENV !== "production" ? "dev-beta-session-secret-change-me" : "")
	);
}

function signPayload(encodedPayload: string): string {
	const sessionSecret = getSessionSecret();

	if (!sessionSecret) {
		throw new Error("BETA_SESSION_SECRET is required in production.");
	}

	return crypto
		.createHmac("sha256", sessionSecret)
		.update(encodedPayload)
		.digest("base64url");
}

export function createBetaSessionToken(): string {
	const payload: BetaSessionPayload = {
		exp: Math.floor(Date.now() / 1000) + BETA_SESSION_DURATION_SECONDS,
	};

	const encodedPayload = toBase64Url(JSON.stringify(payload));
	const signature = signPayload(encodedPayload);

	return `${encodedPayload}.${signature}`;
}

export function verifyBetaSessionToken(token: string | undefined): boolean {
	if (!token) {
		return false;
	}

	const [encodedPayload, providedSignature] = token.split(".");
	if (!encodedPayload || !providedSignature) {
		return false;
	}

	try {
		const expectedSignature = signPayload(encodedPayload);
		if (providedSignature !== expectedSignature) {
			return false;
		}

		const payload = JSON.parse(fromBase64Url(encodedPayload)) as BetaSessionPayload;
		return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
	} catch {
		return false;
	}
}
