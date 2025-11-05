"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { InputWithIcon } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import GoogleSignin from "@/components/ui/svg";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loaders";
import AuthErrorHandler, { ERROR_MESSAGES } from "./_errorHandler";
import { registerSchema } from "@/lib/validations";
import { createUser } from "@/data/user";
import { useI18n } from "@/lib/i18n";

const translations = {
  en: { submit: "Sign Up", orCredentials: "or use your Credentials" },
  sw: { submit: "Jisajili", orCredentials: "au tumia Barua pepe kuingia" },
};

export function SignUpForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { language } = useI18n();
  const t = translations[language];

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      verificationMethod: "whatsapp",
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    setLoading(true);
    console.log(values);
    const { name, email, password } = values;
    try {
      const result = await createUser({
        name,
        email,
        password,
      });
      console.log(result);
      toast.success("Sign in to continue");
      router.push(`/${language}/sign-in`);
    } catch (error) {
      toast.error("Failed. Try again later");
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <AuthErrorHandler />
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 text-start"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputWithIcon
                  icon={UserIcon}
                  className="placeholder:italic placeholder:opacity-50"
                  placeholder="Your preferred name"
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputWithIcon
                  icon={Mail}
                  className="placeholder:italic placeholder:opacity-50"
                  placeholder="loci@goweki.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <InputWithIcon
                    icon={Lock}
                    type="password"
                    placeholder="Password"
                    className="placeholder:italic placeholder:opacity-50"
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <InputWithIcon
                    icon={Lock}
                    type="password"
                    placeholder="Confirm password"
                    className="placeholder:italic placeholder:opacity-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <InputWithIcon
                    icon={Lock}
                    type="password"
                    placeholder="Confirm password"
                    className="placeholder:italic placeholder:opacity-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <div className="py-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {!loading ? t.submit : <Loader />}
          </Button>
        </div>
        <hr className="my-6 border-t" />
        <div className="flex flex-row justify-between italic text-xs">
          <Link
            href={`/${language}/sign-in`}
            className="flex w-fit hover:underline"
          >
            Already registered?
          </Link>

          <Link
            href={`/${language}/reset-password`}
            className="flex w-fit hover:underline"
          >
            Forgot Password? Reset
          </Link>
        </div>
      </form>
    </Form>
  );
}
