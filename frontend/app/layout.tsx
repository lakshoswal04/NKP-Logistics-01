import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import Providers from "@/lib/providers";

import "./globals.css";

const clashDisplay = localFont({
  src: [
    { path: "./fonts/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ClashDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-clash",
  display: "swap",
});

const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-general",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nkplogistics.in"),
  title: {
    default: "NKP Logistics — Warehousing & fulfilment across India",
    template: "%s | NKP Logistics",
  },
  description:
    "Multi-client warehousing and order fulfilment across 42 Indian fulfilment centres — " +
    "storage, pick-pack, inventory control, returns and outbound distribution.",
  openGraph: {
    type: "website",
    siteName: "NKP Logistics",
    locale: "en_IN",
  },
};

// themeColor/colorScheme moved out of `metadata` — deprecated there since 14,
// and this is the supported export in 16.
export const viewport: Viewport = {
  themeColor: "#050706",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior is required in Next 16: the router no longer
    // overrides scroll-behavior during navigation, so smooth scrolling for
    // in-page anchors has to be opted into explicitly.
    <html
      lang="en-IN"
      data-scroll-behavior="smooth"
      className={`${clashDisplay.variable} ${generalSans.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
