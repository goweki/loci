"use client";

import { useI18n } from "@/lib/i18n";
import { Plus, Send, Zap } from "lucide-react";
import { Card } from "../ui/card";

const translations = {
  en: {
    quickActions: "Quick Actions",
    sendMessage: "Send Message",
    addContact: "Add Contact",
    createRule: "Create Auto-Reply",
  },
  sw: {
    quickActions: "Vitendo vya Haraka",
    sendMessage: "Tuma Ujumbe",
    addContact: "Ongeza Anwani",
    createRule: "Unda Kanuni ya Kiotomatiki",
  },
};

export default function QuickActions() {
  const { language } = useI18n();
  const t = translations[language];

  const quickActions = [
    {
      label: t.sendMessage,
      icon: Send,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: t.addContact,
      icon: Plus,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      label: t.createRule,
      icon: Zap,
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">{t.quickActions}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            className={`${action.color} text-white p-4 rounded-lg flex items-center justify-center gap-3 transition-colors`}
          >
            <action.icon className="w-5 h-5" />
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
