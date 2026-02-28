"use server";

import { type Language } from "./i18n-settings";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  sw: () => import("./dictionaries/sw.json").then((module) => module.default),
};

export const getDictionary = async (lang: Language) => dictionaries[lang]();
