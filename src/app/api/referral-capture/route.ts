import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import {
  REFERRAL_CODE_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  REFERRAL_QUERY_PARAM,
  REFERRAL_VISITOR_COOKIE,
  normalizeReferralCode,
  sanitizeReferralNextPath,
} from "@/lib/referral";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function buildCookieOptions(httpOnly: boolean) {
  return {
    httpOnly,
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const referralCode = normalizeReferralCode(url.searchParams.get(REFERRAL_QUERY_PARAM));
  const nextPath = sanitizeReferralNextPath(url.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(nextPath, url));

  if (!referralCode || !hasSupabaseEnv()) {
    return response;
  }

  const existingVisitorToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${REFERRAL_VISITOR_COOKIE}=`))
    ?.slice(REFERRAL_VISITOR_COOKIE.length + 1);
  const visitorToken = existingVisitorToken || randomUUID();

  const supabase = await createClient();
  const { data } = await supabase!.rpc("capture_custom_signup_link_visit", {
    p_code: referralCode,
    p_visitor_token: visitorToken,
  });

  response.cookies.set(REFERRAL_VISITOR_COOKIE, visitorToken, buildCookieOptions(true));

  if (typeof data === "string" && data.length > 0) {
    response.cookies.set(REFERRAL_CODE_COOKIE, data, buildCookieOptions(true));
  }

  return response;
}
