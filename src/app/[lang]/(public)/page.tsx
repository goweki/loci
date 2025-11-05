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

import Hero, { HeroProps } from "@/components/landing-page/hero";
import Features from "@/components/landing-page/features";
import HowBlocks from "@/components/landing-page/how-blocks";
import { getDictionary, isValidLanguage, Language } from "@/lib/i18n";

export default async function Landing({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) return null;
  const dict = await getDictionary(lang);

  const heroProps: HeroProps = {
    supercharge: dict.landing.hero.supercharge,
    customerEngagement: dict.landing.hero.customerEngagement,
    description: dict.landing.hero.description,
    startTrial: dict.landing.hero.startTrial,
    watchDemo: dict.landing.hero.watchDemo,
    unifiedMessaging: dict.landing.hero.features.unifiedMessaging,
    unifiedMessagingDescription:
      dict.landing.hero.features.unifiedMessagingDescription,
    crm: dict.landing.hero.features.crm,
    crmDescription: dict.landing.hero.features.crmDescription,
    fast: dict.landing.hero.features.fast,
    fastDescription: dict.landing.hero.features.fastDescription,
  };

  return (
    <main>
      <Hero {...heroProps} />
      <HowBlocks />
    </main>
  );
}
