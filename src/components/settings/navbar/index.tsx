"use client";

import { useI18n } from "@/lib/i18n";
import { Navbar as DefaultNavbar, NavbarNavLink } from "@/components/ui/navbar";

const translations = {
  en: {
    dashboard: "Dashboard",
    conversations: "Conversations",
    phoneNumbers: "Phone Numbers",
    autoReply: "Auto-Reply",
    contacts: "Contacts",
    analytics: "Analytics",
    billing: "Billing",
    settings: "Settings",
    actions: {
      search: "Search...",
      filter: "Filter",
      notifications: "Notifications",
      profile: "Profile",
      logout: "Logout",
    },
  },
  sw: {
    dashboard: "Dashibodi",
    conversations: "Mazungumzo",
    phoneNumbers: "Nambari za Simu",
    autoReply: "Majibu ya Kiotomatiki",
    contacts: "Anwani",
    analytics: "Takwimu",
    billing: "Malipo",
    settings: "Mipangilio",
    actions: {
      search: "Tafuta...",
      filter: "Chuja",
      notifications: "Arifa",
      profile: "Wasifu",
      logout: "Toka",
    },
  },
};

export default function SettingsNavbar() {
  const { language } = useI18n();
  const t = translations[language];

  const navigationLinks: NavbarNavLink[] = [
    { href: `/${language}/dashboard`, label: t.dashboard },
    { href: `/${language}/dashboard/conversations`, label: t.conversations },
    { href: `/${language}/dashboard/contacts`, label: t.contacts },
  ];

  return <DefaultNavbar navigationLinks={navigationLinks} authenticated />;
}
