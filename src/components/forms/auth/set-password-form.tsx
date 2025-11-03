"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SideBanner } from "./banner";
import {
  emailValidator,
  institutionNameValidator,
  locationValidator,
  nameValidator,
  passwordValidator,
} from "@/lib/utils/inputValidators";
import { strsMatch } from "@/lib/utils/stringHandlers";
import Link from "next/link";
import Loader from "../ui/loaders";

export default function SetPasswordForm({
  error,
  token,
  email,
}: {
  token: string;
  email: string;
  error?: string;
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

  // onMount
  useEffect(() => {
    (async () => {
      if (!token || emailValidator(email)) {
        const errorMessage = !token
          ? "no token provided"
          : emailValidator(email);
        console.error("error mounting page - ", errorMessage);
        toast.error(errorMessage);
        router.push("/reset-password");
      }

      try {
        // API call to confirm user,token,expiry
        const fetchOptions = {
          method: "GET",
        };

        const response = await fetch(
          `/api/auth/reset-password?email=${encodeURIComponent(
            email
          )}&token=${token}`,
          fetchOptions
        ).then(async (res_) => {
          if (res_.ok) {
            return await res_.json();
          } else {
            const error_ =
              (await res_.json()) || "Unknown error, try again later";
            console.error("Error in sending reset password link:", error_);
            toast.error(error_.message || error_);
            return null;
          }
        });

        if (!response) return router.push(`/reset-password`);

        toast.success(response.message || response);
        setLoading(false);
      } catch (error) {}
    })();
  }, [email, token, router]);

  // if error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  async function handlePasswordSubmission(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // if field errors
    const passwordError_ = passwordValidator(password);
    const passwordMismatch_ = !strsMatch(password, passwordRepeat);
    if (passwordError_ || passwordMismatch_) {
      if (passwordError_) {
        toast.error(passwordError_);
        setInputErrors((prev) => ({
          ...prev,
          password: passwordError_,
        }));
      }
      if (passwordMismatch_) {
        const errorMessage_ = "Passwords dont match";
        toast.error(errorMessage_);
        setInputErrors((prev) => ({
          ...prev,
          passwordRepeat: errorMessage_,
        }));
      }

      return;
    }
    // if valid fields
    setLoading(true);
    try {
      // API call
      const fetchOptions = {
        method: "PUT",
        body: JSON.stringify({
          userEmail: email,
          token,
          password: password,
        }),
      };

      console.log("Request to update password for - ", email);

      const response = await fetch(
        "/api/auth/reset-password",
        fetchOptions
      ).then(async (res_) => {
        if (res_.ok) {
          return await res_.json();
        } else {
          const error_ =
            res_.status + "-" + (await res_.json()).message ||
            "Unknown error, try again later";
          console.error(error_);
          toast.error(error_);
          return null;
        }
      });

      if (!response) return setLoading(false);

      toast.success(response.message);
      router.push(`/sign-in`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("ERROR caught - setPasswordForm - ", err.message);
      toast.error(`Failed to update password, try again later`);
    }
  }

  return (
    <>
      <form
        onSubmit={handlePasswordSubmission}
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
          <a href="/sign-in" className="hover:underline">
            Already have an account? Login
          </a>
        </div>
        <div className="p-4 text-center right-0 left-0 flex justify-center space-x-4 mt-16 lg:hidden ">
          <SideBanner />
        </div>
      </form>
    </>
  );
}
