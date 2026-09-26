# Marketplace Payments

## Current Design

Loci uses Paystack for collection. The marketplace service currently supports **one product per guest order**:

1. The public product card collects buyer name, email, phone, and quantity.
2. The server reloads the active product and merchant, checks active `STANDARD`/`PREMIUM` subscription eligibility, derives amount/currency, reserves stock, snapshots an order item, and creates a pending `Payment`.
3. Paystack Checkout is initialized server-side. The callback carries a guest token; the callback itself is not payment proof.
4. The Paystack webhook validates HMAC, stores an idempotency event, verifies successful transactions with Paystack, and checks reference, amount, and currency against local payment records.
5. Successful collection updates the payment, order, and initial ledger in a database transaction.
6. Buyer can view the order, confirm delivery, or open a dispute with the guest token.
7. Seller payout recipient, `OrderPayout`, and ledger structures exist. Transfers run only through the protected payout cron endpoint and only if `PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED=true`.

## Important Current Gap

The hold window is checked when a payout is requested. If the buyer confirms delivery **before** `MARKETPLACE_DISPUTE_WINDOW_HOURS` elapses, the action returns without creating a queued payout. The cron worker currently processes `QUEUED` payout rows; it does not create intents for delivered orders whose hold window later expires. Therefore, early-confirmed orders may never be paid out. Fix the worker to discover eligible delivered orders and create their payout intents, or persist a `releaseAt` and enqueue them at delivery confirmation.

## Payout Safety

- Keep `PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED=false` in production until Paystack and compliance approve Loci collecting and holding seller proceeds.
- Set `MARKETPLACE_DISPUTE_WINDOW_HOURS` to a positive, reviewed value before testing release eligibility. Missing/invalid values should block payout.
- Configure `CRON_SECRET` in deployment and schedule `POST /api/cron/marketplace-payouts` with `Authorization: Bearer $CRON_SECRET`.
- Monitor queued, pending, failed, and reversed payouts. A transfer with an uncertain provider outcome must be verified using the same reference; do not create another transfer reference to retry.
- Paystack Split Payments distribute settlement; they are not an order-level escrow. Transfers pay from the integration's Paystack balance and do not establish regulated escrow.

## Remaining Work

- Discover orders that become eligible after the dispute window even if delivery was confirmed earlier.
- Add durable payout claims/outbox semantics, scheduler monitoring, alerts, and administrative reconciliation.
- Separate guest credentials for view/delivery/dispute; reduce token exposure in callback URLs and referrers; enforce token state/one-time use.
- Add delivery proof, dispute review/resolution, and a no-confirmation fallback.
- Implement fees, refunds, refund webhooks, chargebacks, balanced refund/reversal ledger entries, and post-payout recovery.
- Extend tests beyond the current mocked suite to cover stock rollback, checkout initialization failure/ambiguity, payment mismatch, webhook replay, ledger balances, disputes, and transfer success/failure/reversal/retry.
- Run Paystack sandbox tests and get written confirmation of live transfer eligibility, currency, settlement schedule, and how long funds may be held. Obtain jurisdiction-specific legal advice before calling this escrow or enabling transfers.

## Database and Code

- Schema: `src/lib/prisma/schema.prisma`
- Migration: `src/lib/prisma/migrations/20260926120000_marketplace_delayed_payouts/migration.sql`
- Core service: `src/services/commerce/marketplace-payment.service.ts`
- Server actions: `src/actions/marketplace.actions.ts`
- Checkout UI: `src/components/dashboard/products/product-view/purchase-card.tsx`
- Paystack webhook: `src/app/api/webhooks/paystack/route.ts`
- Protected worker: `src/app/api/cron/marketplace-payouts/route.ts`

The migration is applied to the local development database only. Confirm/apply it through the release migration process on each deployment database before deploying code that uses these fields.
