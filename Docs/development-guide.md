# Development guide

## Stack and code layout

- Next.js App Router pages under `src/app/[lang]/` and API routes under `src/app/api/`.
- Client/server components under `src/components/`.
- UI-facing server actions under `src/actions/`; domain logic and persistence in `src/services/` and server-only `src/lib/` code.
- Prisma schema: `src/lib/prisma/schema.prisma`; migrations: `src/lib/prisma/migrations/`.
- Tests: `src/tests/` using Vitest.

The usual request path is UI/API → authenticated action or verified webhook → service ownership/business checks → Prisma/provider. Derive the actor from the session; do not trust a client-supplied owner ID. Provider credentials and webhook secrets stay on the server. Agent tool calls are proposals: validate their arguments and run only explicit application capabilities with tenant checks.

## Data boundaries

`Product.userId` is the merchant owner. `WabaAccount` is linked to its owner; assistant configuration is attached to a locally owned `PhoneNumber`. Contacts, messages, rules, and conversations must be accessed through that number's ownership. Marketplace orders and payments remain separate from WhatsApp assistant capabilities.

Inventory currently stores quantity in `Product.stockQty`. `ProductService.updateStock` applies a signed quantity change and rejects a result below zero. There is no QR scanning or inventory movement/audit model yet. See [QR inventory](qr-inventory.md) before adding that flow.

## Configuration

Use `.env.template` for names. Relevant variables include `DATABASE_URL`, auth/Google credentials, `NEXT_PUBLIC_ENABLE_WHATSAPP_UI`, `WHATSAPP_ACCESS_TOKEN`, WhatsApp webhook verification configuration, `META_APP_SECRET`, `ANTHROPIC_API_KEY`, Paystack variables, `CRON_SECRET`, and `PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED`. AI replies require the Anthropic key; WhatsApp sending currently uses the single global access token.

Never commit `.env` or paste secrets into documentation, logs, or test fixtures.

## Commands

- `npm run dev`: inspect the script first; it may run Prisma migration or generation steps.
- `npm run test:ci`: run the Vitest suite.
- `npx tsc --noEmit --incremental false`: type-check without writing an incremental cache.
- `npm run lint:check`: lint check if configured in the current package scripts.
- `npx prisma migrate status`: inspect migration state for the configured database.
- `npx prisma migrate deploy`: apply committed migrations to the configured database.
- `npm run build`: inspect `postbuild`; build may invoke migration deployment.

Confirm the database target before migrations or build commands that can change it. Local migration state does not imply deployment state.
