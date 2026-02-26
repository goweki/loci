"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  type LucideIcon,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
import InputPhone from "@/components/ui/input-phone";
import AuthErrorHandler, { ERROR_MESSAGES } from "./_errorHandler";
import { loginSchema } from "@/lib/validations/authentication";
import { removePlus } from "@/lib/utils/telHandlers";
import GoogleIcon from "@/components/ui/svg";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import OtpSigninForm from "./otp-request-form";
import { Divider, IconInput } from "./_shared";
import { useI18n } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoginMethod = "email" | "phone";

interface MethodTab {
  value: LoginMethod;
  label: string;
  Icon: LucideIcon;
}

// ─── Method Tabs ──────────────────────────────────────────────────────────────

const METHOD_TABS: MethodTab[] = [
  { value: "email", label: "Email", Icon: Mail },
  { value: "phone", label: "Phone", Icon: Phone },
];

interface MethodTabsProps {
  active: LoginMethod;
  onChange: (value: LoginMethod) => void;
}

function MethodTabs({ active, onChange }: MethodTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      {METHOD_TABS.map(({ value, label, Icon }) => (
        <Button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          variant={active === value ? "secondary" : "ghost"}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}

// ─── Submit Button Label ──────────────────────────────────────────────────────

interface SubmitLabelProps {
  loading: boolean;
  done: boolean;
}

function SubmitLabel({ loading, done }: SubmitLabelProps) {
  if (loading) return <Loader />;
  if (done)
    return (
      <>
        <Check className="h-4 w-4" />
        Signed in!
      </>
    );
  return (
    <>
      Sign In
      <ArrowRight className="h-4 w-4" />
    </>
  );
}

//
export function OtpPopup({
  phoneNumber,
}: {
  // isOpen: boolean;
  // closeDialogue: () => void;
  phoneNumber: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={!phoneNumber} variant="secondary">
          OTP Sign-in
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-popover text-popover-foreground">
        <DialogHeader>
          <DialogTitle>One-Time-Password</DialogTitle>
        </DialogHeader>
        <OtpSigninForm phoneNumber={phoneNumber} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="destructive">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function SignInForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { language } = useI18n();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginMethod: "email",
      email: "",
      phoneNumber: "",
      password: "",
    },
  });

  const loginMethod = useWatch({
    control: form.control,
    name: "loginMethod",
  }) as LoginMethod;

  const phoneNumber = useWatch({
    control: form.control,
    name: "phoneNumber",
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof loginSchema>) => {
      setLoading(true);
      try {
        const username =
          values.loginMethod === "email"
            ? values.email.trim()
            : removePlus(values.phoneNumber);

        const result = await signIn("credentials", {
          redirect: false,
          username,
          password: values.password,
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
        setTimeout(() => {
          router.push(result?.url ?? "/dashboard");
        }, 600);
      } catch {
        toast.error("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const submitLabel = useMemo(
    () => <SubmitLabel loading={loading} done={done} />,
    [loading, done],
  );

  return (
    <>
      {/* Google OAuth */}
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2.5 font-medium"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <Divider label="or sign in with" />

      {/* Credential form */}
      <Form {...form}>
        <AuthErrorHandler />
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Login method toggle */}
          <FormField
            control={form.control}
            name="loginMethod"
            render={({ field }) => (
              <MethodTabs
                active={field.value as LoginMethod}
                onChange={(v) => field.onChange(v)}
              />
            )}
          />

          {/* Email or Phone */}
          {loginMethod === "email" ? (
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
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="flex flex-row items-start gap-2 w-full">
              {/* Phone Number Field - Takes 2/3 of the space */}
              <div className="w-2/3">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputPhone
                          value={field.value}
                          setValue={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* OTP Button - Takes 1/3 of the space */}
              <div className="w-1/3">
                {/* <Button
                  type="button"
                  variant="secondary"
                  disabled={!phoneNumber}
                  className="w-full"
                  onClick={() => toast.custom("otp Logic not implemented")}
                >
                  OTP Sign-in
                </Button> */}
                <OtpPopup phoneNumber={phoneNumber} />
              </div>
            </div>
          )}

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <IconInput
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    suffix={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-full w-10 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={loading || done}
            aria-busy={loading}
          >
            {submitLabel}
          </Button>
        </form>
      </Form>

      {/* Footer links */}
      <div className="flex items-center justify-between text-xs">
        <Link
          href={`/${language}/reset-password`}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Forgot password?
        </Link>
        <Link
          href={`/${language}/sign-up`}
          className="font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          Create account →
        </Link>
      </div>
    </>
  );
}

export default SignInForm;
