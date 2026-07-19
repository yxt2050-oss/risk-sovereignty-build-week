import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Risk Sovereignty | AI Stress Test for Businesses & Households",
  description:
    "A GPT-5.6 AI red team that simulates a bad future, finds the first financial failure point, and preserves the right to exit in stages.",
  applicationName: "Risk Sovereignty",
  keywords: [
    "small business",
    "household stress test",
    "sole proprietor",
    "cash flow stress test",
    "risk sovereignty",
    "GPT-5.6",
    "business resilience",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Risk Sovereignty",
    description: "AI stress testing for the choices you still want to have tomorrow.",
    type: "website",
    images: [
      {
        url: "/risk-sovereignty-social-us.png",
        width: 1536,
        height: 1024,
        alt: "Risk Sovereignty AI stress-test control room with five financial lifelines",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Risk Sovereignty",
    description: "AI stress testing for the choices you still want to have tomorrow.",
    images: ["/risk-sovereignty-social-us.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a18",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
