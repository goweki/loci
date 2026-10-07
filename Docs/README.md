# Loci Documentation

Reviewed: 2026-09-27. These pages describe the current repository state and the next work needed to reach a reliable launch. Source code and tests are authoritative when they differ from this summary.

- [Current status](current-status.md): feature-by-feature implementation state and known risks.
- [Architecture](architecture.md): runtime, routes, services, data ownership, and configuration.
- [Roadmap](roadmap.md): prioritized steps and completion criteria.
- [Marketplace payments](marketplace-payments.md): buyer checkout, payment verification, delivery holds, and seller payouts.
- [WhatsApp assistant flow](whatsapp-assistant-flow.md): post-Meta setup, assistant prompts, auto-reply rules, inbound processing, and inbox scope.

## Important

- Paystack marketplace payouts are disabled by default. Keep `PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED=false` until Paystack and compliance approval, payout scheduling, and production checks are complete.
- The local development database has the marketplace migration applied. Production and other deployment databases must be migrated through the normal release process.
- Never commit or share real `.env` values. Rotate any production credentials exposed outside the secret manager.
