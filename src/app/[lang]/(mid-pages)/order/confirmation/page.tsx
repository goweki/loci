import { notFound } from "next/navigation";

import {
  confirmMarketplacePaymentAction,
  getPublicOrderConfirmationAction,
} from "@/actions/marketplace.actions";
import { OrderConfirmationClient } from "./order-confirmation-client";

type Props = {
  searchParams: Promise<{
    token?: string;
    reference?: string;
  }>;
};

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const { token, reference } = await searchParams;
  if (!token) notFound();

  if (reference) {
    await confirmMarketplacePaymentAction(token, reference);
  }

  const orderResult = await getPublicOrderConfirmationAction(token);
  if (!orderResult.ok) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold">Order confirmation</h1>
      <OrderConfirmationClient token={token} order={orderResult.data} />
    </main>
  );
}
