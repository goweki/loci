"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { initializePayment } from "@/lib/payments";
import {
  Currency,
  PaymentMethod,
  PlanInterval,
  PlanName,
} from "@/lib/prisma/generated";
import Loader from "@/components/ui/loaders";
import toast from "react-hot-toast";
import { createOrderAction } from "@/actions/order.actions";
import { getPlanByName } from "@/actions/product.actions";
import { createPaymentAction } from "@/actions/payment.actions";
import { createSubscription } from "@/actions/subscription.actions";

export function PaymentCheckout({
  _email,
  amount,
  planName,
  billingInterval,
  userId,
}: {
  _email?: string;
  amount: number;
  planName: PlanName;
  billingInterval: PlanInterval;
  userId: string;
}) {
  const packag = `${planName}_${billingInterval}`;
  const [email, setEmail] = useState<string | undefined>(_email || "");

  const [isProcessing, setIsProcessing] = useState(false);

  async function initPayment() {
    if (!email) {
      toast.error("Please provide an email");
      return;
    }

    setIsProcessing(true);

    try {
      // 1️⃣ Create subscription
      const subscription = await createSubscription({
        userId,
        planName: planName as PlanName,
        interval: billingInterval,
        paymentMethod: PaymentMethod.PAYSTACK,
        amount,
      });

      // 2️⃣ Create payment record in DB
      const reference = `${packag}_${userId}_${Date.now()}`;
      const planRes = await getPlanByName(planName);

      if (!planRes.ok) {
        throw new Error(`Plan does not exist: ${planName}`);
      }

      const orderRes = await createOrderAction({
        currency: Currency.KES,
        notes: "LOCi subscription",
        items: [
          {
            productId: planRes.data.id,
            quantity: 1,
          },
        ],
      });

      if (!orderRes.ok) {
        throw new Error(`Order creation for plan failed: ${planName}`);
      }

      await createPaymentAction({
        reference,
        orderId: orderRes.data.id,
        amount,
        method: PaymentMethod.PAYSTACK,
      });

      // 3️⃣ Initialize Paystack payment
      const result = await initializePayment(email, amount, reference);

      if (result?.authorization_url) {
        // 4️⃣ Redirect user to Paystack checkout
        window.location.href = result.authorization_url;
      } else {
        // Payment initialization failed
        console.error("Payment initialization failed", result);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error initializing payment", error);
      setIsProcessing(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          Buy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Confirm Purchase</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Package</Label>
            <Input id="ref" name="ref" defaultValue={packag} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Amount Payable</Label>
            <Input id="amount" name="amount" defaultValue={amount} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        <div>
          <Button
            onClick={async () => {
              await initPayment();
            }}
            disabled={!email || isProcessing}
          >
            {!isProcessing ? "Checkout" : <Loader size={4} />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
