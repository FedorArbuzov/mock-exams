import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Shop — nextjs-basic",
    template: "%s | Shop",
  },
  description: "Next.js App Router course mock-exams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <nav>
            <Link href="/">Shop</Link>
            <Link href="/catalog">Catalog</Link>
            <Link href="/contact">Contacts</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
