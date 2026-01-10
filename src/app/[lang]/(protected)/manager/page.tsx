import ManagerComponent from "@/components/manager";
import PageTitle from "@/components/ui/page-title";
import { getUserById } from "@/data/user";
import { authOptions } from "@/lib/auth";
import { isValidLanguage } from "@/lib/i18n";
import { getServerSession } from "next-auth";
import { Suspense } from "react";

const translations = {
  en: {
    title: "Loci Manager",
    subtitle:
      "Synchronize WhatsApp business accounts, message templates, and configure the platform",
  },
  sw: {
    title: "Meneja wa Loci",
    subtitle:
      "Sawazisha akaunti za biashara za WhatsApp, templeti za ujumbe, na sanidi jukwaa",
  },
};

export default async function ManagerPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { lang } = await params;

  if (!session?.user?.id) {
    return null;
  }

  if (!isValidLanguage(lang)) return;

  const t = translations[lang];

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageTitle title={t.title} subtitle={t.subtitle} />

        <Suspense fallback={<TemplatesSkeleton />}>
          <ManagerComponent />
        </Suspense>
      </div>
    </main>
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
