import { env } from "@/lib/env";
import { getDictionary, type Locale } from "@/lib/i18n";

export async function MercadoPagoButton({ locale }: { locale: Locale }) {
  const dictionary = await getDictionary(locale);

  return (
    <a
      href={env.paymentLink}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex items-center justify-center gap-0 rounded-lg bg-[#009EE3] font-semibold text-white transition hover:bg-[#0088c7]"
    >
      <img
        src="/res/MP_RGB_HANDSHAKE_pluma_horizontal.svg"
        alt="Mercado Pago"
        width={140}
        height={36}
        className="h-9 w-auto shrink-0"
      />
      <span className="px-4 py-3">{dictionary.signUp.paymentLinkAction}</span>
    </a>
  );
}
