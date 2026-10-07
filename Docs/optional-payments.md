# Optional marketplace payments

Marketplace payments are an existing, separate capability. They are not a dependency of the core WhatsApp assistant product and remain a maybe feature. Do not make assistant setup, customer messaging, notifications, or QR inventory depend on marketplace payment activation.

## Current implementation

Guest checkout supports one product per order. The server loads the product and merchant, validates eligibility and stock, calculates the amount, creates an order/payment, and initializes Paystack. A browser redirect is not proof of payment. The webhook validates its signature, verifies the transaction with Paystack, checks the local reference/amount/currency, and updates payment/order/ledger state.

Payout recipient/record models and a protected cron route exist. Transfers require `PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED=true`; keep this disabled until eligibility, legal, operational, and reconciliation requirements are understood.

## Known limitations

- A buyer confirming delivery before the dispute hold expires may leave the order without a queued payout when it later becomes eligible.
- Refunds, chargebacks, full reconciliation, dispute operations, and balanced reversal flows are incomplete.
- One item per order; no multi-item cart.
- Sandbox/live transfer eligibility and jurisdictional requirements require verification.

## Key code

- `src/services/commerce/marketplace-payment.service.ts`
- `src/actions/marketplace.actions.ts`
- `src/app/api/webhooks/paystack/route.ts`
- `src/app/api/cron/marketplace-payouts/route.ts`
- `src/lib/prisma/schema.prisma`

Do not enable transfers based only on the existence of these code paths. Complete the payout queue/reconciliation gap and required provider/compliance review first.
