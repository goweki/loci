# Loci product and development docs

Loci's primary product is a business AI assistant connected to WhatsApp Business Platform. It helps businesses supercharge customer engagement through conversations, support, and consent-based template notifications. Commerce tools support engagement where useful; marketplace payments remain optional and may not be pursued.

- [Product and assistant](product-and-assistant.md): product boundary and current WhatsApp/assistant behavior.
- [Development guide](development-guide.md): repository structure, data ownership, account password setup and recovery, setup and validation commands.
- [QR inventory](qr-inventory.md): product QR labels and stock adjustment workflow.
- [Optional payments](optional-payments.md): existing marketplace payment implementation and its constraints.
- [Launch readiness plan](launch-readiness-plan.md): critical journey coverage, gaps, AI provider plan, and pre-launch gates.

These documents describe current code unless a section is explicitly marked as planned. Source code and schema are authoritative when they differ. Use `.env.template` for configuration names; never copy real secret values into docs.

## Deployment notes

- Configure `WHATSAPP_TOKEN_ENCRYPTION_KEY` before connecting WABAs. Schedule both WhatsApp cron routes with `CRON_SECRET` for notification delivery and failed webhook recovery.
- Apply all committed migrations through the normal release process. The committed migration history is authoritative; the Prisma schema currently includes WABA credentials, templates, consent-based campaigns, audited inventory adjustments, webhook retries, outbound idempotency, agent-run traces, message quotas, and the nullable campaign-template reference used when templates are deleted.
- Marketplace transfers remain gated by `PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED`; keep them disabled until payout readiness is reviewed.

The migrations and application code do not configure Meta's Developer Dashboard. Production Embedded Signup, permissions, webhook subscriptions, and message delivery still require verification against the actual Meta app and WABA; see [Product and assistant](product-and-assistant.md).
