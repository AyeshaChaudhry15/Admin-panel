import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | EVINN Admin",
    default: "EVINN Admin",
  },
  description: "Manage the EVINN electric mobility catalog, orders and customer requests.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#071018",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} [scrollbar-gutter:stable]`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
