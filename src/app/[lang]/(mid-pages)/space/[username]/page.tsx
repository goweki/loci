import { Language } from "@/lib/i18n";

const translations = {
  en: {
    title: "New Password",
    subtitle: "Set a new password to continue", // Corrected 'contnue'
  },
  sw: {
    title: "Nywila Mpya",
    subtitle: "Weka nywila mpya ili kuendelea",
  },
};

export default async function SpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; username: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { username, lang } = await params;
  const { productId } = await searchParams;
  const dict = translations[lang as Language];

  return (
    <>
      {/* Return component showing all products or if productId exists, show product  */}
    </>
  );
}
