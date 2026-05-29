import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { DemoModeBanner } from "@/components/demo-mode-banner";
import { I18nProvider } from "@/components/i18n-provider";
import { getViewerContext } from "@/lib/data";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<unknown>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: string };

  if (!isLocale(locale)) {
    return {};
  }

  const dictionary = await getDictionary(locale);

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<unknown>;
}>) {
  const { locale } = (await params) as { locale: string };

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, viewer] = await Promise.all([
    getDictionary(locale as Locale),
    getViewerContext(),
  ]);

  return (
    <I18nProvider dictionary={dictionary} locale={locale as Locale}>
      <div className="relative flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,#f4b247_0%,rgba(244,178,71,0.16)_34%,transparent_70%)]" />
        <DemoModeBanner demoMode={viewer.demoMode} />
        <AppHeader locale={locale as Locale} viewer={viewer} />
        <main className="flex-1">{children}</main>
      </div>
    </I18nProvider>
  );
}
