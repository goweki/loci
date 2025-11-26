"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Plus } from "lucide-react";

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const WABA_EMBEDDED_CONFIG_ID = process.env.NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID;
const API_VERSION = "v22.0";

if (!FACEBOOK_APP_ID) {
  throw new Error("missing process.env.NEXT_PUBLIC_FACEBOOK_APP_ID");
}

if (!WABA_EMBEDDED_CONFIG_ID) {
  throw new Error("missing process.env.NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID");
}

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

interface WhatsAppEmbeddedSignupProps {
  onSuccess?: (code: string) => void;
  onError?: (error: any) => void;
  onSessionInfo?: (data: any) => void;
}

const translations = {
  en: { submit: "Connect WhatsApp Number" },
  sw: { submit: "Unganisha Number ya WhatsApp" },
};

export default function WhatsAppEmbeddedSignup({
  onSuccess,
  onError,
  onSessionInfo,
}: WhatsAppEmbeddedSignupProps) {
  const { language } = useI18n();
  const [sdkReady, setSdkReady] = useState(false);
  const t = translations[language];

  useEffect(() => {
    // Initialize SDK
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        autoLogAppEvents: true,
        version: API_VERSION,
      });

      setSdkReady(true);
    };

    // Session logging
    const handleMessage = async (event: MessageEvent) => {
      if (
        !event.origin.includes("facebook.com") &&
        !event.origin.includes("fbcdn.net")
      )
        return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          console.log("Embedded Signup event:", data);
          onSessionInfo?.(data);
        }
      } catch {
        console.log("Non-JSON message:", event.data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSessionInfo]);

  const fbLoginCallback = (response: any) => {
    if (response.authResponse) {
      const code = response.authResponse.code;
      console.log("Authorization code:", code);
      onSuccess?.(code);
    } else {
      console.log("Login failed or cancelled:", response);
      onError?.(response);
    }
  };

  const launchWhatsAppSignup = () => {
    if (!sdkReady) {
      console.error("Facebook SDK not ready yet");
      return;
    }

    window.FB.login(fbLoginCallback, {
      config_id: WABA_EMBEDDED_CONFIG_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: { setup: {} },
    });
  };

  return (
    <>
      {/* Facebook SDK */}
      <Script
        id="facebook-sdk"
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        async
        defer
        crossOrigin="anonymous"
      />

      {/* Launch button */}
      {sdkReady ? (
        <Button
          onClick={launchWhatsAppSignup}
          className="flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" /> <span>{t.submit}</span>
        </Button>
      ) : null}
    </>
  );
}
