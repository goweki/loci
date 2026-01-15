import ComingSoon from "@/components/landing-page/coming-soon";
import Hero from "@/components/landing-page/hero";
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

  return (
    <main>
      {/* <Hero />
      <HowBlocks /> */}
      <ComingSoon />
    </main>
  );
}
