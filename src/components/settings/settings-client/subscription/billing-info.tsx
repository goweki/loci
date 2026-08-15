import { SubscriptionStatusCheck } from "@/types";

export default function BillingInfo({
  subscriptionStatusCheck,
}: {
  subscriptionStatusCheck: SubscriptionStatusCheck;
}) {
  const subscription = subscriptionStatusCheck.subscription;
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Billing Information</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">
            Next billing date
          </span>
          <span className="font-medium">
            {subscription?.currentPeriodEnd &&
              new Date(subscription?.currentPeriodEnd).toLocaleDateString()}
          </span>
        </div>
        {/* <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">Payment method</span>
          <Button variant="ghost" size="sm">
            Update
          </Button>
        </div> */}
      </div>
    </div>
  );
}
