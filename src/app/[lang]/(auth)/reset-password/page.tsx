import AuthLayout, { AuthLayoutCopy } from "@/components/layouts/authLayout";
import { SignInForm } from "@/components/forms/auth/signin-form";
import { Language } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { ForgotPasswordForm } from "@/components/forms/auth/forgot-password";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <AuthLayout
      copy={{
        title: dict.auth.forgotPassword.title,
        subtitle: dict.auth.forgotPassword.subtitle,
      }}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
