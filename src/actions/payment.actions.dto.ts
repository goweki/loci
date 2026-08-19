import { Prisma } from "@/lib/prisma/generated";

export type PaymentWithNumberAmount = Omit<
  Prisma.PaymentGetPayload<{}>,
  "amount"
> & {
  amount: number;
};
