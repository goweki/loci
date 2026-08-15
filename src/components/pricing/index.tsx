"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Check, X } from "lucide-react";
import Loader from "@/components/ui/loaders";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { PaymentCheckout } from "./payment-form";
import { SubscriptionStatusCheck } from "@/types";
import SubscriptionInfoWrapper from "./subscription-info";
import PageTitle from "@/components/ui/page-title";
import { getUserSubscription } from "@/actions/subscription.actions";
import toast from "react-hot-toast";
import { PlanInterval, SubscriptionStatus } from "@/lib/prisma/generated";
import { getAllActivePlans, PlanBasePayload } from "@/actions/plan.actions";

const translations = {
  en: {
    title: "Simple, Transparent Pricing",
    subtitle: "Choose the perfect plan for your business needs.",
    popular: "Most Popular",
    unlimited: "Unlimited",
    cta: "Get Started",
    billing: {
      monthly: "Monthly",
      annual: "Annual",
      month: "month",
      year: "year",
      save: "Save",
      saveUp: "Save up to 17%",
    },
    plans: {
      starter: {
        name: "Starter",
        description:
          "Perfect for small businesses just getting started with WhatsApp",
      },
      standard: {
        name: "Standard",
        description:
          "Ideal for growing businesses with multiple customer touchpoints",
      },
      enterprise: {
        name: "Enterprise",
        description:
          "Advanced features for large organizations with high volume needs",
      },
    },
    features: {
      phoneNumbers: "Phone Numbers",
      messages: "Messages per Month",
      basicTemplates: "Message Templates",
      emailSupport: "Email Support",
      analytics: "Advanced Analytics",
      automation: "Automation & Chatbots",
      prioritySupport: "Priority Support",
      customIntegrations: "Custom API Integrations",
    },
    footer: {
      text: "Need a custom plan for your organization?",
      contactLink: "Contact our sales team",
    },
  },
  sw: {
    title: "Bei Rahisi na Wazi",
    subtitle: "Chagua mpango kamili kwa mahitaji ya biashara yako.",
    popular: "Inayopendelewa",
    unlimited: "Bila Kikomo",
    cta: "Anza Sasa",
    billing: {
      monthly: "Kila Mwezi",
      annual: "Kila Mwaka",
      month: "mwezi",
      year: "mwaka",
      save: "Okoa",
      saveUp: "Okoa hadi 17%",
    },
    plans: {
      starter: {
        name: "Mwanzo",
        description: "Kamili kwa biashara ndogo zinazoanza na WhatsApp",
      },
      standard: {
        name: "Wastani",
        description:
          "Bora kwa biashara zinazokua na mahali pa kuwasiliana na wateja wengi",
      },
      enterprise: {
        name: "Makampuni",
        description:
          "Vipengele vya juu kwa mashirika makubwa yenye mahitaji ya kiasi kikubwa",
      },
    },
    features: {
      phoneNumbers: "Namba za Simu",
      messages: "Ujumbe Kwa Mwezi",
      basicTemplates: "Violezo vya Ujumbe",
      emailSupport: "Msaada wa Barua Pepe",
      analytics: "Takwimu za Hali ya Juu",
      automation: "Otomatiki na Chatbots",
      prioritySupport: "Msaada wa Kipaumbele",
      customIntegrations: "Uunganisho wa API Maalum",
    },
    footer: {
      text: "Unahitaji mpango maalum kwa shirika lako?",
      contactLink: "Wasiliana na timu yetu ya mauzo",
    },
  },
};

export default function PricingComponent(props: { pageTitle?: boolean }) {
  const { pageTitle = true } = props;
  const { language } = useI18n();
  const [billingInterval, setBillingInterval] =
    useState<PlanInterval>("MONTHLY");
  const [plans, setPlans] = useState<PlanBasePayload[]>();
  const { data: session } = useSession();
  const user = session?.user;
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatusCheck>();

  const t = translations[language];

  const getSubscriptionStatus = useCallback(async () => {
    if (!session?.user.id) return;

    const resSubscriptionStatus = await getUserSubscription();
    if (!resSubscriptionStatus.ok) {
      toast.error(resSubscriptionStatus.error);
      return;
    }
    setSubscriptionStatus(resSubscriptionStatus.data);
  }, [session?.user.id]);

  useEffect(() => {
    getSubscriptionStatus();
  }, [getSubscriptionStatus]);

  const fetchPlans = useCallback(async () => {
    const plans_ = await getAllActivePlans();
    console.log(plans_);
    setPlans(plans_);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPrice = ({ monthlyPrice }: { monthlyPrice: number }) => {
    return billingInterval === "MONTHLY" ? monthlyPrice : monthlyPrice * 10;
  };

  const getSavings = ({ monthlyPrice }: { monthlyPrice: number }) => {
    const grossCost = monthlyPrice * 12;
    const netCost = monthlyPrice * 10;
    const savings = grossCost - netCost;
    return Math.round((savings / grossCost) * 100);
  };

  return !plans ? (
    <Loader />
  ) : (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      {pageTitle && <PageTitle title={t.title} subtitle={t.subtitle} />}

      <div className="flex flex-col">
        {!subscriptionStatus ? null : (
          <SubscriptionInfoWrapper
            subscriptionStatusCheck={subscriptionStatus}
          />
        )}

        {/* Billing interval toggle */}
        <div className="flex justify-center pb-12">
          <div className="inline-flex items-center bg-muted rounded-lg p-1">
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "MONTHLY"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setBillingInterval("MONTHLY")}
            >
              {t.billing.monthly}
            </button>
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "YEARLY"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setBillingInterval("YEARLY")}
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
                <CardTitle className="text-2xl font-bold mb-2 text-primary">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>

                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl lg:text-3xl font-bold underline">
                      {formatPrice(getPrice(plan))}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      /
                      {billingInterval === PlanInterval.MONTHLY
                        ? t.billing.month
                        : t.billing.year}
                    </span>
                  </div>
                  {billingInterval === PlanInterval.YEARLY && (
                    <p className="text-sm text-primary mt-2">
                      {t.billing.save} {getSavings(plan)}%
                    </p>
                  )}
                </div>
              </CardHeader>

              {!subscriptionStatus ? null : !user ||
                subscriptionStatus.status ===
                  SubscriptionStatus.ACTIVE ? null : (
                <div className="mb-4 flex justify-center px-4">
                  <PaymentCheckout
                    _email={user.email || undefined}
                    amount={getPrice(plan)}
                    planName={plan.name}
                    billingInterval={billingInterval}
                    userId={user.id}
                  />
                </div>
              )}

              <CardContent className="flex-grow">
                <ul className="space-y-3 w-fit m-auto">
                  {plan.planFeatures.map((feature, index) => (
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
                        {feature.feature.name ? (
                          <>
                            <span className="font-semibold">
                              {feature.limitUse}
                            </span>{" "}
                            {feature.feature.name}
                          </>
                        ) : (
                          feature.feature.name
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              {!user ? (
                <CardFooter className="pt-6">
                  <Link
                    href={`/${language}/sign-up`}
                    className={cn(
                      "w-full",
                      buttonVariants({
                        variant: plan.popular ? "default" : "outline",
                      }),
                    )}
                  >
                    {t.cta}
                  </Link>
                </CardFooter>
              ) : null}
            </Card>
          ))}
        </div>

        {/* FAQ or additional info */}
        {/* <div className="max-w-3xl mx-auto text-center mt-16">
        <p className="text-muted-foreground">
          {t.footer.text}{" "}
          <a href="#contact" className="text-primary hover:underline">
            {t.footer.contactLink}
          </a>
        </p>
      </div> */}
      </div>
    </div>
  );
}
