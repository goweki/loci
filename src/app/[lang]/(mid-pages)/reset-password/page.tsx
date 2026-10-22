import AuthLayout, { AuthLayoutCopy } from "@/components/layouts/authLayout";
import { SignInForm } from "@/components/forms/auth/signin-form";
import { Language } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { ForgotPasswordForm } from "@/components/forms/auth/forgot-password";
import CenteredLayout from "@/components/layouts/centeredLayout";

const translations = {
  en: {
    title: "Forgot Password?",
    subtitle: "Enter your contact to receive a reset link",
  },
  sw: {
    title: "Umesahau Nywila?",
    subtitle:
      "Weka mawasiliano yako ili upokee kiungo cha kubadilisha neno-siri",
  },
};

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  const dict = translations[lang];

  return (
    <CenteredLayout
      copy={{
        title: dict.title,
        subtitle: dict.subtitle,
      }}
    >
      <ForgotPasswordForm />
    </CenteredLayout>
  );
}
