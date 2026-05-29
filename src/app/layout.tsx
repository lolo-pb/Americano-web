import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Americano Open",
  description: "Mobile-first tennis tournament registration and bracket platform.",
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
