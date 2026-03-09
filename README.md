# Loci — Omni-channel Messaging & CRM

Lightweight omni-channel communication platform focused on sending and receiving messages.

## Key features

- Unified inbox & conversation view for messages across channels (WhatsApp, SMS, email).
- Phone number and webhook management, API keys and integrations.
- Message templates, auto-replies, and simple automation rules.
- Subscription / billing scaffolding and embedded signup flows.

## Quick start

1. Install dependencies: `pnpm install` or `npm install`
2. Copy `.env.example` → `.env` and set credentials (DB, messaging providers, mail).
3. Run DB migrations: `npx prisma migrate dev` (uses `prisma/schema.prisma`)
4. Start dev server: `pnpm dev` or `npm run dev`

## Project layout (high level)

- `src/app/` — Next.js app routes, layouts and pages.
- `src/components/` — UI components and dashboard pieces.
- `src/lib/` — auth, prisma client, mail, payments and utilities.
- `src/api/` — server endpoints for auth, messages, phone-numbers, webhooks.
- `prisma/` — schema and migrations.

## Contributing

Keep changes small and focused. Open issues for features or bugs and submit PRs against `main`.

## License

See LICENSE or contact the project owner.
