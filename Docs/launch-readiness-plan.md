# Launch readiness: core customer paths

This is a proposed work plan based on the current implementation, not a claim that the flows are already production verified. Source code and schema remain authoritative. See [Product and assistant](product-and-assistant.md) and [Development guide](development-guide.md) for current behavior and operational setup.

## Launch status: not yet launch-ready

The app builds and its current automated checks pass, but the core user journey is not fully covered or verified against live providers. Do not treat this status as a production launch approval until all gates below are complete:

- Add tests for account creation/verification, subscription checkout initialization and failure paths, Meta Embedded Signup, template submission/status updates, and the complete webhook-to-send journey.
- Apply and verify all committed migrations in the target deployment database, including `20261020160000_template_delete_history`. The local migration-status check could not connect to PostgreSQL at `localhost:5432`; no migration was applied.
- Verify the Meta Developer app, Embedded Signup permissions, webhook subscriptions, number deregistration, template lifecycle, and real inbound/outbound messages using a staging WABA.
- Verify Paystack subscription checkout and signed webhook activation in staging, including duplicate and amount/reference mismatch cases.
- Set `MODEL_API_KEY` (or the accepted `META_AI_API_KEY` alias), `ANTHROPIC_API_KEY`, `CRON_SECRET`, and the required Meta/Paystack production settings in deployment secret management. Confirm scheduled WhatsApp jobs run and failures are monitored.

## Current coverage and gaps

`src/tests/critical-path.test.ts` covers credential login (including inactive-account denial), a marketplace product page, Paystack subscription activation, invalid Paystack signatures, and payout gating. Focused tests cover consent and template body-parameter checks, quota reservation, webhook signature checking, rule matching, catalogue search, Meta-to-Anthropic fallback, API-key generation/revocation and middleware expiry/account status, month-end subscription dates, Meta phone/template removal ordering, and removal API requests. Coverage is still missing account registration, subscription checkout initialization, Meta Embedded Signup, template submission/status webhooks, and the complete webhook-to-send journey.

The documented and code-level gaps to resolve before calling the core path launch-ready are:

- **Signup:** cover all implemented account creation methods: credentials with email, WhatsApp, or SMS verification and Google OAuth. Test verification/activation and duplicate identity behavior for each applicable path. OTP sign-in remains partial and is not an account creation method.
- **Subscription:** test checkout initialization and failure/unknown outcomes as well as the signed, verified Paystack success webhook. The UI must not grant access from the browser redirect alone.
- **Meta onboarding:** test Embedded Signup code exchange, WABA/phone ownership checks, subscription requirement, plan limits, encrypted credential persistence, and rejection of mismatched or foreign assets. Exercise real Meta configuration separately in a staging smoke test.
- **Number removal:** owner-facing remove action now deregisters through Meta Cloud API before deleting the local record. Database deletion cascades messages, assistant config/rules, campaigns, and run traces for that number. The destructive confirmation describes this; test timeout/unknown provider outcomes, tenant ownership, and cascade behavior.
- **Template lifecycle:** owner-facing removal now calls Meta with the WABA ID, template ID, and name, then cancels scheduled campaigns and deletes the local template in a database transaction. Test submission, plan cap, customization entitlement, pending/approved/rejected status webhooks, and send eligibility. If Meta succeeds but the local transaction fails, reconciliation is still needed.
- **API token:** the “generate token” journey step is the user's Loci API token in `/en/settings?tab=security`. `generateUserApiKey` creates a one-day token. Action and middleware tests cover owner-scoped generation/revocation, valid keys, expiry, and inactive accounts; add Settings UI and malformed-token coverage. Revocation now scopes by key ID, API-key type, and owner (except admins).
- **Template send:** cover approved template, same-WABA template/number, consent/opt-out, exact variable count, quota boundary, provider accepted ID, provider failure, persistence/idempotency, and delivery status callback. Exercise the manual immediate send path as well as scheduled campaigns. API-key WhatsApp send routes now reserve quota in the billing-period counter too.
- **Inbound assistant path:** cover webhook signature, duplicate event, number resolution, contact/message persistence, STOP/START, human handoff, rule precedence, active assistant invocation, quota reservation, outbound send, retry behavior, and provider failures.
- **Operations:** staging must verify Meta app permissions, Embedded Signup, WABA webhook subscriptions (`messages`, `message_template_status_update`), phone registration, approved templates, token validity, and actual send/receive. Alert on exhausted webhook retries, campaign failures, and provider/AI errors.

## Test plan

1. **Map boundaries and fixtures.** Keep fast Vitest unit/service tests with injected provider adapters and Prisma mocks. Use isolated disposable PostgreSQL integration tests only for transaction, uniqueness, cascade, and quota concurrency behavior. Never call Paystack, Meta, or AI production endpoints from CI.
2. **Authentication and billing.** Add signup and login success/failure cases; test subscription checkout request data and pending state; test webhook signature, provider verification, amount/currency/reference match, idempotent replay, and activation. Verify access remains denied for incomplete, expired, or canceled subscriptions.
3. **Meta account and number lifecycle.** Test signup exchange and validation branches, token encryption/decryption, subscription gating, plan count, tenant isolation, phone registration state, and local removal semantics. Add staging-only smoke checks against a test business account.
4. **Templates and API token.** Test template creation constraints and status transitions; local delete behavior; template-to-number WABA ownership; token generation, expiry, valid/invalid authentication, and revoke authorization.
5. **Message journey.** Drive a recorded inbound webhook through persistence, opt-out/handoff/rules/assistant, quota reservation, and mocked Meta send. Separately exercise approved-template immediate and scheduled sends, failure handling, idempotency, and status callbacks.
6. **Launch gates.** CI runs `npm run test:ci`, type-check, and lint. Staging runbook records each Meta/Paystack smoke check, with sanitized evidence and no credentials. Resolve the failure modes above before production rollout.

## AI provider plan: Meta first, Anthropic fallback

The agent runtime now uses Meta Model API through its Anthropic-compatible Messages endpoint as primary and Anthropic as retryable-failure fallback. Meta Model API documents base URL `https://api.meta.ai/v1`, bearer authentication via `MODEL_API_KEY`, and Muse Wonder model ID `muse-wonder-1.0` ([API overview](https://dev.meta.ai/docs/overview), [API reference](https://dev.meta.ai/docs/api-reference)). Muse Wonder is the default; Muse Spark 1.3 (`muse-spark-1.3`) is a later cost/latency alternative. Keep catalogue search and its owner scope in the shared runtime so fallback cannot change capability authorization.

1. Configure `MODEL_API_KEY` server-side and verify the production key has access to `muse-wonder-1.0` and tool calling.
2. Add adapter contract coverage for text-only and catalogue tool cycles, malformed responses, timeouts, rate limits, refusals, fallback, both providers unavailable, and audit metadata. Current coverage exercises a retryable Meta rate-limit fallback only.
3. Evaluate representative Swahili and English customer messages, and monitor cost/latency before enabling the provider for all customers. The code default does not prove production account access or output quality.

## Decisions needed

- **Resolved:** Meta Model API on dev.meta.ai, Muse Wonder (`muse-wonder-1.0`) default, Anthropic fallback; Muse Spark 1.3 (`muse-spark-1.3`) is a potential later optimization.
- **Resolved:** number removal deregisters through Meta Cloud API and deletes the local Loci/server record only after Meta confirms success. Template create/delete also persist locally only after Meta confirms success.
- **Resolved:** “generate token” means the user's one-day Loci API token under `/en/settings?tab=security`; it is separate from the server-managed Meta WhatsApp access token.
- **Resolved:** launch signup tests cover email/password account creation with email, WhatsApp, or SMS verification and Google OAuth. OTP sign-in is partial and is not included in the launch critical path.
