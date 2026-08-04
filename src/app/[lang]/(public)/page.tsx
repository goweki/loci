import { AutomationFeatures } from "@/components/landing-page/automation-features";
import { CommerceFeatures } from "@/components/landing-page/commerce-features";
import { CTASection } from "@/components/landing-page/cta-section";
import { FAQ } from "@/components/landing-page/faq";
import { Features } from "@/components/landing-page/features";
import HeroSection from "@/components/landing-page/hero";
import { HowItWorks } from "@/components/landing-page/how-it-works";
import { TrustedBy } from "@/components/landing-page/trusted-by";
import { isValidLanguage, Language } from "@/lib/i18n";
import { redirect, RedirectType } from "next/navigation";

export default async function LandingPage(
  {
    // params,
  }: {
    // params: Promise<{ lang: Language }>;
  },
) {
  return (
    <main>
      <HeroSection />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <CommerceFeatures />
      <AutomationFeatures />
      {/* <PricingPreview /> */}
      <FAQ />
      <CTASection />
    </main>
  );
}
