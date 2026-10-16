import React from "react";
import Navbar from "@/components/manager/navbar";
import { isValidLanguage, Language } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@/lib/prisma/generated";
import { redirect } from "next/navigation";

export default async function ManagerLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;
  const user = await requireUser();

  if (user.role !== UserRole.ADMIN) {
    redirect(`/${lang}/dashboard`);
  }

  return isValidLanguage(lang) ? (
    <>
      <Navbar />
      <main className="flex-1 p-6 pt-16">{children}</main>
    </>
  ) : null;
}
