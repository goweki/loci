// src/app/[lang]/(protected)/settings/page.tsx

import { getUserById } from "@/data/user";
import SettingsClient from "@/components/settings/settings-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PageTitle from "@/components/ui/page-title";
import { Suspense } from "react";
import { isValidLanguage } from "@/lib/i18n";

const translations = {
  en: {
    title: "Settings",
    subtitle: "Manage your account settings and preferences",
  },
  sw: {
    title: "Mipangilio",
    subtitle: "Dhibiti mipangilio na mapendeleo ya akaunti yako",
  },
};

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { lang } = await params;

  if (!session?.user?.id) {
    return "invalid session.user.id.... Log in again";
  }

  if (!isValidLanguage(lang)) return;

  const t = translations[lang];

  const user = await getUserById(session.user.id);

  return user ? (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageTitle title={t.title} subtitle={t.subtitle} />

        <Suspense fallback={<TemplatesSkeleton />}>
          <SettingsClient user={user} />
        </Suspense>
      </div>
    </main>
  ) : null;
}

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
