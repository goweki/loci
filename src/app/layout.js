import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import "aos/dist/aos.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  keywords: ["security", "CCTV", "technology", "monitoring", "alerts"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "loci - Security portal",
    description: "Security portal & dashboard",
    url: "https://loci.goweki.com",
    siteName: "loci",
    images: ["https://i.postimg.cc/nrV7ytdv/og-image.jpg"],
    // locale: 'en_US',
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
