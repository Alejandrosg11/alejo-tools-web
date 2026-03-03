import { NextRequest, NextResponse } from "next/server";
import { BETA_SESSION_COOKIE_NAME, verifyBetaSessionToken } from "@/lib/beta-session";

function getBackendBaseUrl(): string {
	return (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
}

export async function POST(request: NextRequest) {
	const sessionToken = request.cookies.get(BETA_SESSION_COOKIE_NAME)?.value;
	if (!verifyBetaSessionToken(sessionToken)) {
		return NextResponse.json(
			{ message: "Tu acceso beta expiró. Vuelve a ingresar tu código para continuar." },
			{ status: 401 },
		);
	}

	const backendBaseUrl = getBackendBaseUrl();
	if (!backendBaseUrl) {
		return NextResponse.json(
			{ message: "Ocurrió un problema temporal. Inténtalo de nuevo en un momento." },
			{ status: 503 },
		);
	}

	const proxySecret = (process.env.BETA_PROXY_SECRET || "").trim();
	if (!proxySecret) {
		return NextResponse.json(
			{ message: "Ocurrió un problema temporal. Inténtalo de nuevo en un momento." },
			{ status: 503 },
		);
	}

	try {
		const incomingFormData = await request.formData();
		const outgoingFormData = new FormData();

		for (const [key, value] of incomingFormData.entries()) {
			outgoingFormData.append(key, value);
		}

		const upstreamResponse = await fetch(`${backendBaseUrl}/detect/ai`, {
			method: "POST",
			body: outgoingFormData,
			headers: {
				"x-beta-proxy-secret": proxySecret,
			},
			cache: "no-store",
		});

		const responseHeaders = new Headers();
		const retryAfter = upstreamResponse.headers.get("retry-after");
		if (retryAfter) {
			responseHeaders.set("retry-after", retryAfter);
		}

		const contentType = upstreamResponse.headers.get("content-type") || "";
		if (contentType.includes("application/json")) {
			const payload = await upstreamResponse.json();
			return NextResponse.json(payload, {
				status: upstreamResponse.status,
				headers: responseHeaders,
			});
		}

		const payloadText = await upstreamResponse.text();
		return new NextResponse(payloadText, {
			status: upstreamResponse.status,
			headers: responseHeaders,
		});
	} catch {
		return NextResponse.json(
			{
				message: "No pudimos validar tu acceso en este momento. Revisa tu conexión e inténtalo en unos segundos.",
			},
			{ status: 503 },
		);
	}
}
