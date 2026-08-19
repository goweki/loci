"use client";

import { connectWhatsAppAction } from "@/actions/waba.actions";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loaders";
import { toastWarn } from "@/components/ui/toast-warn";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const META_EMBEDDED_CONFIG_ID = process.env.NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID;
const API_VERSION = "v22.0";

interface WabaDetails {
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
}

export default function WabaEmbeddedSignup({ label }: { label?: string }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const wabaDetailsRef = useRef<WabaDetails>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      if (
        !event.origin.includes("facebook.com") &&
        !event.origin.includes("whatsapp.com")
      ) {
        return;
      }

      try {
        const payload =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (
          payload.type === "WA_EMBEDDED_SIGNUP" &&
          payload.event === "FINISH"
        ) {
          const { waba_id, phone_number_id, business_id } = payload.data || {};
          wabaDetailsRef.current = { waba_id, phone_number_id, business_id };
        }
      } catch (err) {
        // Ignore unrelated messages
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

  const handleLogin = () => {
    if (!sdkReady) {
      toast.error("Facebook SDK not ready");
      return;
    }

    setLoading(true);

    const handleLoginResponse = async (response: any) => {
      try {
        if (response.authResponse?.code) {
          const code = response.authResponse.code;
          const wabaData = wabaDetailsRef.current;

          if (!wabaData) {
            throw new Error("WhatsApp Business account details are missing");
          }

          const res = await connectWhatsAppAction({
            code,
            waba_id: wabaData.waba_id,
            phone_number_id: wabaData.phone_number_id,
            business_id: wabaData.business_id,
          });

          if (res.ok) {
            toast.success("WhatsApp account connected and saved!");
            setIsLinked(true);
          } else {
            toast.error(res.error || "Failed to process linkage");
          }
        } else {
          toastWarn("Meta authentication cancelled");
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

    try {
      (window as any).FB.login(
        (response: any) => {
          // FB.login requires a regular synchronous callback.
          // Start the async operation without returning its Promise.
          void handleLoginResponse(response);
        },
        {
          config_id: META_EMBEDDED_CONFIG_ID,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
          },
        },
      );
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
