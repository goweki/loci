import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function TabBilling({
  activeSubscription,
}: {
  activeSubscription: Subscription & { plan: Plan };
}) {
  return (
    <TabsContent value="billing" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription & Billing</CardTitle>
          <CardDescription>
            Manage your subscription plan and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeSubscription ? (
            <>
              <div className="p-6 border rounded-lg space-y-4 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">
                      {activeSubscription.plan.name} Plan
                    </h3>
                    <p className="text-muted-foreground">
                      {activeSubscription.plan.description}
                    </p>
                  </div>
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {activeSubscription.plan.interval}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    KSH {activeSubscription.plan.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    /{activeSubscription.plan.interval.toLowerCase()}
                  </span>
                </div>

                <Separator />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                    <span>
                      {activeSubscription.plan.maxPhoneNumbers} Phone Numbers
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                    <span>
                      {activeSubscription.plan.maxMessagesPerMonth.toLocaleString()}{" "}
                      Messages/month
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">
                    Change Plan
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Cancel Subscription
                  </Button>
                </div>
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
                      {new Date(
                        activeSubscription.startDate
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
                  Choose a plan to start using our WhatsApp Business services
                </p>
              </div>
              <Button>View Plans</Button>
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
