# Architecture

## Stack

- Next.js App Router with locale-prefixed routes under `src/app/[lang]/`.
- React server and client components; server actions use the `"use server"` directive.
- Prisma/PostgreSQL schema at `src/lib/prisma/schema.prisma`; generated client at `src/lib/prisma/generated/`; migrations at `src/lib/prisma/migrations/`.
- NextAuth handles credentials/Google sign-in and JWT sessions.
- Paystack collection and transfer API calls are server-only.

## Main Boundaries

- `src/app/`: layouts, pages, and API route handlers.
- `src/actions/`: UI-safe server actions and request validation/authorization boundaries.
- `src/services/`: business logic and Prisma operations. Commerce services live in `src/services/commerce/`.
- `src/components/`: dashboard, public storefront, forms, and shared UI.
- `src/lib/`: auth, Prisma, providers, validation, and infrastructure helpers.
- `src/tests/`: Vitest tests.

Preferred request path:

1. Page or client component calls a server action/API route.
2. The action identifies the authenticated actor or validates a purpose-specific guest token.
3. A service enforces ownership, state transitions, and business rules.
4. Prisma persists the change, using transactions for related state updates.
5. Provider calls and webhooks stay server-side; external callbacks never replace local verification.

## Route Groups

- `(auth)`: sign-in and account flows.
- `(protected)`: signed-in dashboard and settings.
- `(public)`: marketing and informational pages.
- `(mid-pages)`: public merchant storefront, public product, and guest order-confirmation pages.
- `src/app/api/`: NextAuth, messaging, integrations, and Paystack/WhatsApp webhooks.

## Commerce Ownership

- `Product.userId` identifies the merchant.
- `Order.userId` is the merchant owner, not the guest buyer. Buyer name/email/phone are stored separately on marketplace orders.
- `Payment` belongs to an order; `SubscriptionPayment` belongs to a subscription. Provider references are unique in the database.
- `OrderPayout` stores the seller transfer intent; `LedgerTransaction` and `LedgerEntry` record marketplace financial movements.
- Guest order actions use a hash of a random token. Do not expose the token hash or provider secrets to the client.

## Configuration and Commands

Use `.env.template` for variable names, never real values. Core names include `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `PAYSTACK_SECRET_KEY`, and Google provider credentials. Marketplace operations also use `MARKETPLACE_DISPUTE_WINDOW_HOURS`, `CRON_SECRET`, and `PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED`.

- `npm run dev`: local development server; the script runs Prisma development migration/generation first.
- `npm run build`: Next.js production build. Check the `postbuild` script and target environment before running because it invokes migration deploy.
- `npm run test:ci`: Vitest suite.
- `npx tsc --noEmit --incremental false`: type-check without writing the incremental cache.
- `npx prisma migrate status`: inspect migration state for the datasource configured by the active environment.
- `npx prisma migrate deploy`: apply committed migrations to the configured datasource. Confirm the target environment before running.

Never run a migration or database utility against production until the target URL, backup, and release approval are verified.
