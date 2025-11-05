import AuthLayout, { AuthLayoutCopy } from "@/components/layouts/authLayout";
import { SignInForm } from "@/components/forms/auth/signin-form";
import { Language } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { SignUpForm } from "@/components/forms/auth/signup-form";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <AuthLayout
      copy={{
        title: dict.auth.signup.title,
        subtitle: dict.auth.signup.subtitle,
      }}
    >
      <SignUpForm />
    </AuthLayout>
  );
}
