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
import { registerSchema } from "@/lib/validations";
import { registerUser } from "@/data/user";
import { useI18n } from "@/lib/i18n";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import InputPhone from "@/components/ui/input-phone";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";

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
      phoneNumber: "",
      verificationMethod: "whatsapp",
    },
  });

  const { watch, setValue } = form;
  const verificationMethod = watch("verificationMethod");

  useEffect(() => {
    if (verificationMethod === "whatsapp") {
      setValue("email", "");
    } else if (verificationMethod === "email") {
      setValue("phoneNumber", "");
    }
  }, [verificationMethod, setValue]);

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    setLoading(true);
    // console.log(values);
    const { name, email, phoneNumber, verificationMethod } = values;
    if (!email && !phoneNumber) {
      return toast.error("An email or PhoneNo. is required");
    }

    try {
      const result = await registerUser({
        name,
        email: verificationMethod === "email" ? email : undefined,
        tel:
          verificationMethod !== "email" && phoneNumber
            ? phoneNumber
            : undefined,
        verificationMethod,
      });

      if (result.verificationMethod === "email") {
        toast.success(`Verification link sent to Email: ${email}`);
      } else if (result.verificationMethod === "whatsapp") {
        toast.success(`Verification link sent to WhatsApp: ${phoneNumber}`);
      } else if (result.verificationMethod === "sms") {
        toast.success(`Verification link sent by sms: ${phoneNumber}`);
      }

      console.log(result);
      router.push(`/${language}/sign-in`);
    } catch (error) {
      let errorMessage = "Error signing up";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
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
        {/* <hr className="my-6 border-t" /> */}
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
          name="verificationMethod"
          render={({ field }) => {
            return (
              <FormItem className="space-y-3">
                <FormLabel>Select a verification method</FormLabel>
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
                                disabled={verificationMethod !== "email"}
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
                                disabled={verificationMethod !== "whatsapp"}
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
