import PricingComponent from "@/components/pricing";
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
      <section id="pricing" className="relative py-12 md:py-20">
        <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.title}</h2>
            <p className="text-lg text-muted-foreground">{t.subtitle}</p>
          </div>
          <PricingComponent t={t} />
        </div>
      </section>
    </main>
  );
}
