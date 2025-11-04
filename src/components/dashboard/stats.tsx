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

export default function DashboardStats() {
  const { language } = useI18n();
  const t = translations[language];

  const stats = [
    {
      label: t.totalMessages,
      value: "12,847",
      change: "+12.5%",
      trend: "up",
      icon: MessageSquare,
      color: "bg-muted text-muted-foreground",
    },
    {
      label: t.activeContacts,
      value: "3,421",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "bg-muted text-muted-foreground",
    },
    {
      label: t.responseRate,
      value: "94.8%",
      change: "-2.1%",
      trend: "down",
      icon: Zap,
      color: "bg-muted text-muted-foreground",
    },
    {
      label: t.phoneNumbers,
      value: "5",
      change: "+1",
      trend: "up",
      icon: Phone,
      color: "bg-muted text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
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
