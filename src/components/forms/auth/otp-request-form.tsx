"use client";

import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import {
  MessageCircle,
  Smartphone,
  ArrowRight,
  Check,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loaders";
import { cn } from "@/lib/utils";
import { NotificationChannel } from "@/lib/prisma/generated";
import { WhatsAppLogo } from "@/components/ui/svg";
import { getUserByKey } from "@/data/user";
import { removePlus } from "@/lib/utils/telHandlers";
import { sendOtp } from "./_actions";
import { InputOTP } from "./_input-otp";
import { signIn } from "next-auth/react";
import { ERROR_MESSAGES } from "./_errorHandler";

// ─────────────────────────────────────
// Types
// ─────────────────────────────────────

type OtpMode = "WHATSAPP" | "SMS";

interface Props {
  phoneNumber: string;
}

// ─────────────────────────────────────
// Schema
// ─────────────────────────────────────

const otpSchema = z.object({
  mode: z.enum([NotificationChannel.WHATSAPP, NotificationChannel.SMS]),
  code: z.string().length(4, "Enter the code received").optional(),
});

// ─────────────────────────────────────
// Mode Selector
// ─────────────────────────────────────

function ModeSelector({
  value,
  onChange,
}: {
  value?: OtpMode;
  onChange: (mode: OtpMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        onClick={() => onChange("WHATSAPP")}
        variant={value === "WHATSAPP" ? "secondary" : "outline"}
      >
        <WhatsAppLogo className="h-4 w-4" />
        WhatsApp
      </Button>

      <Button
        type="button"
        onClick={() => onChange("SMS")}
        variant={value === "SMS" ? "secondary" : "outline"}
      >
        <MessageSquare className="h-4 w-4" />
        SMS
      </Button>
    </div>
  );
}

// ─────────────────────────────────────
// Submit Label
// ─────────────────────────────────────

function SubmitLabel({
  loading,
  done,
  step,
}: {
  loading: boolean;
  done: boolean;
  step: number;
}) {
  if (loading) return <Loader />;

  if (done)
    return (
      <>
        <Check className="h-4 w-4" />
        Verified
      </>
    );

  return (
    <>
      {step === 1 ? "Send OTP" : "Verify"}
      <ArrowRight className="h-4 w-4" />
    </>
  );
}

// ─────────────────────────────────────
// Main Component
// ─────────────────────────────────────

export function OtpSigninForm({ phoneNumber }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [otpChannel, setOtpChannel] = useState<OtpMode>("WHATSAPP");
  const [otpVal, setOtpVal] = useState<string>("");

  const verifyUserAndSendOtp = useCallback(async () => {
    setLoading(true);

    try {
      const user = await getUserByKey(removePlus(phoneNumber));

      if (!user) {
        toast.error("User not found. Verify contact provided.");
        return;
      }

      const sendRes = await sendOtp({
        notificationChannel: otpChannel,
        contact: phoneNumber,
      });
      if (!sendRes) {
        toast.error("OTP not sent");
        return;
      }

      setStep(2);
    } catch {
      toast.error("Failed to verify user");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtpAndSignin = useCallback(async () => {
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: removePlus(phoneNumber),
        password: otpVal,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        const message =
          ERROR_MESSAGES[result.error as keyof typeof ERROR_MESSAGES] ??
          "Failed to sign in";
        toast.error(message);
        return;
      }
      setDone(true);

      toast.success("Signed in");
    } catch {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmit = useCallback(async () => {
    if (step === 1) {
      return verifyUserAndSendOtp();
    }

    return verifyOtpAndSignin();
  }, [step, verifyUserAndSendOtp, verifyOtpAndSignin]);

  const submitLabel = useMemo(
    () => <SubmitLabel loading={loading} done={done} step={step} />,
    [loading, done, step],
  );

  return (
    <form className="space-y-4 pt-4">
      {/* Phone Display */}

      <div className="text-center text-sm text-muted-foreground">
        {step === 1
          ? "Select a channel to receive the One-Time-Password"
          : `One-Time-Passcode sent via ${otpChannel}`}
        <div className="font-medium text-foreground mb-6">{phoneNumber}</div>
      </div>

      {/* Step 1 */}

      {step === 1 && (
        <div>
          <ModeSelector
            value={otpChannel}
            onChange={(mode) => setOtpChannel(mode)}
          />
        </div>
      )}

      {/* Step 2 */}

      {step === 2 && <InputOTP value={otpVal} setValue={setOtpVal} />}

      {/* Submit */}

      <div className="pt-4">
        <Button
          type="button"
          className={`w-full`}
          disabled={loading || done}
          onClick={onSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default OtpSigninForm;
