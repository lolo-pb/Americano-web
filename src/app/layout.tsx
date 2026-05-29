import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { DemoModeBanner } from "@/components/demo-mode-banner";
import { getViewerContext } from "@/lib/data";

export const metadata: Metadata = {
  title: "Americano Open",
  description: "Mobile-first tennis tournament registration and bracket platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewerContext();

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-canvas text-ink antialiased">
        <div className="relative flex min-h-screen flex-col">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,#f4b247_0%,rgba(244,178,71,0.16)_34%,transparent_70%)]" />
          <DemoModeBanner demoMode={viewer.demoMode} />
          <AppHeader viewer={viewer} />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
