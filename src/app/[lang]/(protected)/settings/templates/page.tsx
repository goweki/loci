// /settings/templates/page.tsx

import { Suspense } from "react";
import { TemplatesClient } from "@/components/settings/waba-templates";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PageTitle from "@/components/ui/page-title";
import { isValidLanguage } from "@/lib/i18n";
import {
  WabaTemplateFilters,
  WabaTemplateRepository,
} from "@/data/repositories/waba-template";
import { getUserById } from "@/data/user";

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

  const templates = await WabaTemplateRepository.findByUserId(session.user.id);

  const wabaAccount = (await getUserById(session.user.id))?.waba || null;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageTitle title={t.title} subtitle={t.subtitle} />

        <Suspense fallback={<TemplatesSkeleton />}>
          <TemplatesClient wabaAccount={wabaAccount} />
        </Suspense>
      </div>
    </main>
  );
}
