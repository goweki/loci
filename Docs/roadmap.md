# Roadmap

Priorities are ordered by risk and launch dependency. A feature is not complete just because its UI exists; use the acceptance criteria below.

## P0: Protect Accounts, Data, and Funds

- Rotate/revoke production credentials that have been exposed outside the secret manager; update deployment secrets without committing replacements.
- Apply and verify the marketplace migration in every target environment before deploying code that uses its models.
- Apply and verify `20261007090000_chatbot_enabled_tools` before deploying WhatsApp assistant setup.
- Keep `PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED=false` until Paystack eligibility, legal review, production scheduler, and payout reconciliation are approved.
- Keep WhatsApp verification-token and request-signature checks covered by regression tests before enabling its UI.
- Use token-specific permissions for guest order viewing, delivery confirmation, and disputes; reduce callback-token leakage.

**Done when:** no production secret is in source/docs, target database migration status is known, webhook trust checks are tested, and marketplace transfers remain gated.

## P1: Finish Marketplace Reliability

- Add a durable payout outbox/worker that discovers delivered orders eligible after the hold window, even if the buyer confirmed early.
- Make payout claiming concurrency-safe; reconcile uncertain Paystack calls with the same reference and never blindly resubmit.
- Add an explicit no-confirmation policy, dispute review/decision workflow, and support/admin tooling.
- Implement refunds, refund webhooks, fees, chargebacks, ledger reversals, and post-payout recovery policy.
- Add checkout recovery for ambiguous initialization results and abandoned stock reservations.
- Add tests for pricing authority, stock reservation/restoration, amount/currency mismatch, webhook replay/order, balanced ledger, delivery/dispute races, and all transfer states.

**Done when:** failure/replay/race cases are automated; funds reconcile to Paystack; no payout can bypass delivery, hold, dispute, or seller-eligibility checks.

## P2: Complete Commerce Operations

- Add multi-item cart and delivery/address capture.
- Finish merchant product edit/delete/activation and stock workflows.
- Add protected order management and shipment updates.
- Build invoice actions and agree tax/fee rules before replacing the current hard-coded tax calculation.

**Done when:** merchants can manage products, orders, fulfillment, invoices, and refunds end-to-end with owner-scoped access.

## P3: Complete Messaging Product

- Enable WhatsApp UI only after webhook verification, sending, templates, and account onboarding pass production checks.
- Finish per-customer Meta token lifecycle and secret storage; replace the current single environment token where multiple customer WABAs require separate credentials.
- Complete durable inbound/outbound processing, retry/outbox behavior, assistant provider adapters, approved-template sending, and live inbox refresh.
- Add CV/document ingestion with user review, provider/tool-call evaluation cases, usage limits, and operational traces with privacy controls.
- Verify SMS provider configuration, delivery status handling, and failure reporting.
- Add database-backed tests for ownership, webhook replay/concurrency, provider failure, and outbound retry behavior.

**Done when:** setup and messaging workflows have tested success, permission, provider-failure, and retry states.

## Release Checks

1. `npm run test:ci`
2. `npx tsc --noEmit --incremental false`
3. `npm run lint:check`
4. `npm run build` against the intended deployment environment, after checking `postbuild` migration behavior.
5. `npx prisma migrate status` for the target database.
6. Paystack sandbox collection, verification, refund, recipient, transfer, and webhook checks.
7. Production environment/secret review and rollback plan.
