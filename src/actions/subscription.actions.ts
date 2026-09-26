"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Currency,
  PaymentMethod,
  PaymentStatus,
  PlanInterval,
  PlanName,
  SubscriptionStatus,
} from "@/lib/prisma/generated";
import {
  initializePaystackTransaction,
  PaystackApiError,
} from "@/lib/payments/paystack-api";
import { BASE_URL } from "@/lib/utils/getUrl";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { SubscriptionService } from "@/services/subscription/subscription.service";
import { ActionResult, SubscriptionStatusCheck } from "@/types";

function getPeriodEndDate(startDate: Date, interval: PlanInterval): Date {
  const endDate = new Date(startDate);
  if (interval === PlanInterval.MONTHLY) {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  return endDate;
}

export async function createSubscriptionAction({
  planName,
  interval,
  lang = "en",
  email,
}: {
  planName: PlanName;
  interval: PlanInterval;
  lang?: string;
  email?: string;
}): Promise<ActionResult<{ authorizationUrl: string; reference: string }>> {
  const actor = await requireUser();
  let subscriptionId: string | undefined;
  let paymentReference: string | undefined;

  try {
    const [plan, user] = await Promise.all([
      prisma.plan.findUnique({ where: { name: planName } }),
      prisma.user.findUnique({
        where: { id: actor.id },
        select: { email: true },
      }),
    ]);

    if (!plan?.active) {
      throw new Error("Selected subscription plan is unavailable");
    }
    const payerEmail = email?.trim() || user?.email;
    if (!payerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
      throw new Error("Add an email address before subscribing");
    }

    const amount =
      plan.monthlyPrice * (interval === PlanInterval.YEARLY ? 10 : 1);
    paymentReference = `loci-${randomUUID()}`;
    const now = new Date();
    const subscription = await prisma.subscription.create({
      data: {
        userId: actor.id,
        planId: plan.id,
        interval,
        status: SubscriptionStatus.INCOMPLETE,
        currentPeriodStart: now,
        currentPeriodEnd: getPeriodEndDate(now, interval),
        payments: {
          create: {
            transactionId: paymentReference,
            paymentMethod: PaymentMethod.PAYSTACK,
            amount,
            currency: Currency.KES,
            status: PaymentStatus.PENDING,
          },
        },
      },
      select: { id: true },
    });
    subscriptionId = subscription.id;

    const callbackUrl = new URL(
      `/${encodeURIComponent(lang)}/settings`,
      BASE_URL,
    );
    callbackUrl.searchParams.set("tab", "subscription");
    callbackUrl.searchParams.set("reference", paymentReference);

    const checkout = await initializePaystackTransaction({
      email: payerEmail,
      amount,
      currency: Currency.KES,
      reference: paymentReference,
      callbackUrl: callbackUrl.toString(),
      metadata: { subscriptionId, userId: actor.id, planName },
    });

    revalidatePath(`/${lang}/dashboard`);
    return {
      ok: true,
      data: {
        authorizationUrl: checkout.authorization_url,
        reference: paymentReference,
      },
    };
  } catch (error) {
    if (error instanceof PaystackApiError && error.outcomeUnknown) {
      return {
        ok: false,
        error: `Payment setup status is unknown. Do not retry yet. Reference: ${paymentReference ?? "pending"}`,
      };
    }

    if (subscriptionId && paymentReference) {
      await prisma
        .$transaction([
          prisma.subscriptionPayment.updateMany({
            where: {
              transactionId: paymentReference,
              status: PaymentStatus.PENDING,
            },
            data: { status: PaymentStatus.FAILED },
          }),
          prisma.subscription.updateMany({
            where: {
              id: subscriptionId,
              status: SubscriptionStatus.INCOMPLETE,
            },
            data: { status: SubscriptionStatus.CANCELED },
          }),
        ])
        .catch(() => undefined);
    }

    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}

export async function cancelSubscription(subscriptionId: string) {
  const actor = await requireUser();
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: actor.id },
    });
    if (!subscription) throw new Error("Subscription not found");

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    revalidatePath("/dashboard/billing");
    return { success: true, subscription: updated };
  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}

export async function getUserSubscription(): Promise<
  ActionResult<SubscriptionStatusCheck>
> {
  const actor = await requireUser();
  try {
    const subscriptionCheck = await SubscriptionService.getSubscriptionByUserId(
      actor.id,
    );
    return { ok: true, data: subscriptionCheck };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}
