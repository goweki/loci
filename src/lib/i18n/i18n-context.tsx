// "use client";

// import { createContext, useContext, useEffect, useState } from "react";
// import { defaultLng, languages, type Language } from "./i18n-settings";
// import { usePathname, useRouter } from "next/navigation";
// import { LS_KEY } from ".";

// const I18nContext = createContext<Language>(defaultLng);

// export function I18nProvider({
//   _lang,
//   children,
// }: {
//   _lang: string;
//   children: React.ReactNode;
// }) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [lang, setLang] = useState<Language | null>(null);

//   // init
//   useEffect(() => {
//     if (typeof window === "undefined") {
//       return;
//     }
//     const storedLang = localStorage.getItem(LS_KEY);
//     if (storedLang && languages.includes(storedLang as Language)) {
//       setLang(storedLang as Language);
//     } else {
//       localStorage.setItem(LS_KEY, "en");
//       setLang("en");
//     }
//   }, []);

//   useEffect(() => {
//     if (!lang || !_lang) return;
//     if (lang !== (_lang as Language)) {
//       const updatedLang: Language | null = (_lang as Language) || "en";
//       localStorage.setItem(LS_KEY, updatedLang);
//       setLang(updatedLang);
//     }
//   }, [_lang, lang]);

//   return _lang && lang ? (
//     <I18nContext.Provider value={lang as Language}>
//       {children}
//     </I18nContext.Provider>
//   ) : null;
// }

// export function useI18n() {
//   const ctx = useContext(I18nContext);
//   if (!ctx)
//     throw new Error("useLanguage must be used within a LanguageProvider");
//   return ctx;
// }

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { defaultLng, languages, type Language } from "./i18n-settings";
import { usePathname, useRouter } from "next/navigation";
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

  const [currentLang, setCurrentLang] = useState<Language | null>(null);

  // Initialization
  useEffect(() => {
    const storedLang = localStorage.getItem(LS_KEY);
    if (storedLang && isValidLanguage(storedLang)) {
      if (!isValidLanguage(_lang)) {
        router.replace(`/${storedLang}${pathname}`);
      } else setCurrentLang(storedLang);
    } else if (isValidLanguage(_lang)) {
      setCurrentLang(_lang);
      localStorage.setItem(LS_KEY, _lang);
    } else {
      setCurrentLang(defaultLng);
      localStorage.setItem(LS_KEY, defaultLng);
      router.replace(`/${defaultLng}${pathname}`);
    }
  }, [_lang]);

  // toggles language & updates both state and localStorage
  const setLanguage = (newLang: Language) => {
    setCurrentLang(newLang);
    localStorage.setItem(LS_KEY, newLang);
    // toggle language
    const newPath = pathname.replace(`/${currentLang}`, `/${newLang}`);
    router.push(newPath);
  };

  if (!currentLang) {
    return <Loader />;
  }

  const contextValue: I18nContextType = {
    language: currentLang,
    setLanguage,
  };

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);

  if (!ctx) throw new Error("useI18n must be used within a LanguageProvider");
  return ctx;
}
