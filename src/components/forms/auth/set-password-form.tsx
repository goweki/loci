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
import { Eye, EyeOff, Lock, User as UserIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import GoogleSignin from "@/components/ui/svg";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loaders";
import AuthErrorHandler, { ERROR_MESSAGES } from "./_errorHandler";

const formSchema = z.object({
  username: z.email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(5, { message: "Password must be at least 5 characters" })
    .max(16, { message: "Password must be less than 16 characters" }),
});

interface SignInProps {
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
}

export function SetPasswordForm(copy: SignInProps) {
  const { emailLabel, passwordLabel, submitLabel } = copy;
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const { username, password } = values;

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    setLoading(false);

    if (result?.error) {
      const error_ =
        typeof result.error === "string" ? result.error : undefined;
      const errorMessage = error_
        ? ERROR_MESSAGES[error_ as keyof typeof ERROR_MESSAGES] ?? error_
        : "Failed to sign in. Try again later";
      toast.error(errorMessage);
    } else {
      router.push("/dashboard");
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputWithIcon
                  icon={UserIcon}
                  className="placeholder:italic placeholder:opacity-50"
                  placeholder="loci@goweki.com..."
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
                <div className="relative">
                  <FormControl>
                    <InputWithIcon
                      icon={Lock}
                      type={showPassword ? "text" : "password"}
                      {...field}
                      className="pr-10"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
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
