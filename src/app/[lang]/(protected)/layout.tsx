import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isValidLanguage, Language } from "@/lib/i18n";

export default async function DashboardProtectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { lang } = await params;

  if (!session?.user) {
    redirect("/");
  }

  return !isValidLanguage(lang) ? null : children;
}
