"use client";

import { ArrowRight } from "lucide-react";
import SectionHeading from "./_sectionHeading";

const STEPS = [
  {
    title: "Connect WhatsApp",
    description: "Link your business number in under two minutes.",
  },
  {
    title: "Create Products",
    description: "Add items, pricing, and stock directly to your catalog.",
  },
  {
    title: "Send Invoices & Orders",
    description: "Share sleek, automated payment links in your chats.",
  },
  {
    title: "Get Paid",
    description: "Receive instant payouts securely into your account.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/40 border-y border-border py-20 md:py-28">
      <div className="container max-w-6xl mx-auto px-4">
        <SectionHeading
          title="How It Works"
          subtitle="Accepting order and payment in four simple steps"
        />

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 relative">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center group"
            >
              {/* Step Number Badge */}
              <div
                className="relative z-10 w-12 h-12 rounded-full border border-border bg-background 
                              flex items-center justify-center font-semibold text-sm text-foreground
                              shadow-sm group-hover:border-primary group-hover:text-primary 
                              transition-colors duration-300 mb-5"
              >
                {String(i + 1).padStart(2, "0")}
              </div>

              {/* Content */}
              <h3 className="font-semibold text-lg text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground max-w-[220px] leading-relaxed">
                {step.description}
              </p>

              {/* Connecting Desktop Arrow (Hidden on last item) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+1.5rem)] w-[calc(100%-3rem)] translate-y-[-50%] z-0">
                  <div className="flex items-center justify-center w-full">
                    {/* A clean, subtle dashed line leading to a miniature arrow */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-border via-border to-transparent border-dashed border-t" />
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0 ml-1" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
