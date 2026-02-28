"use client";

import { useI18n } from "@/lib/i18n";
import { Navbar as DefaultNavbar, NavbarNavLink } from "@/components/ui/navbar";
import { LucideArrowLeft } from "lucide-react";

const translations = {
  en: {
    home: "Home",
    settings: "Settings",
    templates: "Templates",
    brand: "Brand",
    billing: "Billing",
  },
  sw: {
    home: "Nyumbani",
    settings: "Mipangilio",
    templates: "Templet",
    brand: "Alama",
    billing: "Malipo",
  },
};

export default function SettingsNavbar() {
  const { language } = useI18n();
  const t = translations[language];

  const navigationLinks: NavbarNavLink[] = [
    {
      href: `/${language}/settings`,
      label: t.settings,
      // active: false,
    },
    { href: `/${language}/settings/templates`, label: t.templates },
    { href: `/${language}/settings/billing`, label: t.billing },
  ];

  const logo = (
    <>
      <LucideArrowLeft />
      <span className="hidden font-bold text-primary text-xl md:inline-block">
        {t.home}
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
