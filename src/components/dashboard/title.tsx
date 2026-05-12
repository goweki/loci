"use client";

import { useI18n } from "@/lib/i18n";
import PageTitle from "../ui/page-title";

const translations = {
  en: {
    title: "Dashboard Overview",
    subtitle: "Welcome back!",
  },
  sw: {
    title: "Muhtasari wa Dashibodi",
    subtitle: "Karibu tena!",
  },
};

export default function DashboardTitle() {
  const { language } = useI18n();
  const t = translations[language];
  return <PageTitle title={t.title} subtitle={t.subtitle} />;
}
