import React from "react";
import Navbar from "@/components/dashboard/navbar";
import { isValidLanguage, Language } from "@/lib/i18n";
import Footer from "@/components/ui/footer";
import { requireUser } from "@/lib/auth";

const DashboardLayout = async ({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) => {
  const { lang } = await params;
  const user = await requireUser();

  return isValidLanguage(lang) ? (
    <>
      <Navbar user={user} />
      <main className="flex-1 p-6 pt-16"> {children}</main>
    </>
  ) : null;
};

export default DashboardLayout;
