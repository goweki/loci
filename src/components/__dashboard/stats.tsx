// @/components/dashboard/dashboard-stats.tsx

"use client";

import { useI18n } from "@/lib/i18n";
import {
  MessageSquare,
  Phone,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Card } from "../ui/card";
import { LucideIcon } from "lucide-react";

const translations = {
  en: {
    totalMessages: "Total Messages",
    activeContacts: "Active Contacts",
    responseRate: "Response Rate",
    phoneNumbers: "Phone Numbers",
  },
  sw: {
    totalMessages: "Jumla ya Ujumbe",
    activeContacts: "Anwani Hai",
    responseRate: "Kiwango cha Majibu",
    phoneNumbers: "Nambari za Simu",
  },
};

// interface StatValue {
//   label: string;
//   value: string;
//   change: string | number;
//   trend: "up" | "down";
//   icon: LucideIcon;
//   color: string;
// }

export type StatsAttribute =
  | "totalMessages"
  | "activeContacts"
  | "responseRate"
  | "phoneNumbers";

export interface StatItem {
  label: string;
  value: string;
  change: string | number;
  trend: "up" | "down";
}

type StatItemUI = StatItem & { icon: LucideIcon; color: string };

export type DashboardStatsProps = Record<StatsAttribute, StatItem>;

export default function DashboardStats({
  stats,
}: {
  stats: DashboardStatsProps;
}) {
  const { totalMessages, activeContacts, responseRate, phoneNumbers } = stats;
  const { language } = useI18n();
  const t = translations[language];

  const statsConfig: StatItemUI[] = [
    {
      label: t.totalMessages,
      value: totalMessages.value.toLocaleString(),
      change: totalMessages.change,
      trend: totalMessages.trend,
      icon: MessageSquare,
      color: "bg-muted text-muted-foreground",
    },
    {
      label: t.activeContacts,
      value: activeContacts.value.toLocaleString(),
      change: activeContacts.change,
      trend: activeContacts.trend,
      icon: Users,
      color: "bg-muted text-muted-foreground",
    },
    {
      label: t.responseRate,
      value: `${responseRate.value}%`,
      change: responseRate.change,
      trend: responseRate.trend,
      icon: Zap,
      color: "bg-muted text-muted-foreground",
    },
    {
      label: t.phoneNumbers,
      value: phoneNumbers.value.toString(),
      change:
        typeof phoneNumbers.change === "number"
          ? `${phoneNumbers.change >= 0 ? "+" : ""}${phoneNumbers.change}`
          : phoneNumbers.change,
      trend: phoneNumbers.trend,
      icon: Phone,
      color: "bg-muted text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat, idx) => (
        <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
              <div className="flex items-center gap-1 mt-2">
                {stat.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
