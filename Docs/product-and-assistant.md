# Product and WhatsApp assistant

## Product focus

Loci helps businesses **supercharge engagements**, especially with customers. Its core direction is connecting a business's WhatsApp Business assets, configuring an AI assistant, and managing customer conversations. The product should be useful without requiring a merchant storefront, checkout, or payment workflow. Customer notifications are a product goal, but a complete business-initiated notification workflow is not implemented yet.

The existing products/catalogue can enrich an assistant's answers. Future inventory tools can help owners keep that catalogue accurate. Marketplace payments are a separate, optional direction (see [Optional payments](optional-payments.md)).

## Current WhatsApp setup

The WhatsApp tab is gated by `NEXT_PUBLIC_ENABLE_WHATSAPP_UI=true` and by account subscription/WABA state. Meta signup and asset synchronization provide a WABA and phone numbers. The UI includes connected asset/template state and assistant configuration for a selected owned number.

`ChatbotConfig` stores the system prompt, manually entered profile/company/CV context, activation and handoff settings, model parameters, and enabled tools. The **Generate prompt draft from profile** button builds an editable draft that includes owner-pasted profile information. Owners can test the current unsaved draft and optional catalogue capability against the configured Anthropic runtime without sending a WhatsApp message. There is no CV upload or document parsing. The runtime uses `ANTHROPIC_API_KEY` and a fixed model. Without the key, AI-generated replies and preview are unavailable.

If enabled, the assistant has a read-only catalogue search capability over the owner's active products. It returns a bounded minimal product projection. It cannot create orders, accept payment, alter stock, issue refunds, or initiate payouts. The assistant is an initial bounded tool-using implementation, not a generalized provider-independent agent platform.

## Rules and message handling

`AutoReplyRule` supports keyword, message-type, and default rules, each tied to a phone number. Active specific matches take precedence over the default; a match sends its literal response. If there is no match, an active assistant can answer. If neither path applies, the message remains for a human. Time-based rules are not exposed.

Meta webhook POST requests are signature-checked. The inbound processor resolves the Meta number to a locally owned phone number, persists contacts/messages, handles status callbacks, checks handoff and rules, and then may invoke the assistant. Duplicate event/message checks exist. Processing is synchronous and has no durable retry/outbox worker.

The inbox shows conversation history and supports manual text replies within the WhatsApp customer-service window. Human handoff pauses assistant responses until resumed. The inbox refreshes from the server every 15 seconds while visible. A connected WABA token is stored encrypted with AES-256-GCM and used for inbox replies and scheduled campaigns; the legacy global token remains a fallback for other integration helpers. Media/attachments are not interpreted by the assistant.

Owners can schedule approved WhatsApp templates to selected contacts with recorded opt-in consent. The UI records the consent source, handles customer `STOP`/`START` messages, validates WABA/template/recipient ownership, supports body-text variables, stores recipient outcomes, and updates delivery failures from Meta status callbacks. `/api/cron/whatsapp-campaigns` must be scheduled externally to send due campaigns. Dynamic header/button variables and unsupported media template headers are rejected. Consent must be genuine and externally obtained; the app's record is not itself proof of consent.

Assistant runs and catalogue-tool calls now create privacy-conscious audit rows (`AgentRun`, `AgentToolCall`): they record provider/model, outcome, duration, capability version, and bounded metadata such as query length/result count, not the prompt, customer message, or raw tool result. WhatsApp sends reserve against the active plan's per-billing-period message cap in an atomic database counter. The owner-facing UI for reviewing traces, model-spend budgets, and evaluations is not yet implemented.

## Remaining implementation and operational gaps

- **Meta credentials:** connected WABA tokens are encrypted and used for conversational replies/campaigns, but expiry tracking, refresh/rotation, and revocation UI are not complete. Other legacy integration helpers may still require the global token.
- **Number onboarding limits:** Meta signup syncs numbers and enforces plan count/ownership. Supporting multiple distinct WABAs per user is not implemented because the current schema is one WABA per user.
- **Campaign operations:** delivery is scheduled through an external cron caller. There is no in-app scheduler provisioning, audience segmentation, per-campaign retry control, or full delivery analytics. Uncertain send outcomes are marked failed for reconciliation rather than blindly retried.
- **Webhook recovery:** failed webhook events are stored and retried by `/api/cron/whatsapp-webhooks`, with a bounded attempt count and idempotent inbound/outbound guards. Failed events still need operator monitoring; some provider/model failures after inbound persistence may leave the inbound visible without an automated reply.
- **Agent runtime:** catalogue search is the only model tool. The bounded runtime, privacy-conscious run/tool audit records, and per-plan outbound message cap are implemented, but provider choice remains Anthropic-specific; model-spend budgets and evaluations are not complete. No order/payment/inventory mutation tools exist.
- **Assistant knowledge:** file/CV upload and parsing are absent; owners paste reviewed text. Media understanding and voice transcription are absent.
- **Meta verification:** production app permissions, embedded signup behavior, token validity, webhook subscriptions, templates, rate limits, and live delivery must be verified with the actual Meta app and WABA.
- **QR inventory:** product labels and confirmed add/remove stock scanning are implemented. Camera support depends on browser/HTTPS; imported external label formats and warehouse-level stock locations are not supported.

## Current data and code

- Meta assets: `WabaAccount`, `PhoneNumber`, `WabaTemplate`
- Assistant/rules: `ChatbotConfig`, `AutoReplyRule`, `ChatbotConversation`
- Customer engagement: `Contact`, `Message`
- Optional catalogue context: `Product`
- Main UI: `src/components/settings/settings-client/tab-whatsapp/`, `tab-autoReply.tsx`, `src/components/dashboard/conversations/`
- Runtime and handling: `src/services/agent/agent-runtime.service.ts`, `src/lib/whatsapp/actions/index.ts`, `src/app/api/webhooks/whatsapp/route.ts`
- Actions: `src/actions/chatbot.actions.ts`, `src/actions/autoReplyRule.actions.ts`

Assistant context/tool fields were added to `ChatbotConfig` by migration `20261007090000_chatbot_enabled_tools`. Apply migrations through the normal release process before deploying code that uses them.

## Known follow-up

Token lifecycle, broader agent observability/provider support, document ingestion, operational monitoring, and live-provider verification remain future work. Keep capabilities narrow, owner-scoped, and explicitly authorized as new agentic flows are added.
