"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./button";
import { Languages } from "lucide-react";
import { Language } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";

export default function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState<string>("en");
  const [loading, setLoading] = useState<boolean>(true);
  const lng: Language = useI18n();

  useEffect(() => {
    const stored = localStorage.getItem("preferred-language");
    const currentFromPath = pathname?.match(/^\/([a-z]{2})(?=\/|$)/)?.[1];
    const currentLang = stored || currentFromPath || "en";
    setLanguage(currentLang);
    setLoading(false);
  }, [pathname]);

  const changeLanguage = (newLang: Language) => {
    if (newLang === language) return;

    // Update localStorage
    localStorage.setItem("preferred-language", newLang);

    // Replace locale prefix in URL
    const newPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
    router.push(`/${newLang}${newPath}`);

    setLanguage(newLang);
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === "en" ? "sw" : "en";
    changeLanguage(nextLang);
  };

  return !loading ? (
    <Button onClick={toggleLanguage} variant="ghost" title="Toggle language">
      <Languages />
      <span className="ml-2 uppercase">{language}</span>
    </Button>
  ) : null;
}
