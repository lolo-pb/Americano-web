export const REFERRAL_QUERY_PARAM = "ref";
export const REFERRAL_CODE_COOKIE = "custom_signup_ref";
export const REFERRAL_VISITOR_COOKIE = "custom_signup_visitor";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export function normalizeReferralCode(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized || null;
}

export function sanitizeReferralNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/")) {
    return "/";
  }

  if (value.startsWith("//")) {
    return "/";
  }

  return value;
}
