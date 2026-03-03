import { NextRequest, NextResponse } from "next/server";
import {
	BETA_SESSION_COOKIE_NAME,
	BETA_SESSION_DURATION_SECONDS,
	createBetaSessionToken,
} from "@/lib/beta-session";

export async function POST(request: NextRequest) {
	let accessCode = "";

	try {
		const payload = (await request.json()) as { accessCode?: string };
		accessCode = (payload.accessCode || "").trim();
	} catch {
		return NextResponse.json(
			{
				message: "No pudimos validar tu acceso en este momento. Revisa tu conexión e inténtalo en unos segundos.",
			},
			{ status: 400 },
		);
	}

	const expectedCode = (process.env.BETA_ACCESS_CODE || "").trim();
	if (!expectedCode) {
		return NextResponse.json(
			{ message: "Ocurrió un problema temporal. Inténtalo de nuevo en un momento." },
			{ status: 503 },
		);
	}

	if (accessCode !== expectedCode) {
		return NextResponse.json(
			{ message: "El código de acceso no es válido. Revísalo e inténtalo nuevamente." },
			{ status: 401 },
		);
	}

	let sessionToken = "";
	try {
		sessionToken = createBetaSessionToken();
	} catch {
		return NextResponse.json(
			{ message: "Ocurrió un problema temporal. Inténtalo de nuevo en un momento." },
			{ status: 503 },
		);
	}

	const response = NextResponse.json({ ok: true });
	response.cookies.set({
		name: BETA_SESSION_COOKIE_NAME,
		value: sessionToken,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: BETA_SESSION_DURATION_SECONDS,
	});

	return response;
}
