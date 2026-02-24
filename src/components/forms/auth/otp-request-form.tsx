"use client";

import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { MessageCircle, Smartphone, ArrowRight, Check } from "lucide-react";

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
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </Button>

      <Button
        type="button"
        onClick={() => onChange("SMS")}
        variant={value === "SMS" ? "secondary" : "ghost"}
      >
        <Smartphone className="h-4 w-4" />
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

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      mode: "WHATSAPP",
      code: "",
    },
  });

  const sendOtp = useCallback(async (mode: OtpMode) => {
    setLoading(true);

    try {
      // TODO replace with API

      await new Promise((r) => setTimeout(r, 800));

      toast.success(`OTP sent via ${mode}`);

      setStep(2);
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (values: z.infer<typeof otpSchema>) => {
    setLoading(true);

    try {
      // TODO replace with API

      await new Promise((r) => setTimeout(r, 800));

      if (values.code !== "1234") {
        toast.error("Invalid code");

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

  const onSubmit = useCallback(
    async (values: z.infer<typeof otpSchema>) => {
      if (step === 1) {
        return sendOtp(values.mode);
      }

      return verifyOtp(values);
    },
    [step, sendOtp, verifyOtp],
  );

  const submitLabel = useMemo(
    () => <SubmitLabel loading={loading} done={done} step={step} />,
    [loading, done, step],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        {/* Phone Display */}

        <div className="text-center text-sm text-muted-foreground">
          <div className="font-medium text-foreground mb-6">{phoneNumber}</div>
        </div>

        {/* Step 1 */}

        {step === 1 && (
          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ModeSelector value={field.value} onChange={field.onChange} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Step 2 */}

        {step === 2 && (
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="1234"
                    maxLength={4}
                    className="text-center text-lg tracking-widest"
                    autoFocus
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Submit */}

        <div className="py-4">
          <Button className="w-full" disabled={loading || done}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default OtpSigninForm;
