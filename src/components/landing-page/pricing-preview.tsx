"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "./_sectionHeading";

const PLANS = [
  {
    name: "Basic",
    price: "$29",
    description: "Perfect for micro-businesses starting out on WhatsApp.",
    features: [
      "1 Connected WhatsApp Number",
      "Up to 500 Orders / month",
      "Basic Inventory (50 items)",
      "Standard Text Auto-Replies",
      "Email Support",
    ],
    isPopular: false,
    ctaText: "Get Started",
  },
  {
    name: "Standard",
    price: "$79",
    description:
      "Optimized for growing brands scaling their conversational sales.",
    features: [
      "2 Connected Numbers",
      "Unlimited Orders & Invoices",
      "Unlimited Digital Inventory",
      "AI Assistant Bot Integration",
      "Chat CRM Profile Building",
      "Priority Live Chat Support",
    ],
    isPopular: true,
    ctaText: "Start 14-Day Trial",
  },
  {
    name: "Premium",
    price: "$149",
    description: "Built for high-volume enterprises needing custom operations.",
    features: [
      "5+ Connected Numbers",
      "Everything in Standard",
      "Advanced Workflow Automation",
      "Custom Trained AI Agents",
      "Dedicated Account Manager",
      "99.9% Uptime SLA Guarantee",
    ],
    isPopular: false,
    ctaText: "Contact Sales",
  },
];

export function PricingPreview() {
  return (
    <section
      id="pricing"
      className="bg-background py-20 md:py-28 border-b border-border"
    >
      <div className="container max-w-6xl mx-auto px-4">
        {/* Section Heading Area */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          {/* <h2 className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            
          </h2>
          <h3 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            
          </h3> */}
          <SectionHeading
            title="Simple, Transparent Plans"
            subtitle="Packages to suit your business needs"
            description=" All plans come with a 14-day trial period. No credit card required"
          />
        </div>

        {/* Pricing Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`group relative rounded-2xl p-6 md:p-8 flex flex-col justify-between h-full transition-all duration-300
                ${
                  plan.isPopular
                    ? "border-2 border-primary bg-card shadow-xl md:-translate-y-4 scale-105 z-10"
                    : "border border-border bg-card/50 hover:bg-card hover:border-border/80 hover:shadow-md hover:-translate-y-1"
                }`}
            >
              {/* Popular Badge Decoration */}
              {plan.isPopular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold tracking-wider uppercase py-1 px-3 rounded-full shadow-sm">
                  Most Popular
                </span>
              )}

              {/* Top Details Card Block */}
              <div>
                <h4 className="text-xl font-bold text-foreground tracking-tight mb-2">
                  {plan.name}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed min-h-[40px] mb-6">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline text-foreground mb-6">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-sm font-medium text-muted-foreground">
                    /month
                  </span>
                </div>

                {/* Divider Line */}
                <div className="h-[1px] w-full bg-border mb-6" />

                {/* Inclusion Item Feature List */}
                <ul className="space-y-3.5 mb-8 text-sm text-card-foreground/90">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="p-0.5 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Call to Action Button Row */}
              <Button
                variant={plan.isPopular ? "default" : "outline"}
                className={`w-full font-semibold transition-all duration-200 mt-auto py-5
                  ${
                    plan.isPopular
                      ? "shadow-sm shadow-primary/20 hover:scale-[1.01]"
                      : "hover:bg-muted"
                  }`}
              >
                {plan.ctaText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
