"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SideBanner } from "./banner";
import {
  emailValidator,
  institutionNameValidator,
  locationValidator,
  nameValidator,
} from "@/lib/utils/inputValidators";
import Link from "next/link";
import Loader from "../ui/loaders";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [location, setLocation] = useState("");
  const [inputErrors, setInputErrors] = useState({
    email: "",
    name: "",
    institutionName: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate inputs
    const emailError_ = emailValidator(email);
    const nameError_ = nameValidator(fullName);
    const instNameError_ = institutionNameValidator(institutionName);
    const locationError_ = locationValidator(location);

    if (emailError_ || nameError_ || instNameError_ || locationError_) {
      if (emailError_) toast.error(emailError_);
      if (nameError_) toast.error(nameError_);
      if (instNameError_) toast.error(instNameError_);
      setInputErrors({
        email: emailError_,
        name: nameError_,
        institutionName: instNameError_,
        location: locationError_,
      });
      return;
    }

    setLoading(true);

    console.log(
      `registering user
      > email - ${email} 
      > names - ${fullName}
      > institution - ${institutionName}
      ..................`
    );

    try {
      const registeredPrinci = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // ✅ added
        body: JSON.stringify({
          email,
          name: fullName,
          institutionName,
          location,
        }),
      }).then(async (res_) => {
        if (res_.ok) {
          return await res_.json();
        } else {
          const errorMessage = await res_.json();
          toast.error(errorMessage, { duration: 8000 });
          return null;
        }
      });

      if (!registeredPrinci) return;
      else {
        toast.success(registeredPrinci.message, { duration: 8000 });
        router.push("/sign-in");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("❌ Registration error:", err);
      toast.error(err.message || "Institution Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleRegistration}
        className="sm:w-2/3 w-full px-4 space-y-4 lg:px-0 mx-auto my-4 mt-8"
      >
        <div className="mb-4 md:flex md:justify-between">
          <div className="mb-4 md:mr-2 md:mb-0 w-full">
            <Input
              id="full-name"
              name="full-name"
              type="text"
              placeholder="Full names"
              className={`border-1 ${
                !inputErrors.name ? "border-border" : "border-destructive"
              }`}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (inputErrors.name)
                  setInputErrors((prev) => ({ ...prev, name: "" }));
              }}
              required
            />
          </div>
          <div className="md:ml-2 w-full">
            <Input
              id="email-address"
              name="email-address"
              type="email"
              placeholder="email address"
              className={`border-1 ${
                !inputErrors.email ? "border-border" : "border-destructive"
              }`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (inputErrors.email)
                  setInputErrors((prev) => ({ ...prev, email: "" }));
              }}
              required
            />
          </div>
        </div>
        <div className="mb-4 md:flex md:justify-between">
          <div className="mb-4 md:mr-2 md:mb-0 w-full">
            <Input
              id="institutionName"
              name="institutionName"
              type="text"
              placeholder="Institution Name"
              className={`border-1 ${
                !inputErrors.institutionName
                  ? "border-border"
                  : "border-destructive"
              }`}
              value={institutionName}
              onChange={(e) => {
                setInstitutionName(e.target.value);
                if (inputErrors.institutionName)
                  setInputErrors((prev) => ({ ...prev, institutionName: "" }));
              }}
              required
            />
          </div>
          <div className="md:ml-2 w-full">
            <Input
              id="location"
              name="location"
              type="text"
              placeholder="Location: eg Nairobi, Kenya"
              className={`border-1 ${
                !inputErrors.institutionName
                  ? "border-border"
                  : "border-destructive"
              }`}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (inputErrors.location)
                  setInputErrors((prev) => ({ ...prev, location: "" }));
              }}
              required
            />
          </div>
        </div>

        <div className="px-4 pb-2 pt-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="animate-pulse flex flex-row gap-x-4">
                <Loader />
                Loading...
              </div>
            ) : (
              "Register Institution"
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
