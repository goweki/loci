"use client";

import {
  Package,
  ShoppingCart,
  Receipt,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import SectionHeading from "./_sectionHeading";

export function CommerceFeatures() {
  return (
    <section className="bg-background py-20 md:py-28 border-b border-border">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Section Heading */}
        {/* <div className="max-w-3xl mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Commerce built directly into conversations
          </h2>
          <p className="text-muted-foreground text-lg">
            Turn raw WhatsApp conversations into streamlined, recurring revenue
            pipelines.
          </p>
        </div> */}
        <SectionHeading
          title="Commerce built directly into conversations"
          subtitle="Turn conversations into streamlined revenue
            pipelines"
        />

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          <FeatureCard
            icon={Package}
            title="Inventory Management"
            description="Sync digital catalogs dynamically and automatically track item balances as conversations close."
          />
          <FeatureCard
            icon={ShoppingCart}
            title="Interactive Orders"
            description="Convert simple chat queries into explicit customer shopping carts ready for validation."
          />
          <FeatureCard
            icon={Receipt}
            title="Automated Invoicing"
            description="Instantly render and dispatch elegant local receipt documentation without stepping out of the thread."
          />
          <FeatureCard
            icon={CreditCard}
            title="Direct Payment Links"
            description="Deploy safe, instant checkout parameters securing mobile money and card transactions on-demand."
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8
                    hover:border-border/80 transition-all duration-300 ease-in-out
                    hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
    >
      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.015] to-transparent pointer-events-none" />

      <div className="flex items-start gap-5">
        {/* Rounded Icon Box */}
        <div
          className="p-3 rounded-xl border border-border/60 bg-muted/50 text-foreground
                        group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20
                        transition-all duration-300 shrink-0"
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>

        {/* Text Area */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
