"use client";

import { useEffect } from "react";
import Script from "next/script";
import { Button } from "../ui/button";
import { useI18n } from "@/lib/i18n";

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const WABA_EMBEDDED_CONFIG_ID = process.env.NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID;

if (!FACEBOOK_APP_ID) {
  throw new Error("missing process.env.NEXT_PUBLIC_FACEBOOK_APP_ID");
}

if (!WABA_EMBEDDED_CONFIG_ID) {
  throw new Error("missing process.env.NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID");
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

interface WhatsAppEmbeddedSignupProps {
  apiVersion?: string;
  onSuccess?: (code: string) => void;
  onError?: (error: any) => void;
  onSessionInfo?: (data: any) => void;
}

const translations = {
  en: { submit: "Connect WhatsApp Business" },
  sw: { submit: "Unganisha WhatsApp Business" },
};

export default function WhatsAppEmbeddedSignup({
  apiVersion = "v22.0",
  onSuccess,
  onError,
  onSessionInfo,
}: WhatsAppEmbeddedSignupProps) {
  const { language } = useI18n();

  const t = translations[language];

  useEffect(() => {
    // SDK initialization
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: apiVersion,
      });
    };

    // Session logging message event listener
    const handleMessage = async (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;

      try {
        const data = JSON.parse(event.data);

        if (data.type === "WA_EMBEDDED_SIGNUP") {
          console.log("WhatsApp Embedded Signup event:", data);

          // NEW — Send to server
          // await logWabaEvent(data);

          if (onSessionInfo) onSessionInfo(data);
        }
      } catch {
        console.log("Message event (non-JSON):", event.data);

        // Still send raw string for logging
        // await logWabaEvent({ event: "NON_JSON", raw: event.data });
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [FACEBOOK_APP_ID, apiVersion, onSessionInfo]);

  // Response callback
  const fbLoginCallback = (response: any) => {
    if (response.authResponse) {
      const code = response.authResponse.code;
      console.log("Authorization code received:", code);
      if (onSuccess) {
        onSuccess(code);
      }
    } else {
      console.log("Login failed or was cancelled:", response);
      if (onError) {
        onError(response);
      }
    }
  };

  // Launch WhatsApp signup
  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      console.error("Facebook SDK not loaded yet");
      return;
    }

    window.FB.login(fbLoginCallback, {
      config_id: WABA_EMBEDDED_CONFIG_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: {
        setup: {},
      },
    });
  };

  return (
    <>
      {/* Load Facebook SDK */}
      <Script
        id="facebook-sdk"
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        async
        defer
        crossOrigin="anonymous"
      />

      {/* Launch button */}
      <Button onClick={launchWhatsAppSignup}>{t.submit}</Button>
    </>
  );
}
