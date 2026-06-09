import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { Language } from "@/lib/i18n";

import TitleSection from "@/components/ui/page-title";

import { RevenueCard } from "@/components/dashboard/overview/revenue-card";
import { OrdersCard } from "@/components/dashboard/overview/orders-card";
import { ContactsCard } from "@/components/dashboard/overview/contacts-card";
import { ConversationsCard } from "@/components/dashboard/overview/conversations-card";
import { RecentOrders } from "@/components/dashboard/overview/recent-orders";
import { RecentInvoices } from "@/components/dashboard/overview/recent-invoices";

import { QuickActions } from "@/components/dashboard/overview/quick-actions";
import { RecentConversations } from "@/components/dashboard/overview/recent-conversations";
import { InventoryAlerts } from "@/components/dashboard/overview/inventory-alerts";
import { SalesChart } from "@/components/dashboard/overview/sales-chart";
import { ActivityFeed } from "@/components/dashboard/overview/activity-feed";

import { getDashboardStatsSummary } from "@/data/dashboard";

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

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const { lang } = await params;

  const t = translations[lang as keyof typeof translations] ?? translations.en;

  const stats = await getDashboardStatsSummary(session.user.id);

  return (
    <div className="space-y-8 p-6">
      <TitleSection title={t.title} subtitle={t.subtitle} />

      <QuickActions />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RevenueCard />

        <OrdersCard />

        <ContactsCard />

        <ConversationsCard />
      </div>

      {/* Analytics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={stats.salesChartData} />
        </div>

        <InventoryAlerts />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentOrders orders={stats.recentOrders} />

        <RecentInvoices invoices={stats.recentInvoices} />
      </div>

      {/* Conversations + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentConversations conversations={stats.recentConversations} />

        <ActivityFeed activities={stats.activities} />
      </div>
    </div>
  );
}
