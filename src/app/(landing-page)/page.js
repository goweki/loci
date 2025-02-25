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

import Hero from "@/components/elements/landing/hero";
import Features from "@/components/elements/landing/features";
import HowBlocks from "@/components/elements/landing/howBlocks";
import Testimonials from "@/components/elements/landing/testimonials";
import Newsletter from "@/components/elements/landing/newsletter";

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
