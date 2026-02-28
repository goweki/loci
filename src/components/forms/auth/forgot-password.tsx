"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  Mail,
  Phone,
  ArrowRight,
  Check,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Loader from "@/components/ui/loaders";
import InputPhone from "@/components/ui/input-phone";
import { WhatsAppLogo } from "@/components/ui/svg";
import { Divider, IconInput } from "./_shared";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { forgotPasswordSchema } from "@/lib/validations";
import { NotificationChannel } from "@/lib/prisma/generated";
import { sendResetLink } from "@/data/user";
import { removePlus } from "@/lib/utils/telHandlers";
import { _sendResetLink } from "./_actions";

export function ForgotPasswordForm() {
  const router = useRouter();
  const { language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      phoneNumber: "",
      notificationChannel: NotificationChannel.EMAIL,
    },
  });

  const notificationChannel = useWatch({
    control: form.control,
    name: "notificationChannel",
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof forgotPasswordSchema>) => {
      setLoading(true);
      try {
        if (
          values.notificationChannel === NotificationChannel.EMAIL &&
          !values.email
        ) {
          throw new Error("Email value missing");
        }
        if (
          values.notificationChannel !== NotificationChannel.EMAIL &&
          !values.phoneNumber
        ) {
          throw new Error("Phone number value missing");
        }

        // console.log("Requesting reset for:", values);

        const res = await _sendResetLink({
          username: values.email || removePlus(values.phoneNumber),
          sendTo: values.notificationChannel,
        });

        // console.log("reset response:", res);

        if (res.error || !res.sentTo) {
          throw new Error(res.error || "Unknown error");
        }

        const messages: Record<string, string> = {
          EMAIL: `Password reset link sent to ${values.notificationChannel}`,
          WHATSAPP: `Password reset link sent to ${values.notificationChannel}`,
          SMS: `Your reset link will be sent via sms shortly.`,
        };

        const message = messages[res.sentTo];
        toast.success(message);
        setDone(true);

        router.push(`/${language}/`);
      } catch (error: any) {
        toast.error(error.message || "Failed to request reset");
      } finally {
        setLoading(false);
      }
    },
    [language, router],
  );

  return (
    <>
      {/* Main Tabs: Email vs Phone */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 mb-6">
        <Button
          type="button"
          variant={
            notificationChannel === NotificationChannel.EMAIL
              ? "secondary"
              : "ghost"
          }
          onClick={() => {
            form.setValue("notificationChannel", NotificationChannel.EMAIL);
          }}
        >
          <Mail className="h-4 w-4" /> Email
        </Button>
        <Button
          type="button"
          variant={
            notificationChannel === NotificationChannel.SMS ||
            notificationChannel === NotificationChannel.WHATSAPP
              ? "secondary"
              : "ghost"
          }
          onClick={() => {
            if (notificationChannel !== NotificationChannel.EMAIL) return;
            form.setValue("notificationChannel", NotificationChannel.WHATSAPP);
          }}
        >
          <Phone className="h-4 w-4" /> Phone
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {notificationChannel === NotificationChannel.EMAIL ? (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormLabel className="text-[11px] uppercase tracking-widest text-muted-foreground w-16 shrink-0">
                    Email
                  </FormLabel>
                  <div className="flex-1">
                    <FormControl>
                      <IconInput
                        icon={Mail}
                        type="email"
                        placeholder="you@company.com"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormLabel className="text-[11px] uppercase tracking-widest text-muted-foreground w-16 shrink-0">
                      Phone
                    </FormLabel>
                    <div className="flex-1">
                      <FormControl>
                        <InputPhone
                          value={field.value}
                          setValue={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sub-selection: WhatsApp vs SMS */}
              <FormField
                control={form.control}
                name="notificationChannel"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight w-16 shrink-0">
                      Send via
                    </FormLabel>
                    <div className="flex flex-1 flex-row gap-2">
                      {[
                        {
                          id: NotificationChannel.WHATSAPP,
                          label: "WhatsApp",
                          icon: WhatsAppLogo,
                        },
                        {
                          id: NotificationChannel.SMS,
                          label: "SMS",
                          icon: MessageSquare,
                        },
                      ].map((method) => {
                        const isActive = field.value === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => field.onChange(method.id)}
                            className={cn(
                              "relative flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2 transition-all",
                              isActive
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
                            )}
                          >
                            <method.icon className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">
                              {method.label}
                            </span>
                            {isActive && (
                              <div className="absolute -right-1 -top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                                <Check className="h-2 w-2" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2 mt-2"
            disabled={loading || done}
          >
            {loading ? (
              <Loader />
            ) : done ? (
              <>
                <Check className="h-4 w-4" /> Reset Link Sent
              </>
            ) : (
              <>
                Send Recovery Link <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Footer links */}
      <div className="flex justify-end text-sm">
        <Link
          href={`/${language}/sign-in`}
          className="font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to sign in →
        </Link>
      </div>
    </>
  );
}
