"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Language } from "@/lib/i18n";

export default function LanguageRedirector() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let preferredLanguage: Language = "en";

    if (typeof window === "undefined") {
      return;
    }

    try {
      let storedLanguage = localStorage.getItem("language_preference");

      if (storedLanguage) {
        preferredLanguage = (storedLanguage as Language) || "en";
      } else {
        localStorage.setItem("language_preference", "en");
        preferredLanguage = "en";
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
      localStorage.setItem("language_preference", "en");
      preferredLanguage = "en";
    }

    const targetPath = `/${preferredLanguage}${pathname}`;
    const preferredPathStart = `/${preferredLanguage}`;

    if (!pathname.startsWith(preferredPathStart)) {
      console.log(`Redirecting from ${pathname} to ${targetPath}`);
      router.replace(targetPath);
    }
  }, [pathname, router]);

  // This component doesn't render anything visible
  return null;
}
