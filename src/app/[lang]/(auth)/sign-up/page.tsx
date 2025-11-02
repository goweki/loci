import AuthLayout, { AuthLayoutCopy } from "@/components/layouts/authLayout";
import { SignInForm } from "@/components/forms/signin-form";
import { Language } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { SignUpForm } from "@/components/forms/signup-form";

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
      <SignUpForm />
    </AuthLayout>
  );
}
