"use client";

import { createContext, useContext } from "react";
import { defaultLng, languages, type Language } from "./i18n-settings";
import { usePathname, useRouter } from "next/navigation";

const I18nContext = createContext<Language>(defaultLng);

export function I18nProvider({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const _lang = useI18n();

  if (!languages.includes(lang as (typeof languages)[number])) {
    return router.push(`/${_lang}${pathname}`);
  }

  return (
    <I18nContext.Provider value={lang as Language}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx)
    throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
