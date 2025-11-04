import AuthLayout, { AuthLayoutCopy } from "@/components/layouts/authLayout";
import { SignInForm } from "@/components/forms/auth/signin-form";
import { Language } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <AuthLayout
      copy={{
        title: dict.auth.signin.title,
        subtitle: dict.auth.signin.subtitle,
      }}
    >
      <SignInForm
        emailLabel={dict.auth.signin.emailLabel}
        passwordLabel={dict.auth.signin.passwordLabel}
        submitLabel={dict.auth.signin.button}
      />
    </AuthLayout>
  );
}
