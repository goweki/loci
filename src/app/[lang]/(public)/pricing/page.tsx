import PricingComponent from "@/components/landing-page/pricing";
import { getDictionary, Language } from "@/lib/i18n";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  const t = dict.pricing;

  return (
    <main>
      <PricingComponent t={t} />
    </main>
  );
}
