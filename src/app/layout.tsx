export const metadata = {
  title: {
    template: "%s | loci ",
    default: "loci",
  },
  description: "Supercharging Engagement",
  metadataBase: new URL(
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXTAUTH_URL
  ),
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
        url: "/brand/og_image.png",
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

import { Inter } from "next/font/google";
import "./globals.css";
import "aos/dist/aos.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
