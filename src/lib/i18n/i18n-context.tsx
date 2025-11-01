"use client";

import { createContext, useContext } from "react";
import { defaultLng, type Language } from "./i18n-settings";

const I18nContext = createContext<Language>(defaultLng);

export function I18nProvider({
  lang,
  children,
}: {
  lang: Language;
  children: React.ReactNode;
}) {
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
