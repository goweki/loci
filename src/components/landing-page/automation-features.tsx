"use client";

import { Bot, Workflow, MessageSquare, type LucideIcon } from "lucide-react";
import SectionHeading from "./_sectionHeading";

const AUTOMATION_STEPS = [
  {
    icon: Bot,
    title: "AI Assistant",
    description:
      "Deploy contextual AI bots that read catalog data and close transactions automatically.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Trigger transactional system webhooks, inventory adjustments, and shipping rules on specific customer behaviors.",
  },
  {
    icon: MessageSquare,
    title: "Auto Replies",
    description:
      "Set up instant answers for common inquiries like business hours, tracking numbers, and locations.",
  },
];

export function AutomationFeatures() {
  return (
    <section className="bg-muted/40 py-20 md:py-28 border-y border-border">
      <div className="container max-w-6xl mx-auto px-4">
        <SectionHeading
          title="Intelligent Operations"
          subtitle="AI & Automation"
        />

        {/* Cohesive Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {AUTOMATION_STEPS.map((item) => (
            <AutomationCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface AutomationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

function AutomationCard({
  icon: Icon,
  title,
  description,
}: AutomationCardProps) {
  return (
    <div
      className="group relative rounded-2xl border border-border bg-card/60 p-6 md:p-8
                    hover:bg-card hover:border-border/80 transition-all duration-300 ease-out
                    hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Structural Card Light Gradient Decoration */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Styled Icon Wrapper - Matching Core Features */}
      <div
        className="relative z-10 w-12 h-12 rounded-xl bg-background border border-border 
                      flex items-center justify-center text-muted-foreground
                      group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20
                      transition-all duration-300 mb-6"
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>

      {/* Content Block */}
      <div className="relative z-10">
        <h4 className="font-semibold text-lg text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
          {title}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
