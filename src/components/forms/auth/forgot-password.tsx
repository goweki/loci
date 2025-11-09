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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputWithIcon } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import GoogleSignin from "@/components/ui/svg";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loaders";
import AuthErrorHandler, { ERROR_MESSAGES } from "./_errorHandler";
import { forgotPasswordSchema } from "@/lib/validations";
import { registerUser, sendResetLink } from "@/data/user";
import { useI18n } from "@/lib/i18n";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import InputPhone from "@/components/ui/input-phone";

const translations = {
  en: { submit: "Send Link", orCredentials: "or use your Credentials" },
  sw: { submit: "Tuma Linki", orCredentials: "au tumia Barua pepe kuingia" },
};

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { language } = useI18n();
  const t = translations[language];

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      phoneNumber: "",
      username: "email",
    },
  });

  const { watch, setValue } = form;
  const username = watch("username");

  useEffect(() => {
    if (username === "whatsapp") {
      setValue("email", "");
    } else if (username === "email") {
      setValue("phoneNumber", "");
    }
  }, [username, setValue]);

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    setLoading(true);
    // console.log(values);
    const { email, phoneNumber, username } = values;
    if (!email && !phoneNumber) {
      return toast.error("An email or PhoneNo. is required");
    }

    try {
      const result = await sendResetLink({
        username: email || phoneNumber,
        sendTo: username,
      });

      if (!result) {
        throw new Error("Error sending reset link");
      }
      const sentTo = result.sentTo;

      const messages: Record<string, string> = {
        email: `Password reset link sent to ${username}`,
        whatsapp: `Whatsapp +777833003 to get the reset link`,
        sms: `Your reset link will be sent via sms shortly.`,
      };

      const message = messages[sentTo];
      toast.success(message);
    } catch (error) {
      console.log("Error sending reset link:", error);
      toast.error(error.message || "Failed. Try again later");
    } finally {
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
          name="username"
          render={({ field }) => {
            return (
              <FormItem className="space-y-3">
                <FormLabel>
                  Select a method method to get a password reset link
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="email" />
                      </FormControl>
                      <FormLabel className="font-normal">Email</FormLabel>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <InputWithIcon
                                disabled={username !== "email"}
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
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="whatsapp" />
                      </FormControl>
                      <FormLabel className="font-normal">WhatsApp</FormLabel>
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <InputPhone
                                disabled={username !== "whatsapp"}
                                // className="placeholder:italic placeholder:opacity-50"
                                // placeholder="254 721..."
                                value={field.value}
                                setValue={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FormItem>
                  </RadioGroup>
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
