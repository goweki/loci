import { Language, languages } from "./i18n-settings";

export const isValidLanguage = (lang: string): lang is Language => {
  return (languages as readonly string[]).includes(lang);
};

export const homePages = languages.map((lang) => `/${lang}`);
