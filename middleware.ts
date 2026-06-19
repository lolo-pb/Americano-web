import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { REFERRAL_QUERY_PARAM, normalizeReferralCode } from "@/lib/referral";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const referralCode = normalizeReferralCode(request.nextUrl.searchParams.get(REFERRAL_QUERY_PARAM));

  if (pathname.startsWith("/api/referral-capture")) {
    return NextResponse.next();
  }

  if (!segments.length || !isLocale(segments[0])) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  if (request.method === "GET" && referralCode) {
    const captureUrl = request.nextUrl.clone();
    captureUrl.pathname = "/api/referral-capture";
    captureUrl.search = "";
    captureUrl.searchParams.set(REFERRAL_QUERY_PARAM, referralCode);

    const nextUrl = request.nextUrl.clone();
    nextUrl.searchParams.delete(REFERRAL_QUERY_PARAM);
    captureUrl.searchParams.set("next", `${nextUrl.pathname}${nextUrl.search}`);

    return NextResponse.redirect(captureUrl);
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
