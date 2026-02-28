"use client";

import { useI18n } from "@/lib/i18n";
import PageTitle from "../ui/page-title";

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
  return <PageTitle title={t.title} subtitle={t.subtitle} />;
}
