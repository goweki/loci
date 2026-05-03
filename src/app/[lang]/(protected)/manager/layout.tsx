import React from "react";
import Navbar from "@/components/settings/navbar";
import { isValidLanguage, Language } from "@/lib/i18n";

export default async function ManagerLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;

  return isValidLanguage(lang) ? (
    <>
      <Navbar />
      {children}
    </>
  ) : null;
}
