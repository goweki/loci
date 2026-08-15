import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Payment } from "@/lib/prisma/generated";
import { CreditCardIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { SubscriptionStatusCheck } from "@/types";
import Loader from "@/components/ui/loaders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dateShort } from "@/lib/utils/dateHandlers";
import { useSession } from "next-auth/react";
import SubscriptionInfo from "../settings/settings-client/subscription/subscription-info";
import BillingInfo from "../settings/settings-client/subscription/billing-info";

export default function SubscriptionInfoWrapper({
  subscriptionStatusCheck,
}: {
  subscriptionStatusCheck: SubscriptionStatusCheck;
}) {
  const { language } = useI18n();
  const { data: session } = useSession();
  const subscription = subscriptionStatusCheck.subscription;

  return subscription &&
    subscription.payments &&
    subscription.payments.length > 0 ? (
    <div className="space-y-6 my-12">
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Your subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription?.plan ? (
            <>
              <SubscriptionInfo
                subscriptionStatusCheck={subscriptionStatusCheck}
              />

              <Separator />

              <BillingInfo subscriptionStatusCheck={subscriptionStatusCheck} />
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
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <div className="flex flex-row justify-between">
            <CardDescription>Your past transactions</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {subscription.payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment history available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscription.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.transactionId}
                    </TableCell>

                    <TableCell>{payment.paymentMethod}</TableCell>

                    <TableCell>
                      {payment.currency} {payment.amount.toLocaleString()}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "SUCCESS"
                            ? "default"
                            : payment.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>

                    <TableCell>{dateShort(payment.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  ) : null;
}
