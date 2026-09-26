"use client";

import { FormEvent, useState } from "react";
import {
  confirmOrderDeliveryAction,
  openOrderDisputeAction,
} from "@/actions/marketplace.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type PublicOrderSummary = {
  id: string;
  status: string;
  fulfillmentStatus: string;
  payoutStatus: string;
  currency: string;
  total: number;
  deliveryConfirmedAt: Date | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  payments: Array<{ status: string; paidAt: Date | null }>;
};

export function OrderConfirmationClient({
  token,
  order,
}: {
  token: string;
  order: PublicOrderSummary;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  const paymentStatus = order.payments[0]?.status ?? "PENDING";
  const canConfirmDelivery =
    paymentStatus === "SUCCESS" &&
    order.status === "PAID" &&
    !order.deliveryConfirmedAt &&
    order.fulfillmentStatus !== "DISPUTED";

  async function confirmDelivery() {
    setBusy(true);
    setError("");
    const result = await confirmOrderDeliveryAction(token);
    if (result.ok) {
      setNotice(`Delivery confirmed. ${result.data.payoutMessage}.`);
    } else {
      setError(result.error);
    }
    setBusy(false);
  }

  async function openDispute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await openOrderDisputeAction(token, disputeReason);
    if (result.ok) {
      setNotice("Your dispute has been recorded. Seller payout is on hold.");
    } else {
      setError(result.error);
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {paymentStatus === "SUCCESS" ? "Payment received" : "Payment pending"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex justify-between gap-4 text-sm"
            >
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">
                {order.currency} {item.total.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Total</span>
            <span>
              {order.currency} {order.total.toLocaleString()}
            </span>
          </div>
        </div>

        {paymentStatus !== "SUCCESS" ? (
          <p className="text-sm text-muted-foreground">
            Paystack has not confirmed this payment yet. This page will reflect
            the confirmed order state when you return again.
          </p>
        ) : null}
        {order.deliveryConfirmedAt ? (
          <p className="text-sm text-green-700">Delivery confirmed.</p>
        ) : null}
        {notice ? <p className="text-sm text-green-700">{notice}</p> : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {canConfirmDelivery ? (
          <div className="space-y-4">
            <Button
              className="w-full"
              onClick={confirmDelivery}
              disabled={busy}
            >
              {busy ? "Updating..." : "Confirm delivery"}
            </Button>
            <form className="space-y-3 border-t pt-4" onSubmit={openDispute}>
              <label htmlFor="dispute-reason" className="text-sm font-medium">
                Report an order problem
              </label>
              <Textarea
                id="dispute-reason"
                minLength={5}
                maxLength={1000}
                required
                value={disputeReason}
                onChange={(event) => setDisputeReason(event.target.value)}
                placeholder="Describe what went wrong"
              />
              <Button type="submit" variant="outline" disabled={busy}>
                Open dispute
              </Button>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
