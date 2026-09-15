"use client";

import { connectWhatsAppAction } from "@/actions/waba.actions";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loaders";
import { toastWarn } from "@/components/ui/toast-warn";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const META_EMBEDDED_CONFIG_ID = process.env.NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID;
const API_VERSION = "v22.0";

interface WabaDetails {
  code?: string;
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
}

export default function WabaEmbeddedSignup({ label }: { label?: string }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  const wabaDetailsRef = useRef<WabaDetails | null>(null);
  const router = useRouter();

  // 1. PostMessage Listener for Meta Auth & Embedded Signup Data
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      // Basic origin check
      if (
        !event.origin.includes("facebook.com") &&
        !event.origin.includes("whatsapp.com")
      ) {
        return;
      }

      try {
        let rawData = event.data;

        // CASE A: Query string format (e.g. "cb=fdb9...&code=AQI3trlz...")
        if (typeof rawData === "string" && rawData.includes("code=")) {
          const params = new URLSearchParams(rawData);
          const code = params.get("code");

          if (code) {
            console.log("Captured Auth Code from postMessage:", code);
            wabaDetailsRef.current = {
              ...wabaDetailsRef.current,
              code,
            };
          }
          return;
        }

        // CASE B: JSON format (standard payload schema)
        if (typeof rawData === "string") {
          if (!rawData.trim().startsWith("{")) return;
          rawData = JSON.parse(rawData);
        }

        const dataObj = rawData?.data || rawData;
        const waba_id = dataObj?.waba_id || rawData?.waba_id;
        const phone_number_id =
          dataObj?.phone_number_id || rawData?.phone_number_id;
        const business_id = dataObj?.business_id || rawData?.business_id;

        if (waba_id || phone_number_id || business_id) {
          console.log("Captured WABA details from postMessage JSON:", {
            waba_id,
            phone_number_id,
            business_id,
          });
          wabaDetailsRef.current = {
            ...wabaDetailsRef.current,
            waba_id,
            phone_number_id,
            business_id,
          };
        }
      } catch (err) {
        // Ignore parsing errors from unknown window messages
      }
    };

    window.addEventListener("message", handleMessage);

    if ((window as any).FB) {
      setSdkReady(true);
    } else if (!document.getElementById("facebook-jssdk")) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.onerror = () => toast.error("Failed to load Facebook SDK");
      document.body.appendChild(js);

      (window as any).fbAsyncInit = () => {
        (window as any).FB.init({
          appId: META_APP_ID,
          xfbml: true,
          version: API_VERSION,
        });
        setSdkReady(true);
      };
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // 2. Poll helper to wait until the code or details arrive
  const waitForAuthData = (timeoutMs = 4000): Promise<WabaDetails | null> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (wabaDetailsRef.current?.code || wabaDetailsRef.current?.waba_id) {
          clearInterval(interval);
          resolve(wabaDetailsRef.current);
        } else if (Date.now() - startTime > timeoutMs) {
          clearInterval(interval);
          resolve(wabaDetailsRef.current); // Return whatever was captured, if anything
        }
      }, 100);
    });
  };

  // 3. Initiate Login Flow
  const handleLogin = () => {
    if (!sdkReady) {
      toast.error("Facebook SDK not ready");
      return;
    }

    wabaDetailsRef.current = null; // Clear previous attempt
    setLoading(true);

    const onLoginCallback = (response: any) => {
      const processLogin = async () => {
        try {
          // Wait up to 4s for postMessage to capture the payload data
          const capturedData = await waitForAuthData();

          // Code can come from either response.authResponse or postMessage parameters
          const code = response.authResponse?.code || capturedData?.code;

          if (!code) {
            toastWarn("Meta authentication cancelled or code missing");
            return;
          }

          const res = await connectWhatsAppAction({
            code,
            waba_id: capturedData?.waba_id,
            phone_number_id: capturedData?.phone_number_id,
            business_id: capturedData?.business_id,
          });

          if (res.ok) {
            toast.success("WhatsApp account connected and saved!");
            setIsLinked(true);
            router.refresh();
          } else {
            toast.error(res.error || "Failed to process linkage");
          }
        } catch (error) {
          console.error("WhatsApp connection error:", error);
          toastWarn(
            error instanceof Error
              ? error.message
              : "Meta authentication failed, try again later",
          );
        } finally {
          setLoading(false);
        }
      };

      void processLogin();
    };

    try {
      (window as any).FB.login(onLoginCallback, {
        config_id: META_EMBEDDED_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {} },
      });
    } catch (error) {
      console.error("Facebook login error:", error);
      toastWarn(
        error instanceof Error
          ? error.message
          : "Meta authentication failed, try again later",
      );
      setLoading(false);
    }
  };

  return (
    <div>
      {isLinked ? (
        <p className="text-green-600 font-medium">
          ✓ WhatsApp Successfully Linked
        </p>
      ) : (
        <Button onClick={handleLogin} disabled={!sdkReady || loading}>
          {loading ? <Loader /> : label || "Integrate new Whatsapp Chatbot"}
        </Button>
      )}
    </div>
  );
}
