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
import { PlanInterval, PlanName } from "@/lib/prisma/generated";
import Loader from "@/components/ui/loaders";
import toast from "react-hot-toast";
import { createSubscriptionAction } from "@/actions/subscription.actions";

export function PaymentCheckout({
  _email,
  amount,
  planName,
  billingInterval,
}: {
  _email?: string;
  amount: number;
  planName: PlanName;
  billingInterval: PlanInterval;
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
      const checkout = await createSubscriptionAction({
        planName,
        interval: billingInterval,
        email,
      });

      if (!checkout.ok) {
        toast.error(checkout.error);
        setIsProcessing(false);
        return;
      }

      window.location.assign(checkout.data.authorizationUrl);
    } catch (error) {
      console.error("Error initializing payment", error);
      toast.error("Unable to start checkout. Please try again.");
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
            <Label htmlFor="ref">Package</Label>
            <Input id="ref" name="ref" defaultValue={packag} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount Payable</Label>
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
