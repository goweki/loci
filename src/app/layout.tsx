import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { BASE_URL } from "@/lib/utils/getUrl";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: "%s | loci ",
    default: "loci",
  },
  description: "Supercharging Engagement",
  icons: {
    icon: "/brand/favicon.ico",
    shortcut: "/brand/favicon-16x16.png",
    apple: "/brand/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  keywords: [
    "Communication",
    "WhatsApp",
    "Technology",
    "Customer",
    "Relations",
  ],
  robots: {
    index: false,
    follow: false,
  },

  openGraph: {
    title: "loci",
    description: "Supercharging Engagement",
    url:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXTAUTH_URL,
    siteName: "loci",
    images: [
      {
        url: "/brand/og_image.jpg",
        width: 1200,
        height: 630,
        alt: "loci - Supercharging Engagement", // Alternative text for accessibility
      },
      // You can add more images here for different sizes/formats
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers> {children}</Providers>
      </body>
    </html>
  );
}
