"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    id: "item-1",
    question: "Do I need a WhatsApp Business Account?",
    answer:
      "Yes, you need a official WhatsApp Business Account (WABA) or a standard Business App profile. Our system guides you through a safe, quick Meta authentication process to connect your number in under two minutes.",
  },
  {
    id: "item-2",
    question: "Can I safely send custom payment links?",
    answer:
      "Absolutely. You can dynamically generate legal invoices and securely embed encrypted checkout parameters directly inside your customer chats. We natively support major local credit providers and mobile money networks.",
  },
  {
    id: "item-3",
    question: "How does the 14-day free trial work?",
    answer:
      "You get full, unrestricted access to all platform tools in your chosen plan for two full weeks. We don't ask for any credit card or payment authorization details upfront—if you choose not to subscribe, you won't be charged a thing.",
  },
  {
    id: "item-4",
    question: "Can I connect multiple phone numbers to one dashboard?",
    answer:
      "Yes! Depending on your chosen tier (Standard supports 2 numbers, Premium supports 5+), your customer service representatives can manage separate incoming channel numbers simultaneously from a single, centralized workspace.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 border-y border-border">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Section Heading Area */}
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Got Questions?
          </h2>
          <h3 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h3>
        </div>

        {/* Accordion List Holder */}
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-2 md:p-4 shadow-sm">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border-b border-border/60 last:border-0 px-4 py-1"
              >
                <AccordionTrigger className="text-left font-semibold text-base md:text-lg text-foreground hover:text-primary hover:no-underline transition-colors duration-200 py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed pb-4 pt-1">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
