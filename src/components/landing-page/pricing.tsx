"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Check, X } from "lucide-react";

interface PricingProps {
  t: {
    title: string;
    subtitle: string;
    popular: string;
    cta: string;
    plans: {
      starter: { name: string; description: string };
      standard: { name: string; description: string };
      enterprise: { name: string; description: string };
    };
    billing: {
      monthly: string;
      annual: string;
      saveUp: string;
      month: string;
      year: string;
      save: string;
    };
    features: {
      phoneNumbers: string;
      messages: string;
      basicTemplates: string;
      emailSupport: string;
      analytics: string;
      automation: string;
      prioritySupport: string;
      customIntegrations: string;
    };
    footer: { text: string; contactLink: string };
    unlimited: string;
  };
}

export default function PricingComponent({ t }: PricingProps) {
  const [billingInterval, setBillingInterval] = useState("monthly");

  // Static pricing data - will be replaced with DB data later
  const plans = [
    {
      id: "starter",
      name: t.plans.starter.name,
      description: t.plans.starter.description,
      monthlyPrice: 2500,
      annualPrice: 25000,
      maxPhoneNumbers: 1,
      maxMessagesPerMonth: 1000,
      popular: false,
      features: [
        { name: t.features.phoneNumbers, value: "1", enabled: true },
        { name: t.features.messages, value: "1,000", enabled: true },
        { name: t.features.basicTemplates, enabled: true },
        { name: t.features.emailSupport, enabled: true },
        { name: t.features.analytics, enabled: false },
        { name: t.features.automation, enabled: false },
        { name: t.features.prioritySupport, enabled: false },
        { name: t.features.customIntegrations, enabled: false },
      ],
    },
    {
      id: "standard",
      name: t.plans.standard.name,
      description: t.plans.standard.description,
      monthlyPrice: 7500,
      annualPrice: 75000,
      maxPhoneNumbers: 5,
      maxMessagesPerMonth: 10000,
      popular: true,
      features: [
        { name: t.features.phoneNumbers, value: "5", enabled: true },
        { name: t.features.messages, value: "10,000", enabled: true },
        { name: t.features.basicTemplates, enabled: true },
        { name: t.features.emailSupport, enabled: true },
        { name: t.features.analytics, enabled: true },
        { name: t.features.automation, enabled: true },
        { name: t.features.prioritySupport, enabled: false },
        { name: t.features.customIntegrations, enabled: false },
      ],
    },
    {
      id: "enterprise",
      name: t.plans.enterprise.name,
      description: t.plans.enterprise.description,
      monthlyPrice: 25000,
      annualPrice: 250000,
      maxPhoneNumbers: 999,
      maxMessagesPerMonth: 100000,
      popular: false,
      features: [
        { name: t.features.phoneNumbers, value: t.unlimited, enabled: true },
        { name: t.features.messages, value: "100,000+", enabled: true },
        { name: t.features.basicTemplates, enabled: true },
        { name: t.features.emailSupport, enabled: true },
        { name: t.features.analytics, enabled: true },
        { name: t.features.automation, enabled: true },
        { name: t.features.prioritySupport, enabled: true },
        { name: t.features.customIntegrations, enabled: true },
      ],
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPrice = ({
    monthlyPrice,
    annualPrice,
  }: {
    monthlyPrice: number;
    annualPrice: number;
  }) => {
    return billingInterval === "monthly" ? monthlyPrice : annualPrice;
  };

  const getSavings = ({
    monthlyPrice,
    annualPrice,
  }: {
    monthlyPrice: number;
    annualPrice: number;
  }) => {
    const monthlyCost = monthlyPrice * 12;
    const annualCost = annualPrice;
    const savings = monthlyCost - annualCost;
    return Math.round((savings / monthlyCost) * 100);
  };

  return (
    <section id="pricing" className="relative py-12 md:py-20">
      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.title}</h2>
          <p className="text-lg text-muted-foreground">{t.subtitle}</p>
        </div>

        {/* Billing interval toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-muted rounded-lg p-1">
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "monthly"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setBillingInterval("monthly")}
            >
              {t.billing.monthly}
            </button>
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "annual"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setBillingInterval("annual")}
            >
              {t.billing.annual}
              <span className="ml-2 text-xs text-primary font-semibold">
                {t.billing.saveUp}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    {t.popular}
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-bold mb-2">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>

                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold">
                      {formatPrice(getPrice(plan))}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      /
                      {billingInterval === "monthly"
                        ? t.billing.month
                        : t.billing.year}
                    </span>
                  </div>
                  {billingInterval === "annual" && (
                    <p className="text-sm text-primary mt-2">
                      {t.billing.save} {getSavings(plan)}%
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span
                        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                          feature.enabled ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        {feature.enabled ? (
                          <Check className="w-3 h-3 text-primary" />
                        ) : (
                          <X className="w-3 h-3 text-muted-foreground" />
                        )}
                      </span>
                      <span
                        className={
                          feature.enabled
                            ? "text-foreground"
                            : "text-muted-foreground line-through"
                        }
                      >
                        {feature.value ? (
                          <>
                            <span className="font-semibold">
                              {feature.value}
                            </span>{" "}
                            {feature.name}
                          </>
                        ) : (
                          feature.name
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-foreground hover:bg-accent"
                  }`}
                >
                  {t.cta}
                </button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ or additional info */}
        <div className="max-w-3xl mx-auto text-center mt-16">
          <p className="text-muted-foreground">
            {t.footer.text}{" "}
            <a href="#contact" className="text-primary hover:underline">
              {t.footer.contactLink}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
