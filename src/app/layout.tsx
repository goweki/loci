export const metadata = {
  title: {
    template: "%s | loci ",
    default: "loci",
  },
  description: "Supercharging Business Communications",
  metadataBase: new URL(
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXTAUTH_URL
  ),
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
