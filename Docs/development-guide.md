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

Inventory quantity is stored in `Product.stockQty`. Dashboard QR adjustments use owner-scoped atomic updates and create an `InventoryAdjustment` audit record with an idempotency key. Sales and QR adjustments must preserve stock invariants under concurrent updates. See [QR inventory](qr-inventory.md).

Outbound WhatsApp sends reserve a `MessageQuota` for the user's active subscription billing period before calling Meta. This enforces `Plan.maxMessagesPerMonth` across assistant replies, manual replies, and scheduled template campaigns.

## Configuration

Use `.env.template` for names and do not copy values into docs. Relevant variables include `DATABASE_URL`, auth/Google credentials, `NEXT_PUBLIC_ENABLE_WHATSAPP_UI`, `NEXT_PUBLIC_META_APP_ID`, `NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID`, `META_APP_SECRET`, `META_API_VERSION`, `META_BUSINESS_ID`, `WABA_ID`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, and `WHATSAPP_ACCESS_TOKEN`. The global WhatsApp token is still required by current environment validation and serves as a legacy fallback/integration credential; connected-account messaging prefers the per-WABA token encrypted with `WHATSAPP_TOKEN_ENCRYPTION_KEY` (32-byte base64 or 64-character hex). AI replies use Meta Model API (`MODEL_API_KEY`, or the accepted `META_AI_API_KEY` alias; default model `muse-wonder-1.0`) with `ANTHROPIC_API_KEY` as fallback; keep both server-side. Paystack variables, `CRON_SECRET`, and `PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED` are also used by the optional payment and scheduled job paths.

The deployment scheduler must POST to `/api/cron/whatsapp-campaigns` to dispatch due customer notification campaigns and `/api/cron/whatsapp-webhooks` to retry failed webhook events (up to five attempts). Both require `Authorization: Bearer <CRON_SECRET>`. No scheduler is provisioned by the application itself. Meta webhook configuration is external: configure the callback/verify token and subscribe to `messages` and `message_template_status_update` to receive message and template-status events.

Never commit `.env` or paste secrets into documentation, logs, or test fixtures.
If a provider key is exposed, revoke or replace it. Rotating `WHATSAPP_TOKEN_ENCRYPTION_KEY` requires decrypting and re-encrypting stored WABA tokens with a controlled migration; replacing the key alone makes existing credentials unreadable.

## Commands

- `npm run dev`: inspect the script first; it may run Prisma migration or generation steps.
- `npm run test:ci`: run the Vitest suite.
- `npx tsc --noEmit --incremental false`: type-check without writing an incremental cache.
- `npm run lint:check`: lint check if configured in the current package scripts.
- `npx prisma migrate status`: inspect migration state for the configured database.
- `npx prisma migrate deploy`: apply committed migrations to the configured database.
- `npm run build`: build the Next.js app; the current `package.json` does not define a `postbuild` migration hook.

Confirm the database target before migrations or build commands that can change it. Local migration state does not imply deployment state.
