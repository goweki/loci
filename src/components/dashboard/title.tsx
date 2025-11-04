"use client";

import { useI18n } from "@/lib/i18n";

const translations = {
  en: {
    title: "Dashboard Overview",
    subtitle:
      "Welcome back! Here's what's happening with your WhatsApp business.",
  },
  sw: {
    title: "Muhtasari wa Dashibodi",
    subtitle:
      "Karibu tena! Hivi ndivyo biashara yako ya WhatsApp inavyoendelea.",
  },
};

export default function DashboardTitle() {
  const { language } = useI18n();
  const t = translations[language];
  return (
    <div>
      <h1 className="text-3xl font-bold ">{t.title}</h1>
      <p className="text-muted-foreground mt-1">{t.subtitle}</p>
    </div>
  );
}
