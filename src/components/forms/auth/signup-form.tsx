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

interface SignInProps {
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
}

export function SignUpForm(copy: SignInProps) {
  const { emailLabel, passwordLabel, submitLabel } = copy;
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
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
      router.push("/sign-in");
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
        <div>
          <div className="space-x-2">
            <button
              type="button"
              className="hover:scale-105 transition-all duration-200"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <GoogleSignin />
            </button>
          </div>
          <p className="text-mute-foreground">or use your credentials:</p>
        </div>
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
        <div className="py-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {!loading ? submitLabel : <Loader />}
          </Button>
        </div>
        <hr className="my-6 border-t" />
        <div className="flex flex-row justify-between italic text-xs">
          <Link href="/register" className="flex w-fit hover:underline">
            No account? Register
          </Link>

          <Link href="/reset-password" className="flex w-fit hover:underline">
            Forgot Password? Reset
          </Link>
        </div>
      </form>
    </Form>
  );
}
