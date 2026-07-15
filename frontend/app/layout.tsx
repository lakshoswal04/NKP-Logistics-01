import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/lib/providers";

const clashDisplay = localFont({
  src: [
    { path: "./fonts/ClashDisplay-Semibold.woff2", weight: "600" },
    { path: "./fonts/ClashDisplay-Bold.woff2", weight: "700" },
  ],
  variable: "--font-clash",
  display: "swap",
});

const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Regular.woff2", weight: "400" },
    { path: "./fonts/GeneralSans-Medium.woff2", weight: "500" },
    { path: "./fonts/GeneralSans-Semibold.woff2", weight: "600" },
  ],
  variable: "--font-general",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NKP Logistics — AI-Powered B2B Logistics Across India",
    template: "%s | NKP Logistics",
  },
  description:
    "Full-stack logistics for Indian businesses: FTL/LTL transportation, warehousing, last-mile delivery and real-time tracking, powered by AI route optimization and predictive insights.",
  openGraph: {
    title: "NKP Logistics",
    description: "AI-powered B2B logistics across India.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${clashDisplay.variable} ${generalSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-base text-ink font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
