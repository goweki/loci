"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  User,
  Mail,
  Phone,
  ArrowRight,
  Check,
  MessageSquare,
  Smartphone,
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
import GoogleIcon, { WhatsAppLogo } from "@/components/ui/svg";
import { Divider, IconInput } from "./_shared";
import { signUpSchema } from "@/lib/validations/authentication";
import { cn } from "@/lib/utils";
import { registerUser } from "@/data/user";
import { removePlus } from "@/lib/utils/telHandlers";
import { useI18n } from "@/lib/i18n";
import { signUpUser } from "./_actions";

// Mocking the enum if not imported
enum NotificationChannel {
  SMS = "SMS",
  WHATSAPP = "WHATSAPP",
  EMAIL = "EMAIL",
}

type SignupMethod = "email" | "phone";

export function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [activeTab, setActiveTab] = useState<SignupMethod>("email");
  const { language } = useI18n();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      verificationMethod: NotificationChannel.EMAIL,
    },
  });

  const verificationMethod = useWatch({
    control: form.control,
    name: "verificationMethod",
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof signUpSchema>) => {
      setLoading(true);
      try {
        console.log("Signup Values:", values);

        const { name, email, phoneNumber, verificationMethod } = values;
        if (!email && !phoneNumber) {
          return toast.error("An email or PhoneNo. is required");
        }

        if (verificationMethod === NotificationChannel.EMAIL && !email) {
          return toast.error("Email ERROR");
        } else if (!phoneNumber) {
          return toast.error("Phone Number ERROR");
        }

        const signupRes = await signUpUser({
          name,
          email: verificationMethod === "EMAIL" ? email : undefined,
          tel: phoneNumber ? removePlus(phoneNumber) : undefined,
          verificationMethod,
        });

        if (!signupRes.success) {
          toast.error(signupRes.message);
          return;
        }

        setDone(true);
        toast.success("Account created successfully!");
        console.log(signupRes);
        router.push(`/${language}/sign-in`);
      } catch {
        toast.error("Failed to create account.");
      } finally {
        setLoading(false);
      }
    },
    [router, language],
  );

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2.5 font-medium"
        onClick={() => {}}
      >
        <GoogleIcon />
        Sign up with Google
      </Button>

      <Divider label="or sign up with" />

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 mb-4">
        <Button
          type="button"
          variant={activeTab === "email" ? "secondary" : "ghost"}
          onClick={() => {
            setActiveTab("email");
            form.setValue("verificationMethod", NotificationChannel.EMAIL);
          }}
        >
          <Mail className="h-4 w-4" /> Email
        </Button>
        <Button
          type="button"
          variant={activeTab === "phone" ? "secondary" : "ghost"}
          onClick={() => {
            setActiveTab("phone");
            form.setValue("verificationMethod", NotificationChannel.WHATSAPP);
          }}
        >
          <Phone className="h-4 w-4" /> Phone
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field - Always visible */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <IconInput icon={User} placeholder="Full Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {activeTab === "email" ? (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <IconInput
                      icon={Mail}
                      type="email"
                      placeholder="you@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormLabel className="text-[11px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
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

              {/* Verification Method Selection */}
              <FormField
                control={form.control}
                name="verificationMethod"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    {/* Label with wrapping capability but limited width */}
                    <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight w-20 shrink-0">
                      Verification Channel
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={loading || done}
          >
            {loading ? (
              <Loader />
            ) : done ? (
              <>
                <Check className="h-4 w-4" /> check {verificationMethod} to
                continue
              </>
            ) : (
              <>
                Send Onboarding Link <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-xs">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href={`/${language}/sign-in`}
          className="font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign In →
        </Link>
      </div>
    </>
  );
}
