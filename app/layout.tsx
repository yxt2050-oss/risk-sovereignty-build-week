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
  title: "Risk Sovereignty | AI Stress Test for Small Businesses",
  description:
    "A GPT-5.6 AI red team that finds the first financial failure point and builds a staged survival plan that preserves the owner's next move.",
  applicationName: "Risk Sovereignty",
  keywords: [
    "small business",
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
        url: "/risk-sovereignty-social.png",
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
    images: ["/risk-sovereignty-social.png"],
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
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
