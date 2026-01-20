// /settings/billing/page.tsx

import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PageTitle from "@/components/ui/page-title";
import { isValidLanguage } from "@/lib/i18n";
import PricingComponent from "@/components/pricing";

function TemplatesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-foreground rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-foreground rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-foreground rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

const translations = {
  en: {
    title: "Simple, Transparent Pricing",
    subtitle: "Choose the perfect plan for your business needs.",
    popular: "Most Popular",
    unlimited: "Unlimited",
    cta: "Get Started",
    billing: {
      monthly: "Monthly",
      annual: "Annual",
      month: "month",
      year: "year",
      save: "Save",
      saveUp: "Save up to 17%",
    },
    plans: {
      starter: {
        name: "Starter",
        description:
          "Perfect for small businesses just getting started with WhatsApp",
      },
      standard: {
        name: "Standard",
        description:
          "Ideal for growing businesses with multiple customer touchpoints",
      },
      enterprise: {
        name: "Enterprise",
        description:
          "Advanced features for large organizations with high volume needs",
      },
    },
    features: {
      phoneNumbers: "Phone Numbers",
      messages: "Messages per Month",
      basicTemplates: "Message Templates",
      emailSupport: "Email Support",
      analytics: "Advanced Analytics",
      automation: "Automation & Chatbots",
      prioritySupport: "Priority Support",
      customIntegrations: "Custom API Integrations",
    },
    footer: {
      text: "Need a custom plan for your organization?",
      contactLink: "Contact our sales team",
    },
  },
  sw: {
    title: "Bei Rahisi na Wazi",
    subtitle: "Chagua mpango kamili kwa mahitaji ya biashara yako.",
    popular: "Inayopendelewa",
    unlimited: "Bila Kikomo",
    cta: "Anza Sasa",
    billing: {
      monthly: "Kila Mwezi",
      annual: "Kila Mwaka",
      month: "mwezi",
      year: "mwaka",
      save: "Okoa",
      saveUp: "Okoa hadi 17%",
    },
    plans: {
      starter: {
        name: "Mwanzo",
        description: "Kamili kwa biashara ndogo zinazoanza na WhatsApp",
      },
      standard: {
        name: "Wastani",
        description:
          "Bora kwa biashara zinazokua na mahali pa kuwasiliana na wateja wengi",
      },
      enterprise: {
        name: "Makampuni",
        description:
          "Vipengele vya juu kwa mashirika makubwa yenye mahitaji ya kiasi kikubwa",
      },
    },
    features: {
      phoneNumbers: "Namba za Simu",
      messages: "Ujumbe Kwa Mwezi",
      basicTemplates: "Violezo vya Ujumbe",
      emailSupport: "Msaada wa Barua Pepe",
      analytics: "Takwimu za Hali ya Juu",
      automation: "Otomatiki na Chatbots",
      prioritySupport: "Msaada wa Kipaumbele",
      customIntegrations: "Uunganisho wa API Maalum",
    },
    footer: {
      text: "Unahitaji mpango maalum kwa shirika lako?",
      contactLink: "Wasiliana na timu yetu ya mauzo",
    },
  },
};

export default async function BillingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await getServerSession(authOptions);

  if (!isValidLanguage(lang)) return;
  const t = translations[lang];

  return (
    <main className="flex-1 overflow-y-auto p-6 pb-16">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageTitle title={t.title} subtitle={t.subtitle} />

        <Suspense fallback={<TemplatesSkeleton />}>
          <PricingComponent t={t} />
        </Suspense>
      </div>
    </main>
  );
}
