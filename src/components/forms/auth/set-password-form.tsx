"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  ShieldCheck,
  AlertCircle,
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
import { Divider, IconInput } from "./_shared";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { setPasswordSchema } from "@/lib/validations";
// import { verifyToken } from "@/data/user";
import { _verifyToken, setNewPassword } from "./_actions";
import Link from "next/link";

export default function SetPasswordForm({
  token,
  username,
}: {
  token: string;
  username: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useI18n();

  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      username: searchParams.get("username") || "",
      token: searchParams.get("token") || "",
      password: "",
      confirmPassword: "",
    },
  });

  // 00 - Initial Token Validation
  useEffect(() => {
    const checkToken = async () => {
      if (!username || !token) {
        setIsTokenValid(false);
        setIsValidating(false);
        return;
      }

      try {
        const isValid = await _verifyToken({ username, token });
        setIsTokenValid(isValid.verification);
      } catch {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    checkToken();
  }, [searchParams]);

  // 2. Form Submission
  const onSubmit = useCallback(
    async (values: z.infer<typeof setPasswordSchema>) => {
      setIsUpdating(true);
      try {
        const res_ = await setNewPassword(values);
        if (res_) {
          toast.success("Password updated successfully");
          setTimeout(() => router.push(`/${language}/sign-in`), 1500);
        } else {
          throw new Error("Failed to update password");
        }
      } catch (error: any) {
        toast.error(error.message);
        setIsUpdating(false);
      }
    },
    [router, language],
  );

  // Loading State
  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <Loader />
        <p className="text-sm text-muted-foreground animate-pulse">
          Validating security token...
        </p>
      </div>
    );
  }

  // Invalid Token State
  if (!isTokenValid) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Invalid or Expired Link</h2>
        <p className="text-sm text-muted-foreground">
          This password reset link is no longer valid. Please request a new one.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/${language}/forgot-password`}>Go Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Read-Only Username */}
        <div className="flex flex-row items-center gap-3 px-1 py-2 rounded-lg bg-muted/30 border border-dashed border-border/60">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground w-16 shrink-0 ml-2">
            Account
          </span>
          <span className="text-xs font-mono font-medium truncate">
            {form.getValues("username")}
          </span>
        </div>

        <Divider label="Security Details" />

        {/* New Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3 space-y-0">
              <FormLabel className="text-[11px] uppercase tracking-widest text-muted-foreground w-16 shrink-0">
                New
              </FormLabel>
              <div className="flex-1">
                <FormControl>
                  <IconInput
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    suffix={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-full w-10 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
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
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3 space-y-0">
              <FormLabel className="text-[11px] uppercase tracking-widest text-muted-foreground w-16 shrink-0">
                Confirm
              </FormLabel>
              <div className="flex-1">
                <FormControl>
                  <IconInput
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full gap-2 mt-4"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader />
          ) : (
            <>
              Update Password <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
