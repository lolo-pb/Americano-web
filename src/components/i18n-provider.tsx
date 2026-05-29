"use client";

import { createContext, useContext } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getNestedValue, interpolate } from "@/lib/i18n";

const I18nContext = createContext<{ locale: Locale; dictionary: Dictionary } | null>(null);

export function I18nProvider({
  children,
  dictionary,
  locale,
}: {
  children: React.ReactNode;
  dictionary: Dictionary;
  locale: Locale;
}) {
  return <I18nContext.Provider value={{ locale, dictionary }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  const { dictionary, locale } = context;

  function t(path: string, values?: Record<string, string | number>) {
    const message = getNestedValue(dictionary, path);
    const stringValue = typeof message === "string" ? message : "";

    return values ? interpolate(stringValue, values) : stringValue;
  }

  function raw<T = unknown>(path: string) {
    return getNestedValue(dictionary, path) as T;
  }

  return {
    locale,
    dictionary,
    t,
    raw,
  };
}
