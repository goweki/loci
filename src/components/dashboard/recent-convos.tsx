"use client";

import { useI18n } from "@/lib/i18n";
import { CheckCheck, Plus, Send, Zap } from "lucide-react";
import { Card } from "../ui/card";

const translations = {
  en: {
    recentConversations: "Recent Conversations",
    messageStats: "Message Statistics",
    viewAll: "View All",
  },
  sw: {
    recentConversations: "Mazungumzo ya Hivi Karibuni",
    messageStats: "Takwimu za Ujumbe",
    viewAll: "Tazama Zote",
  },
};

const recentConversations = [
  {
    name: "John Doe",
    phone: "+254712345678",
    message: "Thanks for the quick response!",
    time: "2m",
    unread: 0,
  },
  {
    name: "Jane Smith",
    phone: "+254723456789",
    message: "When will my order arrive?",
    time: "15m",
    unread: 2,
  },
  {
    name: "Mike Johnson",
    phone: "+254734567890",
    message: "I need help with...",
    time: "1h",
    unread: 1,
  },
  {
    name: "Sarah Wilson",
    phone: "+254745678901",
    message: "Great service!",
    time: "3h",
    unread: 0,
  },
];

export default function RecentConvos() {
  const { language } = useI18n();
  const t = translations[language];

  return (
    <Card>
      <div className="p-6 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold">{t.recentConversations}</h2>
        <button className="text-primary hover:underline font-medium transition-colors">
          {t.viewAll} →
        </button>
      </div>
      <div className="divide-y divide-border">
        {recentConversations.map((conv, idx) => (
          <div
            key={idx}
            className="p-6 hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                  {conv.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold m-0">{conv.name}</h3>
                    {conv.unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground/90">
                    {conv.phone}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {conv.message}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-muted-foreground">
                  {conv.time}
                </span>
                {conv.unread === 0 && (
                  <CheckCheck className="w-4 h-4 text-accent" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
