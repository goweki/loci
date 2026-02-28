import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SubscriptionStatus } from "@/types";
import { CheckCircle2Icon } from "lucide-react";

export default function SubscriptionInfo({
  subscriptionStatus,
}: {
  subscriptionStatus: SubscriptionStatus;
}) {
  return subscriptionStatus.plan ? (
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
          <span>{subscriptionStatus.plan.maxPhoneNumbers} Phone Numbers</span>
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
  ) : (
    "No Active Subscription Plan Found"
  );
}
