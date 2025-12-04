// /settings/templates/page.tsx

import { Suspense } from "react";
import { TemplatesClient } from "@/components/settings/waba-templates";
import type { WabaTemplate } from "@/lib/prisma/generated";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PageTitle from "@/components/ui/page-title";
import { isValidLanguage } from "@/lib/i18n";

// Static data - replace with actual query functions from data/templates
const getTemplates = async (userId: string): Promise<WabaTemplate[]> => {
  // Simulating async data fetch
  // Replace this with: import { getTemplates } from '@/data/templates';
  return [
    {
      id: "1",
      name: "welcome_message",
      status: "APPROVED",
      category: "MARKETING",
      language: "en_US",
      components: JSON.parse(
        JSON.stringify([
          {
            type: "HEADER",
            format: "TEXT",
            text: "Welcome to {{1}}!",
          },
          {
            type: "BODY",
            text: "Hi {{1}}, thanks for signing up. We're excited to have you on board!",
          },
          {
            type: "FOOTER",
            text: "Reply STOP to unsubscribe",
          },
        ])
      ),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      wabaAccountId: "waba_123",
      rejectedReason: null,
      userId,
    },
    {
      id: "2",
      name: "order_confirmation",
      status: "APPROVED",
      category: "UTILITY",
      language: "en_US",
      components: JSON.parse(
        JSON.stringify([
          {
            type: "HEADER",
            format: "TEXT",
            text: "Order Confirmed",
          },
          {
            type: "BODY",
            text: "Your order #{{1}} has been confirmed. Expected delivery: {{2}}",
          },
          {
            type: "BUTTONS",
            buttons: [
              {
                type: "URL",
                text: "Track Order",
                url: "https://example.com/track/{{1}}",
              },
            ],
          },
        ])
      ),
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01"),
      wabaAccountId: "waba_123",
      rejectedReason: null,
      userId,
    },
    {
      id: "3",
      name: "payment_reminder",
      status: "PENDING",
      category: "UTILITY",
      language: "en_US",
      components: JSON.parse(
        JSON.stringify([
          {
            type: "BODY",
            text: "Your payment of {{1}} is due on {{2}}. Please complete the payment to avoid service interruption.",
          },
        ])
      ),
      createdAt: new Date("2024-03-10"),
      updatedAt: new Date("2024-03-10"),
      wabaAccountId: "waba_123",
      rejectedReason: null,
      userId,
    },
    {
      id: "4",
      name: "rejected_template",
      status: "REJECTED",
      category: "MARKETING",
      language: "en_US",
      components: JSON.parse(
        JSON.stringify([
          {
            type: "BODY",
            text: "Check out our amazing deals!",
          },
        ])
      ),
      createdAt: new Date("2024-03-01"),
      updatedAt: new Date("2024-03-05"),
      wabaAccountId: "waba_123",
      rejectedReason: "Template content violates WhatsApp policies",
      userId,
    },
  ];
};

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
    title: "WhatsApp Templates",
    subtitle: "Manage your WhatsApp Business API message templates",
  },
  sw: {
    title: "Violezo vya WhatsApp",
    subtitle: "Dhibiti violezo vya ujumbe wa WhatsApp Business API",
  },
};

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return;
  if (!isValidLanguage(lang)) return;

  const t = translations[lang];

  const templates = await getTemplates(session.user.id);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageTitle title={t.title} subtitle={t.subtitle} />

        <Suspense fallback={<TemplatesSkeleton />}>
          <TemplatesClient initialTemplates={templates} />
        </Suspense>
      </div>
    </main>
  );
}
