import React from "react";
import Navbar from "@/components/dashboard/navbar";
import { isValidLanguage, Language } from "@/lib/i18n";
import { redirect } from "next/navigation";

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
      <main className="flex flex-col flex-1 p-6 pt-16 mx-auto w-full max-w-7xl">
        {children}
      </main>
    </>
  ) : (
    redirect("/")
  );
};

export default DashboardLayout;
