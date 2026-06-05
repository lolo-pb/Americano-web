import { createMercadoPagoCheckoutAction } from "@/app/actions";
import type { Locale } from "@/lib/i18n";

export function MercadoPagoCheckoutForm({
  locale,
  label,
  className,
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  return (
    <form action={createMercadoPagoCheckoutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
