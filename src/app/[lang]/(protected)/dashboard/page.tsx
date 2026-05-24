import React from "react";
import Navbar from "@/components/dashboard/navbar";
import Footer from "@/components/ui/footer";
import DashboardStats from "@/components/dashboard/stats";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentConvos from "@/components/dashboard/recent-convos";
import { getDashboardStatsSummary } from "@/data/dashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Language } from "@/lib/i18n";
import TitleSection from "@/components/ui/page-title";

const translations = {
  en: {
    title: "Dashboard Overview",
    subtitle: "Welcome back!",
  },
  sw: {
    title: "Muhtasari wa Dashibodi",
    subtitle: "Karibu tena!",
  },
};

const DashboardPage = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/");

  const { lang } = await params;
  const t = translations[lang as Language];

  const stats = await getDashboardStatsSummary(session.user.id);

  return (
    <>
      <div className="space-y-6 flex flex-col flex-1 min-h-[calc(100vh-24rem)] py-6">
        <TitleSection title={t.title} subtitle={t.subtitle} />
        <DashboardStats stats={stats} />
        <QuickActions />
        <RecentConvos />
      </div>
      <Footer />
    </>
  );
};

export default DashboardPage;
