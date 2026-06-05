import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getMercadoPagoPayment, mapMercadoPagoPaymentStatus, verifyMercadoPagoWebhookSignature } from "@/lib/mercadopago";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function revalidatePaymentViews() {
  for (const locale of ["es", "en"] as const) {
    revalidatePath(`/${locale}/me`);
    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/admin/players`);
    revalidatePath(`/${locale}/sign-up/success`);
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ ok: false, error: "Supabase admin env missing" }, { status: 500 });
  }

  const url = new URL(request.url);
  const payload = await request.json().catch(() => null);

  const notificationType =
    url.searchParams.get("type") ??
    url.searchParams.get("topic") ??
    payload?.type ??
    payload?.topic ??
    "";

  const dataId =
    url.searchParams.get("data.id") ??
    (payload?.data?.id ? String(payload.data.id) : "") ??
    (payload?.id ? String(payload.id) : "");

  if (!notificationType.includes("payment") || !dataId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!verifyMercadoPagoWebhookSignature(request, dataId)) {
    return NextResponse.json({ ok: false, error: "Invalid Mercado Pago signature" }, { status: 401 });
  }

  const payment = await getMercadoPagoPayment(dataId);
  const teamId = payment.external_reference ? String(payment.external_reference) : "";

  if (!teamId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const adminSupabase = createAdminClient();

  await adminSupabase
    .from("teams")
    .update(
      {
        payment_status: mapMercadoPagoPaymentStatus(payment.status),
        mercadopago_payment_id: String(payment.id),
        payment_amount_ars:
          typeof payment.transaction_amount === "number" ? Math.round(payment.transaction_amount) : null,
        payment_paid_at: payment.date_approved ?? null,
      } as never,
    )
    .eq("id", teamId);

  revalidatePaymentViews();

  return NextResponse.json({ ok: true });
}
