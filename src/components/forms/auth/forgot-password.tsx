// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { z } from "zod";

// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { InputWithIcon } from "@/components/ui/input";
// import { Eye, EyeOff, Lock, Mail, User as UserIcon } from "lucide-react";
// import { useEffect, useState } from "react";
// import Link from "next/link";
// import GoogleSignin from "@/components/ui/svg";
// import { signIn } from "next-auth/react";
// import toast from "react-hot-toast";
// import { useRouter } from "next/navigation";
// import Loader from "@/components/ui/loaders";
// import AuthErrorHandler, { ERROR_MESSAGES } from "./_errorHandler";
// import { forgotPasswordSchema } from "@/lib/validations";
// import { sendResetLink } from "@/data/user";
// import { useI18n } from "@/lib/i18n";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import InputPhone from "@/components/ui/input-phone";
// import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
// import { removePlus } from "@/lib/utils/telHandlers";

// const translations = {
//   en: { submit: "Send Link", orCredentials: "or use your Credentials" },
//   sw: { submit: "Tuma Linki", orCredentials: "au tumia Barua pepe kuingia" },
// };

// export function ForgotPasswordForm() {
//   const [loading, setLoading] = useState<boolean>(false);
//   const router = useRouter();
//   const { language } = useI18n();
//   const t = translations[language];

//   const form = useForm<z.infer<typeof forgotPasswordSchema>>({
//     resolver: zodResolver(forgotPasswordSchema),
//     defaultValues: {
//       email: "",
//       phoneNumber: "",
//       username: "email",
//     },
//   });

//   const { watch, setValue } = form;
//   const username = watch("username");

//   useEffect(() => {
//     if (username === "whatsapp") {
//       setValue("email", "");
//     } else if (username === "email") {
//       setValue("phoneNumber", "");
//     }
//   }, [username, setValue]);

//   const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
//     setLoading(true);
//     // console.log(values);
//     const { email, phoneNumber, username } = values;
//     if (!email && !phoneNumber) {
//       return toast.error("An email or PhoneNo. is required");
//     }

//     try {
//       const result = await sendResetLink({
//         username: email || removePlus(phoneNumber),
//         sendTo: username,
//       });

//       if (!result) {
//         throw new Error("Error sending reset link");
//       }
//       const sentTo = result.sentTo;

//       const messages: Record<string, string> = {
//         email: `Password reset link sent to ${username}`,
//         whatsapp: `Password reset link sent to ${username}`,
//         sms: `Your reset link will be sent via sms shortly.`,
//       };

//       const message = messages[sentTo];
//       toast.success(message);
//       router.push(`/${language}/`);
//     } catch (error) {
//       let errorMessage = "Error sending reset link:";
//       if (error instanceof Error) {
//         errorMessage = error.message;
//       }
//       toast.error(errorMessage);
//       setLoading(false);
//     }
//   };

//   return (
//     <Form {...form}>
//       <AuthErrorHandler />
//       <form
//         onSubmit={form.handleSubmit(onSubmit)}
//         className="space-y-4 text-start"
//       >
//         <FormField
//           control={form.control}
//           name="username"
//           render={({ field }) => {
//             return (
//               <FormItem className="space-y-3">
//                 <FormLabel>
//                   Select a method method to get a password reset link
//                 </FormLabel>
//                 <FormControl>
//                   <RadioGroup
//                     onValueChange={field.onChange}
//                     defaultValue={field.value}
//                     className="flex flex-col space-y-2"
//                   >
//                     <FormItem className="flex items-center space-x-3 space-y-0">
//                       <FormControl>
//                         <RadioGroupItem value="email" />
//                       </FormControl>
//                       <FormLabel className="font-normal">Email</FormLabel>
//                       <FormField
//                         control={form.control}
//                         name="email"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormControl>
//                               <InputWithIcon
//                                 disabled={username !== "email"}
//                                 icon={Mail}
//                                 className="placeholder:italic placeholder:opacity-50"
//                                 placeholder="loci@goweki.com"
//                                 type="email"
//                                 {...field}
//                               />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     </FormItem>
//                     <FormItem className="flex items-center space-x-3 space-y-0">
//                       <FormControl>
//                         <RadioGroupItem value="whatsapp" />
//                       </FormControl>
//                       <FormLabel className="font-normal">WhatsApp</FormLabel>
//                       <FormField
//                         control={form.control}
//                         name="phoneNumber"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormControl>
//                               <InputPhone
//                                 disabled={username !== "whatsapp"}
//                                 // className="placeholder:italic placeholder:opacity-50"
//                                 // placeholder="254 721..."
//                                 value={field.value}
//                                 setValue={field.onChange}
//                               />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     </FormItem>
//                   </RadioGroup>
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             );
//           }}
//         />

//         <div className="py-4">
//           <Button type="submit" className="w-full" disabled={loading}>
//             {!loading ? t.submit : <Loader />}
//           </Button>
//         </div>
//         <hr className="my-6 border-t" />
//         <div className="flex flex-row justify-between italic text-xs">
//           <Link
//             href={`/${language}/sign-in`}
//             className="flex w-fit hover:underline"
//           >
//             Already registered?
//           </Link>

//           <Link
//             href={`/${language}/sign-up`}
//             className="flex w-fit hover:underline"
//           >
//             New here? Sign Up
//           </Link>
//         </div>
//       </form>
//     </Form>
//   );
// }

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

type RecoveryMethod = "email" | "phone";

export function ForgotPasswordForm() {
  const router = useRouter();
  const { language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [activeTab, setActiveTab] = useState<RecoveryMethod>("email");

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      phoneNumber: "",
      notificationChannel: NotificationChannel.WHATSAPP,
    },
  });

  const selectedUsername = useWatch({
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

        console.log("Requesting reset for:", values);

        const result = await sendResetLink({
          username: values.email || removePlus(values.phoneNumber),
          sendTo: values.notificationChannel,
        });

        if (!result) {
          throw new Error("Error sending reset link");
        }

        const sentTo = result.sentTo;

        const messages: Record<string, string> = {
          email: `Password reset link sent to ${values.notificationChannel}`,
          whatsapp: `Password reset link sent to ${values.notificationChannel}`,
          sms: `Your reset link will be sent via sms shortly.`,
        };

        const message = messages[sentTo];
        toast.success(message);
        router.push(`/${language}/`);

        setDone(true);
        toast.success(`Reset link sent via ${values.notificationChannel}`);
      } catch (error: any) {
        toast.error(error.message || "Failed to request reset");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return (
    <>
      <div className="space-y-2 text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
        <p className="text-sm text-muted-foreground">
          Choose your recovery method to reset your account.
        </p>
      </div>

      {/* Main Tabs: Email vs Phone */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 mb-6">
        <Button
          type="button"
          variant={activeTab === "email" ? "secondary" : "ghost"}
          onClick={() => {
            setActiveTab("email");
            form.setValue("notificationChannel", "EMAIL");
          }}
        >
          <Mail className="h-4 w-4" /> Email
        </Button>
        <Button
          type="button"
          variant={activeTab === "phone" ? "secondary" : "ghost"}
          onClick={() => {
            setActiveTab("phone");
            form.setValue("notificationChannel", "WHATSAPP"); // Default phone choice
          }}
        >
          <Phone className="h-4 w-4" /> Phone
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {activeTab === "email" ? (
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
                          id: "whatsapp",
                          label: "WhatsApp",
                          icon: WhatsAppLogo,
                        },
                        { id: "sms", label: "SMS", icon: MessageSquare },
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
                Recover Account <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <Link
          href={`/${language}/sign-in`}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to sign in
        </Link>
      </div>
    </>
  );
}
