"use client";

import {
  connectWhatsAppAction,
  registerWhatsAppPhoneNumberAction,
} from "@/actions/waba.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/ui/loaders";
import { toastWarn } from "@/components/ui/toast-warn";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const META_EMBEDDED_CONFIG_ID = process.env.NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID;
const API_VERSION = "v22.0";
const COMPLETION_EVENTS = new Set([
  "FINISH",
  "FINISH_ONLY_WABA",
  "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
  "FINISH_GRANT_ONLY_API_ACCESS",
]);

interface SignupDetails {
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
}

interface SignupEvent {
  event: string;
  data: SignupDetails & { error_message?: string; current_step?: string };
}

function normalizeMetaId(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return String(value);
  }
  return undefined;
}

export default function WabaEmbeddedSignup({
  label,
  phoneNumberId,
}: {
  label?: string;
  phoneNumberId?: string;
}) {
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationPending, setRegistrationPending] = useState(false);
  const [registrationPhoneId, setRegistrationPhoneId] = useState<string | null>(
    null,
  );
  const [pin, setPin] = useState("");

  const signupActiveRef = useRef(false);
  const signupEventRef = useRef<SignupEvent | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let origin: URL;
      try {
        origin = new URL(event.origin);
      } catch {
        return;
      }
      if (
        origin.protocol !== "https:" ||
        (origin.hostname !== "facebook.com" &&
          !origin.hostname.endsWith(".facebook.com")) ||
        !signupActiveRef.current
      ) {
        return;
      }

      try {
        const payload =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (payload?.type !== "WA_EMBEDDED_SIGNUP") return;

        const signupEvent: SignupEvent = {
          event: String(payload.event ?? "").toUpperCase(),
          data: {
            waba_id: normalizeMetaId(payload.data?.waba_id),
            phone_number_id: normalizeMetaId(payload.data?.phone_number_id),
            business_id: normalizeMetaId(
              payload.data?.business_id ?? payload.data?.businessId,
            ),
            error_message: payload.data?.error_message,
            current_step: payload.data?.current_step,
          },
        };
        signupEventRef.current = signupEvent;
      } catch {
        // Ignore unrelated or non-JSON messages from the trusted origin.
      }
    };

    window.addEventListener("message", handleMessage);
    if ((window as Window & { FB?: unknown }).FB) {
      setSdkReady(true);
    } else if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.onerror = () => toast.error("Failed to load Facebook SDK");
      document.body.appendChild(script);

      (window as Window & { fbAsyncInit?: () => void }).fbAsyncInit = () => {
        (window as unknown as Window & { FB: any }).FB.init({
          appId: META_APP_ID,
          xfbml: true,
          version: API_VERSION,
        });
        setSdkReady(true);
      };
    }

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const waitForSignupEvent = (timeoutMs = 8000) =>
    new Promise<SignupEvent | null>((resolve) => {
      const startedAt = Date.now();
      const interval = window.setInterval(() => {
        const event = signupEventRef.current;
        if (
          event &&
          (COMPLETION_EVENTS.has(event.event) ||
            event.event === "CANCEL" ||
            event.event === "ERROR")
        ) {
          window.clearInterval(interval);
          resolve(event);
        } else if (Date.now() - startedAt >= timeoutMs) {
          window.clearInterval(interval);
          resolve(event);
        }
      }, 100);
    });

  const handleLogin = () => {
    if (phoneNumberId) {
      setRegistrationPhoneId(phoneNumberId);
      setRegistrationOpen(true);
      return;
    }
    if (!sdkReady) {
      toast.error("Facebook SDK not ready");
      return;
    }

    signupEventRef.current = null;
    signupActiveRef.current = true;
    setLoading(true);

    const callback = (response: any) => {
      void (async () => {
        try {
          const code = response?.authResponse?.code;
          if (!code) {
            toastWarn(
              "Meta authentication was cancelled or no code was returned.",
            );
            return;
          }

          const signupEvent = await waitForSignupEvent();
          if (!signupEvent || !COMPLETION_EVENTS.has(signupEvent.event)) {
            toast.error(
              signupEvent?.data.error_message ||
                "Meta signup did not finish. Please retry and complete the full flow.",
            );
            return;
          }
          if (!signupEvent.data.waba_id) {
            toast.error(
              "Meta did not return the WhatsApp Business Account ID.",
            );
            return;
          }

          const result = await connectWhatsAppAction({
            code,
            waba_id: signupEvent.data.waba_id,
            phone_number_id: signupEvent.data.phone_number_id,
            business_id: signupEvent.data.business_id,
          });
          if (!result.ok) {
            toast.error(result.error || "Failed to connect WhatsApp.");
            return;
          }

          if (result.data.registrationRequired) {
            setRegistrationPhoneId(result.data.phoneNumberId);
            setRegistrationOpen(true);
            toast.success(
              "WhatsApp account connected. Finish phone registration to enable messaging.",
            );
          } else {
            toast.success("WhatsApp account connected and ready.");
          }
          router.refresh();
        } catch (error) {
          console.error("WhatsApp connection error:", error);
          toastWarn(
            error instanceof Error
              ? error.message
              : "Meta authentication failed. Please try again.",
          );
        } finally {
          signupActiveRef.current = false;
          setLoading(false);
        }
      })();
    };

    try {
      (window as unknown as Window & { FB: any }).FB.login(callback, {
        config_id: META_EMBEDDED_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, sessionInfoVersion: 3 },
      });
    } catch (error) {
      signupActiveRef.current = false;
      console.error("Facebook login error:", error);
      toastWarn(
        error instanceof Error
          ? error.message
          : "Meta authentication failed. Please try again.",
      );
      setLoading(false);
    }
  };

  const registerPhoneNumber = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!registrationPhoneId || !/^\d{6}$/.test(pin)) return;
    setRegistrationPending(true);
    void (async () => {
      try {
        const result = await registerWhatsAppPhoneNumberAction(
          registrationPhoneId,
          pin,
        );
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Phone number registered with WhatsApp.");
        setRegistrationOpen(false);
        setRegistrationPhoneId(null);
        setPin("");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Phone registration failed.",
        );
      } finally {
        setRegistrationPending(false);
      }
    })();
  };

  return (
    <>
      <Button
        onClick={handleLogin}
        disabled={(!phoneNumberId && !sdkReady) || loading}
      >
        {loading ? <Loader /> : label || "Integrate new WhatsApp chatbot"}
      </Button>

      <Dialog
        open={registrationOpen}
        onOpenChange={(open) => {
          if (!registrationPending) setRegistrationOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register your WhatsApp number</DialogTitle>
            <DialogDescription>
              Enter the six-digit two-step verification PIN for this phone
              number. Meta uses it to finish Cloud API registration.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={registerPhoneNumber} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-registration-pin">Six-digit PIN</Label>
              <Input
                id="whatsapp-registration-pin"
                inputMode="numeric"
                autoComplete="one-time-code"
                type="password"
                pattern="[0-9]{6}"
                maxLength={6}
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRegistrationOpen(false)}
                disabled={registrationPending}
              >
                Do this later
              </Button>
              <Button
                type="submit"
                disabled={registrationPending || pin.length !== 6}
              >
                {registrationPending ? <Loader /> : "Register phone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
