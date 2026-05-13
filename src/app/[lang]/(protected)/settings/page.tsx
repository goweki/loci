// src/app/[lang]/(protected)/settings/page.tsx

import SettingsClient from "@/components/settings/settings-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PageTitle from "@/components/ui/page-title";
import { Suspense } from "react";
import { isValidLanguage } from "@/lib/i18n";
import { getUserByIdAction } from "@/actions/user.actions";

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

  const resUser = await getUserByIdAction(session.user.id, {
    contacts: true,
    messages: true,
    subscriptions: { include: { plan: true } },
    waba: { include: { phoneNumbers: true, templates: true } },
  });

  if (!resUser.ok) {
    return;
  }

  const user = resUser.data;

  return user ? (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageTitle title={t.title} subtitle={t.subtitle} />

        <Suspense fallback={<TemplatesSkeleton />}>
          <SettingsClient user={user} />
        </Suspense>
      </div>
    </main>
  ) : (
    "ERROR: Couldnt fetch user"
  );
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
