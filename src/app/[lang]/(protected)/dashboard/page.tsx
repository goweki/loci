import React from "react";
import Navbar from "@/components/dashboard/navbar";
import Footer from "@/components/ui/footer";
import DashboardTitle from "@/components/dashboard/title";
import DashboardStats from "@/components/dashboard/stats";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentConvos from "@/components/dashboard/recent-convos";

const DashboardPage = () => {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardTitle />
        <DashboardStats />
        <QuickActions />
        <RecentConvos />
      </div>
      <Footer />
    </main>
  );
};

export default DashboardPage;
