# Product and WhatsApp assistant

## Product focus

Loci helps businesses **supercharge engagements**, especially with customers. Its core product is connecting a business's WhatsApp Business assets, configuring an AI assistant, and managing customer conversations and notifications. The product should be useful without requiring a merchant storefront, checkout, or payment workflow.

The existing products/catalogue can enrich an assistant's answers. Future inventory tools can help owners keep that catalogue accurate. Marketplace payments are a separate, optional direction (see [Optional payments](optional-payments.md)).

## Current WhatsApp setup

The WhatsApp tab is gated by `NEXT_PUBLIC_ENABLE_WHATSAPP_UI=true` and by account subscription/WABA state. Meta signup and asset synchronization provide a WABA and phone numbers. The UI includes connected asset/template state and assistant configuration for a selected owned number.

`ChatbotConfig` stores the system prompt, manually entered profile/company/CV context, activation and handoff settings, model parameters, and enabled tools. Profile text is pasted manually; there is no CV upload, document parsing, or prompt-generation preview. The current runtime calls Anthropic using `ANTHROPIC_API_KEY` and a fixed model. Without the key, AI-generated replies are unavailable.

If enabled, the assistant has a read-only catalogue search capability over the owner's active products. It returns a bounded minimal product projection. It cannot create orders, accept payment, alter stock, issue refunds, or initiate payouts. The assistant is an initial bounded tool-using implementation, not a generalized provider-independent agent platform.

## Rules and message handling

`AutoReplyRule` supports keyword, message-type, and default rules, each tied to a phone number. Active specific matches take precedence over the default; a match sends its literal response. If there is no match, an active assistant can answer. If neither path applies, the message remains for a human. Time-based rules are not exposed.

Meta webhook POST requests are signature-checked. The inbound processor resolves the Meta number to a locally owned phone number, persists contacts/messages, handles status callbacks, checks handoff and rules, and then may invoke the assistant. Duplicate event/message checks exist. Processing is synchronous and has no durable retry/outbox worker.

The inbox shows conversation history and supports manual text replies within the WhatsApp customer-service window. Human handoff pauses assistant responses until resumed. Inbox updates are not real-time. The WhatsApp client currently relies on one global `WHATSAPP_ACCESS_TOKEN`; per-WABA credential storage and lifecycle are not implemented. Media/attachments are not interpreted by the assistant.

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

Per-account Meta credential lifecycle, asynchronous/retryable message processing, improved prompt authoring and preview, document ingestion with review, runtime/tool traces and usage controls, inbox refresh, and production/live-provider verification remain future work. Keep capabilities narrow, owner-scoped, and explicitly authorized as new agentic flows are added.
