import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Americano Belgrano Tenis",
  description: "Doubles Americano at Belgrano Tenis on June 28, 2026 starting at 12:00.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
