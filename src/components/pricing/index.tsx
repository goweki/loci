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
import { getAllActivePlans, PlanBasePayload } from "@/data/plan";
import Loader from "@/components/ui/loaders";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { PaymentCheckout } from "./payment-form";
import { SubscriptionStatus, SubscriptionStatusEnum } from "@/types";
import { getSubscriptionStatusByUserId } from "@/data/subscription";
import SubscriptionInfoWrapper from "./subscription-info";

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
  const { language } = useI18n();
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [plans, setPlans] = useState<PlanBasePayload[]>();
  const { data: session } = useSession();
  const user = session?.user;
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>();

  const getSubscriptionStatus = useCallback(async () => {
    if (!session?.user.id) return;

    const _subscriptionStatus = await getSubscriptionStatusByUserId(
      session.user.id,
    );
    setSubscriptionStatus(_subscriptionStatus);
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

  const getPrice = ({ price }: { price: number }) => {
    return billingInterval === "monthly" ? price : price * 10;
  };

  const getSavings = ({ price }: { price: number }) => {
    const grossCost = price * 12;
    const netCost = price * 10;
    const savings = grossCost - netCost;
    return Math.round((savings / grossCost) * 100);
  };

  return !plans ? (
    <Loader />
  ) : (
    <div className="flex flex-col">
      {!subscriptionStatus ? null : <SubscriptionInfoWrapper />}

      {/* Billing interval toggle */}
      <div className="flex justify-center pb-12">
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

            {!subscriptionStatus ? null : !user ||
              subscriptionStatus.status ===
                SubscriptionStatusEnum.ACTIVE ? null : (
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
  );
}
