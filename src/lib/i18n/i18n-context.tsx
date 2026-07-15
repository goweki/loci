"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { defaultLng, languages, type Language } from "./i18n-settings";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isValidLanguage, LS_KEY } from ".";
import Loader from "@/components/ui/loaders";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  _lang,
  children,
}: {
  _lang: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const fullPath = paramsString ? `${pathname}?${paramsString}` : pathname;

  const [currentLang, setCurrentLang] = useState<Language | null>(null);

  // Initialization
  useEffect(() => {
    const storedLang = localStorage.getItem(LS_KEY);
    if (storedLang && isValidLanguage(storedLang)) {
      if (!isValidLanguage(_lang)) {
        console.log(`navigating to: /${storedLang}${fullPath}`);
        router.replace(`/${storedLang}${fullPath}`);
      } else if (_lang === storedLang) {
        setCurrentLang(storedLang);
      } else {
        localStorage.setItem(LS_KEY, _lang);
        setCurrentLang(_lang);
      }
    } else if (isValidLanguage(_lang)) {
      setCurrentLang(_lang);
      localStorage.setItem(LS_KEY, _lang);
    } else {
      setCurrentLang(defaultLng);
      localStorage.setItem(LS_KEY, defaultLng);
      console.log(`navigating to: /${defaultLng}${fullPath}`);
      router.replace(`/${defaultLng}${fullPath}`);
    }
  }, [_lang, fullPath, router]);

  // toggles language & updates both state and localStorage
  const setLanguage = (newLang: Language) => {
    setCurrentLang(newLang);
    localStorage.setItem(LS_KEY, newLang);

    const newPath = fullPath.replace(`/${currentLang}`, `/${newLang}`);
    router.push(newPath);
  };

  if (!currentLang) {
    return <Loader />;
  }

  const contextValue: I18nContextType = {
    language: currentLang,
    setLanguage,
  };

  return currentLang ? (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  ) : null;
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);

  if (!ctx) throw new Error("useI18n must be used within a LanguageProvider");
  return ctx;
}
