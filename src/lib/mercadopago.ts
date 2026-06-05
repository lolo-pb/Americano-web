import "server-only";

import crypto from "node:crypto";
import type { Locale } from "@/lib/i18n";
import { TEAM_PAYMENT_AMOUNT_ARS } from "@/lib/payments";
import type { PaymentStatus, Team } from "@/lib/types";

const MERCADO_PAGO_API_BASE = "https://api.mercadopago.com";

function getMercadoPagoAccessToken() {
  return process.env.MERCADOPAGO_ACCESS_TOKEN ?? null;
}

function getMercadoPagoWebhookSecret() {
  return process.env.MERCADOPAGO_WEBHOOK_SECRET ?? null;
}

function getAppBaseUrl() {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return null;
}

export function hasMercadoPagoEnv() {
  return Boolean(getMercadoPagoAccessToken() && getAppBaseUrl());
}

async function mercadoPagoFetch<T>(path: string, init: RequestInit = {}) {
  const accessToken = getMercadoPagoAccessToken();

  if (!accessToken) {
    throw new Error("Mercado Pago access token is missing.");
  }

  const response = await fetch(`${MERCADO_PAGO_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mercado Pago request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}

export async function createCheckoutPreference({
  team,
  locale,
}: {
  team: Team;
  locale: Locale;
}) {
  const appBaseUrl = getAppBaseUrl();

  if (!appBaseUrl) {
    throw new Error("APP_BASE_URL is missing.");
  }

  const localePrefix = locale === "en" ? "/en" : "/es";
  const response = await mercadoPagoFetch<{
    id: string;
    init_point: string;
    sandbox_init_point?: string;
  }>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          title: "Torneo tus Americanos - Inscripcion de dupla",
          quantity: 1,
          currency_id: "ARS",
          unit_price: TEAM_PAYMENT_AMOUNT_ARS,
        },
      ],
      payer: {
        email: team.email,
      },
      external_reference: team.id,
      notification_url: `${appBaseUrl}/api/mercadopago/webhook`,
      back_urls: {
        success: `${appBaseUrl}${localePrefix}/me?mp_return=success`,
        failure: `${appBaseUrl}${localePrefix}/me?mp_return=failure`,
        pending: `${appBaseUrl}${localePrefix}/me?mp_return=pending`,
      },
      auto_return: "approved",
      metadata: {
        team_id: team.id,
        team_slug: team.slug,
      },
    }),
  });

  return {
    preferenceId: response.id,
    initPoint: response.init_point || response.sandbox_init_point || "",
  };
}

export async function getMercadoPagoPayment(paymentId: string) {
  return mercadoPagoFetch<{
    id: number;
    status: string;
    external_reference?: string | null;
    transaction_amount?: number | null;
    date_approved?: string | null;
    order?: {
      id?: string | null;
    } | null;
  }>(`/v1/payments/${paymentId}`, {
    method: "GET",
  });
}

export function mapMercadoPagoPaymentStatus(status: string): PaymentStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "cancelled":
    case "rejected":
      return "failed";
    default:
      return "pending";
  }
}

function parseSignature(signature: string) {
  const values = new Map(
    signature
      .split(",")
      .map((part) => part.trim().split("=", 2))
      .filter((entry) => entry.length === 2) as Array<[string, string]>,
  );

  return {
    ts: values.get("ts") ?? "",
    v1: values.get("v1") ?? "",
  };
}

export function verifyMercadoPagoWebhookSignature(request: Request, dataId: string) {
  const secret = getMercadoPagoWebhookSecret();

  if (!secret) {
    return true;
  }

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  if (!signatureHeader || !requestId) {
    return false;
  }

  const { ts, v1 } = parseSignature(signatureHeader);

  if (!ts || !v1) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(v1);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
