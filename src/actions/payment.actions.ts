"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PaymentWithNumberAmount } from "./payment.actions.dto";

export async function getPaymentsByUserId(): Promise<
  PaymentWithNumberAmount[]
> {
  const actor = await requireUser();
  const payments = await prisma.payment.findMany({
    where: { order: { userId: actor.id } },
    orderBy: { createdAt: "desc" },
  });

  return payments.map((payment) => ({
    ...payment,
    amount: payment.amount.toNumber(),
  }));
}
