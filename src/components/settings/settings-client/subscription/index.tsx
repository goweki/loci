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
import { Payment } from "@/lib/prisma/generated";
import { CheckCircle2Icon, CreditCardIcon } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { SubscriptionStatus } from "@/types";
import { getSubscriptionStatusByUserId } from "@/data/subscription";
import Loader from "@/components/ui/loaders";
import { getPaymentsByUserId } from "@/data/payment";
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
import SubscriptionInfo from "./subscription-info";
import BillingInfo from "./billing-info";

export default function TabSubscription() {
  const { language } = useI18n();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>();
  const [payments, setPayments] = useState<Payment[]>();
  const { data: session } = useSession();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;

    const getSubStatus = async () => {
      const _subscriptionStatus = await getSubscriptionStatusByUserId(userId);
      setSubscriptionStatus(_subscriptionStatus);
    };
    const getPayments = async () => {
      const _payments = await getPaymentsByUserId(userId);
      setPayments(_payments);
    };

    getSubStatus();
    getPayments();
  }, [userId]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Your subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!subscriptionStatus ? (
            <Loader />
          ) : subscriptionStatus?.plan ? (
            <>
              <SubscriptionInfo subscriptionStatus={subscriptionStatus} />

              <Separator />

              <BillingInfo subscriptionStatus={subscriptionStatus} />
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
          <div className="flex flex-row justify-between">
            <CardDescription>Your past transactions</CardDescription>
            <Link
              href={`/${language}/settings/billing`}
              className={buttonVariants({ variant: "ghost" })}
            >
              View all Payments
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!payments ? (
            <Loader />
          ) : payments.length === 0 ? (
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
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.reference}
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
    </>
  );
}
