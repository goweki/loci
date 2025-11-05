import React from "react";
import Navbar from "@/components/dashboard/navbar";

const DashboardLayout = ({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex h-screen bg-background pt-16">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
