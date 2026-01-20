import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { Plan, Subscription } from "@/lib/prisma/generated";
import { CheckCircle2Icon, CreditCardIcon } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { SubscriptionStatus } from "@/types";
import { getSubscriptionStatusByUserId } from "@/data/subscription";

export default function TabSubscription({ userId }: { userId: string }) {
  const { language } = useI18n();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>();

  useEffect(() => {
    const getSubStatus = async () => {
      const _subscriptionStatus = await getSubscriptionStatusByUserId(userId);
      setSubscriptionStatus(_subscriptionStatus);
    };
    getSubStatus();
  }, [userId]);

  return (
    <TabsContent value="subscription" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription & Payments</CardTitle>
          <CardDescription>
            Manage your subscription plan and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscriptionStatus?.plan ? (
            <>
              <div className="p-6 border rounded-lg space-y-4 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">
                      {subscriptionStatus.plan.name} Plan
                    </h3>
                    <p className="text-muted-foreground">
                      {subscriptionStatus.plan.description}
                    </p>
                  </div>
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {subscriptionStatus.plan.interval}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    KSH {subscriptionStatus.plan.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    /{subscriptionStatus.plan.interval.toLowerCase()}
                  </span>
                </div>

                <Separator />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                    <span>
                      {subscriptionStatus.plan.maxPhoneNumbers} Phone Numbers
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                    <span>
                      {subscriptionStatus.plan.maxMessagesPerMonth.toLocaleString()}{" "}
                      Messages/month
                    </span>
                  </div>
                </div>

                {/* <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">
                    Change Plan
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Cancel Subscription
                  </Button>
                </div> */}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Billing Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Next billing date
                    </span>
                    <span className="font-medium">
                      {subscriptionStatus.expiresAt &&
                        new Date(
                          subscriptionStatus.expiresAt,
                        ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Payment method
                    </span>
                    <Button variant="ghost" size="sm">
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-4">
              <CreditCardIcon className="w-16 h-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  No Active Subscription
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Choose a plan to access paid features
                </p>
              </div>
              <Link
                href={`/${language}/settings/billing`}
                className={buttonVariants({ variant: "default" })}
              >
                View Plans
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View your past transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No payment history available
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
