"use client";

import { useI18n } from "@/lib/i18n";

// Explicitly type the keys to match your supported languages
const translations: Record<"en" | "sw", { title: string }> = {
  en: {
    title: "Built for growing industries & businesses",
  },
  sw: {
    title: "Inaaminika na biashara zinazokua",
  },
};

const BRANDS = ["Retail", "Logistics", "E-Commerce", "Education", "Healthcare"];

export function TrustedBy() {
  const { language } = useI18n();
  // Fallback to 'en' if language is undefined or doesn't match
  const t =
    translations[language as keyof typeof translations] || translations.en;

  return (
    <section className="bg-background border-y border-border py-12 md:py-16">
      <div className="container max-w-6xl mx-auto px-4 text-center">
        {/* Section Header */}
        <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-8">
          {t.title}
        </h2>

        {/* Logo/Brand Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8 items-center justify-items-center">
          {BRANDS.map((brand) => (
            <div
              key={brand}
              className="w-full flex items-center justify-center p-4 rounded-xl 
                         border border-border/50 bg-card/50 text-card-foreground/70 
                         font-medium text-base tracking-medium select-none
                         hover:text-foreground hover:border-border hover:bg-card 
                         transition-all duration-300 ease-in-out shadow-sm"
            >
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
