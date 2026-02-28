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
    <div className="flex h-screen bg-background pt-16">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        {children}
      </div>
    </div>
  ) : null;
};

export default DashboardLayout;
