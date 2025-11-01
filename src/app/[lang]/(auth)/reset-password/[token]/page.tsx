import AuthLayout from "@/components/layouts/authLayout";
import SetPasswordForm from "@/components/forms/set-password-form";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const { token: _token } = await params;
  const { error: _qp_error, _email } = await searchParams;

  if (!_token || !_email) {
    console.log(
      `Missing auth values - ${!_token ? "token," : ""} ${
        !_email ? "email" : ""
      }`
    );
    redirect(`/reset-password`);
  }

  const paramsObj = await searchParams;
  const error_ =
    typeof paramsObj?.error === "string" ? paramsObj?.error : undefined;
  const qParamsErrors: Record<string, string> = qParamsErrorsJson;
  const errorMessage = error_
    ? qParamsErrors[error_ as keyof typeof qParamsErrors] ?? undefined
    : undefined;

  return (
    <AuthLayout copy={authCopy.setPassword}>
      <SetPasswordForm email={email_} token={token} error={errorMessage} />
    </AuthLayout>
  );
}
