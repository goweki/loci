"use client";

import { useI18n } from "@/lib/i18n";
import {
  Navbar as DefaultNavbar,
  RichNavMenuProps,
} from "@/components/ui/navbar";
import { LucideArrowLeft } from "lucide-react";

const translations = {
  en: {
    dashboard: "Dashboard",
    manager: "Manager",
  },
  sw: {
    dashboard: "Dashibodi",
    manager: "Msimamizi",
  },
};

export default function SettingsNavbar() {
  const { language } = useI18n();
  const t = translations[language];

  const navigationLinks: RichNavMenuProps["navigation"] = [
    {
      type: "link",
      href: `/${language}/manager`,
      label: t.manager,
    },
  ];

  const logo = (
    <>
      <LucideArrowLeft />
      <span className="hidden font-bold text-primary text-xl md:inline-block">
        {t.dashboard}
      </span>
    </>
  );

  return (
    <DefaultNavbar
      logo={logo}
      logoHref={`/${language}/dashboard`}
      navigationLinks={navigationLinks}
      authenticated
    />
  );
}
