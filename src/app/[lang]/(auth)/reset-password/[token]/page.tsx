import AuthLayout, { AuthLayoutCopy } from "@/components/layouts/authLayout";
import { Language } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import SetPasswordForm from "@/components/forms/auth/set-password-form";
import { redirect } from "next/navigation";

export default async function SetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Language; token: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { lang, token } = await params;
  const { username } = await searchParams;
  const dict = await getDictionary(lang);

  if (!token || !username) {
    redirect(`/${lang}/reset-password`);
  }

  return (
    <AuthLayout
      copy={{
        title: dict.auth.forgotPassword.setPassword.title,
        subtitle: dict.auth.forgotPassword.setPassword.subTitle,
      }}
    >
      <SetPasswordForm token={token} username={username} />
    </AuthLayout>
  );
}
