"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { ButtonPrimary } from "@/components/atoms/buttons";
import { InputField } from "@/components/atoms/inputs";
import { emailValidator, passwordValidator } from "@/helpers/inputValidators";
import { httpStatusCodes, qParamsErrors } from "@/lib/configs";

export default function SigninPage(params) {
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [UIstate, setUIstate] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  // onMount
  useEffect(() => {
    if (searchParams.has("error")) {
      const error_ = searchParams.get("error");
      setUIstate(qParamsErrors[error_] || "An error occured");
    } else setUIstate("OK");
  }, [searchParams]);
  // Notify on UIstate-error
  useEffect(() => {
    if (UIstate && UIstate !== "OK" && UIstate !== "loading") {
      toast.error(UIstate);
      setUIstate("OK");
    }
  }, [UIstate]);
  // Notify on input-Error
  useEffect(() => {
    if (email.error || password.error) {
      setUIstate("OK");
      if (email.error) toast.error(email.error);
      if (password.error) toast.error(password.error);
    }
  }, [email, password]);
  // handle SignIn
  async function handleSubmit(e) {
    e.preventDefault();
    // validate inputs: email & password
    const emailError_ = emailValidator(email.value);
    const passwordError_ = passwordValidator(password.value);
    if (emailError_ || passwordError_) {
      if (emailError_) setEmail((prev) => ({ ...prev, error: emailError_ }));
      if (passwordError_)
        setPassword((prev) => ({ ...prev, error: passwordError_ }));
      return;
    }
    setUIstate("loading");
    //sign in
    console.log(
      `........................\nCHECKPOINT: validating user\n > ${email.value} , ${password.value}\n..................`
    );
    const res = await signIn("credentials", {
      email: email.value,
      password: password.value,
      redirect: false,
      callbackUrl: callbackUrl ?? "/user",
    });
    if (!res) {
      setUIstate("ERROR: Check internet connection then retry.");
    } else if (res.status === 200 && !res.error) {
      router.replace("/user");
    } else {
      console.log(
        `........................\n > FAILED: user not validated\n > ${JSON.stringify(
          res
        )}\n`
      );
      setUIstate(httpStatusCodes[res.status] || "authentication failed");
    }
  }
  //render
  return (
    <section className="min-h-screen flex items-center justify-center">
      {/* login container */}
      <div className="card grid grid-cols-1 md:grid-cols-2 max-w-3xl p-5 items-center">
        {/* form */}
        <div className="px-8 md:px-16 pt-4 pb-10">
          <h2 className="font-bold text-2xl text-blue-500">Login</h2>
          <p className="text-xs mt-2 text-slate-500">
            If you are already have an account, log in
          </p>

          <form action="" className="flex flex-col gap-2 py-2">
            <InputField
              label="Email"
              name="email"
              onChange={(e) => {
                if (email.error) {
                  const error_ = emailValidator(e.target.value);
                  if (error_)
                    setEmail({ value: e.target.value, error: error_ });
                  else setEmail({ value: e.target.value, error: "" });
                } else setEmail((prev) => ({ ...prev, value: e.target.value }));
              }}
              error={email.error}
              value={email.value}
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              onChange={(e) => {
                if (password.error) {
                  const error_ = passwordValidator(e.target.value);
                  if (error_)
                    setPassword({ value: e.target.value, error: error_ });
                  else setPassword({ value: e.target.value, error: "" });
                } else
                  setPassword((prev) => ({ ...prev, value: e.target.value }));
              }}
              error={password.error}
              value={password.value}
            />

            <div className="pt-3">
              <ButtonPrimary
                label="LOGIN"
                onClick={handleSubmit}
                loading={UIstate === "loading"}
              />
            </div>
          </form>

          {/* <div className="mt-6 grid grid-cols-3 items-center text-gray-400">
            <hr className="border-gray-400" />
            <p className="text-center text-sm">OR</p>
            <hr className="border-gray-400" />
          </div>

          <button className="bg-white border py-2 w-full rounded-xl mt-5 flex justify-center items-center text-sm hover:scale-105 duration-300 text-[#002D74]">
            <svg
              className="mr-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="25px"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Login with Google
          </button> */}

          <div className="text-xs italic">
            <a className="flex justify-center" href="#">
              Forgot your password?
            </a>
          </div>

          {/* <div className="mt-3 text-xs flex justify-between items-center text-[#002D74]">
            <p>Don&apos;t have an account?</p>
            <button className="py-2 px-5 bg-white border rounded-xl hover:scale-110 duration-300">
              Register
            </button>
          </div> */}
        </div>
        {/* Image */}
        <div className="rounded-xl md:block h-full hidden bg-[url('/images/illustration-A.jpg')] bg-cover bg-center"></div>
      </div>
    </section>
  );
}
