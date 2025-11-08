"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  emailValidator,
  institutionNameValidator,
  locationValidator,
  nameValidator,
  passwordValidator,
} from "@/lib/utils/inputValidators";
import { strsMatch } from "@/lib/utils/stringHandlers";
import Link from "next/link";
import Loader from "@/components/ui/loaders";
import { SideBanner } from "./_banner";
import { useForm } from "react-hook-form";
import z from "zod";
import { setPasswordSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserPassword, verifyToken } from "@/data/user";
import processError from "@/lib/utils/processError";
import { Form } from "@/components/ui/form";
import AuthErrorHandler from "./_errorHandler";

export default function SetPasswordForm({
  error,
  token,
  username,
}: {
  error?: string;
  token?: string;
  username?: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [inputErrors, setInputErrors] = useState<{
    password: string;
    passwordRepeat: string;
  }>({
    password: "",
    passwordRepeat: "",
  });
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      username,
      token,
      password: "",
      confirmPassword: "",
    },
  });

  // onMount
  useEffect(() => {
    (async () => {
      if (!token || !username) {
        const errorMessage = !token ? "no token provided" : "no email provided";
        console.error("error mounting page - ", errorMessage);
        toast.error(errorMessage);
        router.push("/reset-password");
      }
    })();
  }, [token, username, router]);

  // if error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  async function onSubmit(values: z.infer<typeof setPasswordSchema>) {
    const { username, token, password } = values;

    setLoading(true);
    try {
      const user = verifyToken({ token, username });
      if (!user) {
        toast.error("Invalid token");
        setLoading(false);
        return;
      }

      console.log(`Request to update password for user - ${user}`);

      const userUpdates_ = {
        password,
        resetToken: null,
        resetTokenExpriry: null,
      };
      const updateUser = updateUserPassword((await user).id, userUpdates_);

      if (!updateUser) {
        toast.error("Error updating password. Try again later");
        setLoading(false);
        return;
      }

      toast.success("Password updated");
      router.push(`/sign-in`);
    } catch (error) {
      const err = processError(error);
      console.error("ERROR in set-password-form: ", err);
      toast.error(err.message);
    }
  }

  return (
    <Form {...form}>
      <AuthErrorHandler />
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="sm:w-2/3 w-full px-4 space-y-4 lg:px-0 mx-auto my-4 mt-8"
      >
        <div className="mb-4 md:flex md:justify-between">
          <Input
            name="password"
            type="password"
            placeholder="Enter new Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (inputErrors.password)
                setInputErrors((prev) => ({ ...prev, password: "" }));
            }}
            className={
              inputErrors.password ? "border-destructive" : "border-border"
            }
          />
        </div>
        <div className="mb-4 md:flex md:justify-between">
          <Input
            name="repeatPassword"
            type="password"
            placeholder="Re-enter Password"
            className={
              inputErrors.passwordRepeat
                ? "border-destructive"
                : "border-border"
            }
            value={passwordRepeat}
            onChange={(e) => {
              setPasswordRepeat(e.target.value);
              if (inputErrors.passwordRepeat)
                setInputErrors((prev) => ({ ...prev, passwordRepeat: "" }));
            }}
          />
        </div>

        <div className="px-4 pb-2 pt-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="animate-pulse flex flex-row gap-x-4">
                <Loader />
                Loading...
              </div>
            ) : (
              "Set New Password"
            )}
          </Button>
        </div>
        <hr className="my-6 border-t" />
        <div className="text-center grid grid-cols-1 gap-y-1 text-xs">
          <Link href="/reset-password" className="hover:underline">
            Forgot Password? Reset
          </Link>
          <Link href="/sign-in" className="hover:underline">
            Already have an account? Login
          </Link>
        </div>
        <div className="p-4 text-center right-0 left-0 flex justify-center space-x-4 mt-16 lg:hidden ">
          <SideBanner />
        </div>
      </form>
    </Form>
  );
}
