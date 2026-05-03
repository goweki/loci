import React from "react";
import Navbar from "@/components/dashboard/navbar";
import { isValidLanguage, Language } from "@/lib/i18n";

const DashboardLayout = async ({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) => {
  const { lang } = await params;

  return isValidLanguage(lang) ? (
    <>
      <Navbar />
      <main className="flex-1 p-6 pt-24"> {children}</main>
    </>
  ) : null;
};

export default DashboardLayout;
