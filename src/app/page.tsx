"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Language, languages } from "@/lib/i18n";

export default function LanguageRedirector() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let preferredLanguage: Language | null = null;

    try {
      let storedLanguage = localStorage.getItem("language_preference");

      if (languages.includes(storedLanguage as Language)) {
        preferredLanguage = (storedLanguage as Language) || null;
      } else {
        localStorage.setItem("language_preference", "en");
        preferredLanguage = "en";
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
      localStorage.setItem("language_preference", "en");
      preferredLanguage = "en";
    }

    const preferredPath = `/${preferredLanguage}`;
    router.replace(preferredPath);
  }, [router]);

  // This component doesn't render anything visible
  return null;
}
