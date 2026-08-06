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
    settings: "Settings",
    templates: "Templates",
    brand: "Brand",
    billing: "Billing",
  },
  sw: {
    dashboard: "Dashbodi",
    settings: "Mipangilio",
    templates: "Violezo",
    brand: "Chapa",
    billing: "Malipo",
  },
};

export default function SettingsNavbar() {
  const { language } = useI18n();
  const t = translations[language];

  const navigationLinks: RichNavMenuProps["navigation"] = [
    {
      type: "link",
      href: `/${language}/settings`,
      label: t.settings,
    },
    {
      type: "link",
      href: `/${language}/settings/templates`,
      label: t.templates,
    },
    { type: "link", href: `/${language}/settings/billing`, label: t.billing },
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
