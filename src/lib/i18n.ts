import en from "@/messages/en.json";
import es from "@/messages/es.json";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export type Dictionary = typeof es;

const dictionaries: Record<Locale, Dictionary> = {
  es,
  en,
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale];
}

export function localizeHref(locale: Locale, path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized === "/" ? "" : normalized}`;
}

export function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function getNestedValue(dictionary: Dictionary, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, dictionary);
}
