export const metadata = {
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "loci - Security portal",
    description: "Security portal & dashboard",
    url: "https://loci.goweki.com",
    siteName: "loci website",
    // images: ["https://i.postimg.cc/nrV7ytdv/og-image.jpg"],
    // locale: 'en_US',
    type: "website",
  },
};

import Hero from "@/components/landing-page/hero";
import Features from "@/components/landing-page/features";
import HowBlocks from "@/components/landing-page/how-blocks";

export default async function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <HowBlocks />
      {/* <Testimonials /> */}
      {/* <Newsletter /> */}
    </main>
  );
}
