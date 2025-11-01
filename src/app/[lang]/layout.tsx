import { I18nProvider, Language } from "@/lib/i18n";

export default async function LanguageLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;

  return <I18nProvider lang={lang}>{children}</I18nProvider>;
}
