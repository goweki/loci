"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

export const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Error in constructing an authorization URL",
  OAuthCallback: "Error in handling the response from OAuth provider",
  OAuthCreateAccount: "Could not create user",
  EmailCreateAccount: "Could not create user",
  Callback: "Error in the OAuth callback handler route",
  OAuthAccountNotLinked:
    "Email is already linked, but not with this OAuth account",
  EmailSignin: "Sending the e-mail with verification token failed",
  CredentialsSignin: "Invalid credentials",
  SessionRequired: "The content of this page requires you to be signed in",
  Default: "An error occurred",
};

export default function AuthErrorHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    const message = ERROR_MESSAGES[error] || ERROR_MESSAGES["Default"];
    toast.error(message);
  }, [searchParams]);

  return null;
}
