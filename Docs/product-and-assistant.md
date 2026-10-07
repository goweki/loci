# Product and WhatsApp assistant

## Product focus

Loci helps businesses **supercharge engagements**, especially with customers. Its core direction is connecting a business's WhatsApp Business assets, configuring an AI assistant, and managing customer conversations. The product should be useful without requiring a merchant storefront, checkout, or payment workflow. Customer notifications are a product goal, but a complete business-initiated notification workflow is not implemented yet.

The existing products/catalogue can enrich an assistant's answers. Future inventory tools can help owners keep that catalogue accurate. Marketplace payments are a separate, optional direction (see [Optional payments](optional-payments.md)).

## Current WhatsApp setup

The WhatsApp tab is gated by `NEXT_PUBLIC_ENABLE_WHATSAPP_UI=true` and by account subscription/WABA state. Meta signup and asset synchronization provide a WABA and phone numbers. The UI includes connected asset/template state and assistant configuration for a selected owned number.

`ChatbotConfig` stores the system prompt, manually entered profile/company/CV context, activation and handoff settings, model parameters, and enabled tools. Profile text is pasted manually. The **Generate prompt draft** button creates a fixed generic prompt in the browser; it does not use the entered profile to generate tailored instructions. There is no CV upload or document parsing. The current runtime calls Anthropic using `ANTHROPIC_API_KEY` and a fixed model. Without the key, AI-generated replies are unavailable.

If enabled, the assistant has a read-only catalogue search capability over the owner's active products. It returns a bounded minimal product projection. It cannot create orders, accept payment, alter stock, issue refunds, or initiate payouts. The assistant is an initial bounded tool-using implementation, not a generalized provider-independent agent platform.

## Rules and message handling

`AutoReplyRule` supports keyword, message-type, and default rules, each tied to a phone number. Active specific matches take precedence over the default; a match sends its literal response. If there is no match, an active assistant can answer. If neither path applies, the message remains for a human. Time-based rules are not exposed.

Meta webhook POST requests are signature-checked. The inbound processor resolves the Meta number to a locally owned phone number, persists contacts/messages, handles status callbacks, checks handoff and rules, and then may invoke the assistant. Duplicate event/message checks exist. Processing is synchronous and has no durable retry/outbox worker.

The inbox shows conversation history and supports manual text replies within the WhatsApp customer-service window. Human handoff pauses assistant responses until resumed. Inbox updates are not real-time. The WhatsApp client currently relies on one global `WHATSAPP_ACCESS_TOKEN`; per-WABA credential storage and lifecycle are not implemented. Media/attachments are not interpreted by the assistant. Although template management and a template-send API helper exist, a complete owner-facing, policy-aware customer-notification workflow (audience, consent, template selection/variables, scheduling, delivery tracking) is not implemented.

## Core features that are incomplete

- **Meta asset onboarding:** connecting and syncing a WABA/number is present, but the visible **Add Number** control is not wired to an action. Per-business token storage, refresh, rotation, and revocation are also absent; sending uses one global token.
- **Assistant setup:** owners can edit and save a prompt/profile and activate the assistant. The draft generator is generic rather than profile-aware, and there is no test chat/preview that exercises the saved runtime before activation.
- **Customer notifications:** there is no complete campaign/notification flow for sending approved templates to customers outside the active service conversation, including consent/audience controls, scheduling, and results. The webhook's `notifyUserOfNewMessage` function is only a console placeholder, so operators do not receive a push/email/realtime alert for incoming messages.
- **Operational inbox:** messages are persisted and displayed, but updates are not real-time, processing has no durable retry/outbox, and there is no media understanding.
- **Agentic foundation:** catalogue search is the only tool. Provider adapters, tool/run history, evaluation, and usage controls are future work. No order/payment/inventory mutation tools exist.
- **Inventory QR:** QR scanning to identify products and add/remove stock is planned in [QR inventory](qr-inventory.md), not implemented.

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

Per-account Meta credential lifecycle, customer notification workflows, asynchronous/retryable message processing, profile-aware prompt authoring and preview, document ingestion with review, runtime/tool traces and usage controls, inbox refresh, and production/live-provider verification remain future work. Keep capabilities narrow, owner-scoped, and explicitly authorized as new agentic flows are added.
