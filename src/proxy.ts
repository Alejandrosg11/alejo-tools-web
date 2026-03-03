import { NextRequest, NextResponse } from "next/server";

const BETA_SESSION_COOKIE_NAME = "alejo_beta_session";
const BETA_ACCESS_PATH = "/alejo-tools/beta-access";

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const hasBetaSession = Boolean(request.cookies.get(BETA_SESSION_COOKIE_NAME)?.value);

	if (pathname.startsWith("/alejo-tools") && pathname !== BETA_ACCESS_PATH && !hasBetaSession) {
		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = BETA_ACCESS_PATH;
		return NextResponse.redirect(redirectUrl);
	}

	if (pathname === BETA_ACCESS_PATH && hasBetaSession) {
		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = "/alejo-tools";
		return NextResponse.redirect(redirectUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/alejo-tools", "/alejo-tools/:path*"],
};
