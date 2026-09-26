# Loci

Loci is a Next.js application for small businesses managing customer conversations and commerce. The current codebase includes authenticated dashboard areas for contacts, conversations, products and subscriptions, public merchant storefronts, and an in-progress Paystack marketplace checkout and delayed-payout flow.

The app is under active development. WhatsApp/SMS automation, invoices, full order management, refunds, and marketplace payouts are not all production-ready. See [Docs/current-status.md](Docs/current-status.md) for the implementation snapshot and [Docs/roadmap.md](Docs/roadmap.md) for the next work.

## Requirements

- Node.js 24 (see `.nvmrc` and `package.json`)
- npm
- PostgreSQL
- Provider credentials only for the integrations you intend to run locally

## Local Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a local `.env` using variable names from `.env.template`. Set at minimum `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`. Add Google, Paystack, email, WhatsApp, SMS, or storage credentials only when testing those integrations. Never put production values in the repository.

3. Apply local development migrations and generate Prisma Client:

   ```sh
   npx prisma migrate dev
   npx prisma generate
   ```

   Prisma reads `src/lib/prisma/schema.prisma` and `prisma.config.ts`. Confirm the active `DATABASE_URL` points to a disposable development database before running migrations.

4. Start the development server:

   ```sh
   npm run dev
   ```

   `npm run dev` uses Next.js experimental HTTPS. Use `npm run dev:http` for plain HTTP; both scripts run Prisma migration/generation commands before starting Next.js.

## Useful Commands

| Command                                | Purpose                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:ci`                      | Run Vitest tests.                                                                                                           |
| `npx tsc --noEmit --incremental false` | Type-check without writing the TypeScript incremental cache.                                                                |
| `npm run lint:check`                   | Run ESLint without automatic fixes.                                                                                         |
| `npm run build`                        | Build the Next.js app. Check the `postbuild` script first: it runs `prisma migrate deploy` against the configured database. |
| `npx prisma migrate status`            | Check migrations for the datasource in the active environment.                                                              |

## Current Product Scope

- **Identity and access:** NextAuth credentials and Google sign-in, session-backed dashboard access, password/OTP paths.
- **Customer operations:** contacts, conversations, messaging APIs, phone-number/WABA setup, and dashboard settings.
- **Commerce:** merchant product management, public merchant/product pages, and single-product guest checkout using server-derived price and stock.
- **Billing:** subscription pricing and Paystack checkout; charge activation depends on verified payment processing.
- **Marketplace payout:** order ledger and payout-worker scaffolding with a dispute hold. Production transfers are disabled by default and require separate provider/compliance approval.

## Safety Notes

- Never commit `.env`, production database URLs, API keys, or provider secrets.
- The marketplace migration must be applied to each deployment database before deploying code that uses its schema.
- Keep `PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED=false` until Paystack confirms the funds-hold/disbursement model, legal review is complete, and the scheduled worker is operational.
- Paystack transfers do not constitute an escrow service. Do not market this flow as escrow without explicit approval and qualified legal guidance.

## Documentation

Start at [Docs/README.md](Docs/README.md). It links the current status, architecture, roadmap, and marketplace payment guide.
