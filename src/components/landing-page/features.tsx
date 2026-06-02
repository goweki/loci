"use client";

import {
  MessageCircle,
  Package,
  Receipt,
  Bot,
  CreditCard,
  Users,
} from "lucide-react";
import SectionHeading from "./_sectionHeading";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Unified Inbox",
    description:
      "Manage WhatsApp, SMS and customer conversations from one unified dashboard.",
  },
  {
    icon: Package,
    title: "Smart Inventory",
    description:
      "Create digital products and seamlessly manage your stock levels in real-time.",
  },
  {
    icon: Receipt,
    title: "Instant Invoices",
    description:
      "Generate beautiful digital invoices and track outstanding balances instantly.",
  },
  {
    icon: CreditCard,
    title: "Seamless Payments",
    description:
      "Share secure checkout links and collect customer payments directly in chat.",
  },
  {
    icon: Bot,
    title: "AI Automation",
    description:
      "Deploy trained AI agents to handle standard customer support and scale sales 24/7.",
  },
  {
    icon: Users,
    title: "Chat CRM",
    description:
      "Automatically build descriptive customer profiles straight from raw chat histories.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="bg-background py-20 md:py-28 border-b border-border"
    >
      <div className="container max-w-6xl mx-auto px-4">
        <SectionHeading
          title="Powerful Core Platform"
          subtitle="Everything you need to trade over chat"
        />

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border bg-card/40 p-6 md:p-8
                           hover:bg-card hover:border-border/80 transition-all duration-300 ease-out
                           hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Subtle top-light gradient card decoration */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon Wrapper */}
                <div
                  className="relative z-10 w-12 h-12 rounded-xl bg-muted border border-border 
                                flex items-center justify-center text-muted-foreground
                                group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20
                                transition-all duration-300 mb-6"
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>

                {/* Text Elements */}
                <div className="relative z-10">
                  <h4 className="font-semibold text-lg text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
