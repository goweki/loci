import { Language } from "@/lib/i18n";
import SetPasswordForm from "@/components/forms/auth/set-password-form";
import { redirect } from "next/navigation";
import CenteredLayout from "@/components/layouts/centeredLayout";

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

export default async function SetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Language; token: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { lang, token } = await params;
  const { username } = await searchParams;
  const dict = translations[lang];

  if (!token || !username) {
    redirect(`/${lang}/reset-password`);
  }

  return (
    <CenteredLayout
      copy={{
        title: dict.title,
        subtitle: dict.subtitle,
      }}
    >
      <SetPasswordForm token={token} username={username} />
    </CenteredLayout>
  );
}
