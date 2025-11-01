// app/i18n/settings.ts
export const languages = ["en", "sw"] as const;
export type Language = (typeof languages)[number];
export const defaultLng: Language = "en";
