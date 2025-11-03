import React from "react";
import Navbar from "@/components/dashboard/navbar";
import Footer from "@/components/ui/footer";
import DashboardTitle from "@/components/dashboard/title";
import DashboardStats from "@/components/dashboard/stats";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentConvos from "@/components/dashboard/recent-convos";

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-background pt-16">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <DashboardTitle />
            <DashboardStats />
            <QuickActions />
            <RecentConvos />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
