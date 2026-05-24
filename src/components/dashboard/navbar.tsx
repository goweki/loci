// "use client";

// import { useI18n } from "@/lib/i18n";
// import { Navbar as DefaultNavbar, NavbarNavLink } from "../ui/navbar";

// export default function DashboardNavbar() {

//   return <DefaultNavbar navigationLinks={navigationLinks} authenticated />;
// }

"use client";

import { Navbar } from "@/components/ui/navbar";
import { RichNavMenuProps } from "@/components/ui/navbar";
import { useI18n } from "@/lib/i18n";
import { UserRole } from "@/lib/prisma/generated";
import { FilePenIcon, FileBoxIcon } from "lucide-react";

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
    messages: "Messages",
    commerce: {
      commerce: "Commerce",
      invoices: "Invoices",
      orders: "Orders",
      products: "Products",
    },
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
    messages: "Ujumbe",
    commerce: {
      commerce: "Biashara",
      invoices: "Ankara",
      orders: "Maagizo",
      products: "Bidhaa",
    },
    actions: {
      search: "Tafuta...",
      filter: "Chuja",
      notifications: "Arifa",
      profile: "Wasifu",
      logout: "Toka",
    },
  },
};

//   const navigationLinks: NavbarNavLink[] = [
//     { href: `/${language}/dashboard`, label: t.dashboard },
//     { href: `/${language}/dashboard/conversations`,  },
//     { href: `/${language}/dashboard/contacts`, label: t.contacts },
//   ];

export default function DashboardNavbar({
  user,
}: {
  user: { id: string; role: UserRole };
}) {
  const { language } = useI18n();
  const t = translations[language];
  const role: UserRole = user.role;

  const navByRole: Record<UserRole, RichNavMenuProps["navigation"]> = {
    USER: [
      { type: "link", label: t.dashboard, href: `/${language}/dashboard` },
      {
        type: "grid",
        label: t.commerce.commerce,
        title: t.commerce.commerce,
        items: [
          {
            title: t.commerce.orders,
            href: `/${language}/dashboard/orders`,
            description: "View Orders",
            icon: FilePenIcon,
          },
          {
            title: t.commerce.invoices,
            href: `/${language}/dashboard/invoices`,
            description: "View Invoices",
            icon: FileBoxIcon,
          },
          {
            title: t.commerce.products,
            href: `/${language}/dashboard/products`,
            description: "View Products",
            icon: FilePenIcon,
          },
        ],
        widthClassName: "w-[420px] md:w-[520px] lg:w-[620px]",
        columnsClassName: "md:grid-cols-2",
      },
      {
        type: "grid",
        label: t.conversations,
        title: t.conversations,
        items: [
          {
            title: t.messages,
            href: `/${language}/dashboard/conversations`,
            description: "View Messages",
            icon: FilePenIcon,
          },
          {
            title: t.contacts,
            href: `/${language}/dashboard/contacts`,
            description: "Manage Drivers",
            icon: FileBoxIcon,
          },
        ],
        widthClassName: "w-[420px] md:w-[520px] lg:w-[620px]",
        columnsClassName: "md:grid-cols-2",
      },
    ],

    ADMIN: [
      { type: "link", label: t.dashboard, href: `/${language}/dashboard` },
      {
        type: "grid",
        label: t.commerce.commerce,
        title: t.commerce.commerce,
        items: [
          {
            title: t.commerce.orders,
            href: `/${language}/dashboard/orders`,
            description: "View Orders",
            icon: FilePenIcon,
          },
          {
            title: t.commerce.invoices,
            href: `/${language}/dashboard/invoices`,
            description: "View Orders",
            icon: FileBoxIcon,
          },
        ],
        widthClassName: "w-[420px] md:w-[520px] lg:w-[620px]",
        columnsClassName: "md:grid-cols-2",
      },
      {
        type: "grid",
        label: t.conversations,
        title: t.conversations,
        items: [
          {
            title: t.messages,
            href: `/${language}/dashboard/conversations`,
            description: "View Messages",
            icon: FilePenIcon,
          },
          {
            title: t.contacts,
            href: `/${language}/dashboard/contacts`,
            description: "Manage Drivers",
            icon: FileBoxIcon,
          },
        ],
        widthClassName: "w-[420px] md:w-[520px] lg:w-[620px]",
        columnsClassName: "md:grid-cols-2",
      },
    ],
  };
  const navigationLinks_: RichNavMenuProps["navigation"] = navByRole["USER"];

  return <Navbar navigationLinks={navigationLinks_} authenticated={!!user} />;
}
