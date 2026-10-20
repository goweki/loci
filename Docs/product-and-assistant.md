# Product and WhatsApp assistant

## Product focus

Loci helps businesses **supercharge engagements**, especially with customers. Its core direction is connecting a business's WhatsApp Business assets, configuring an AI assistant, and managing customer conversations. The product should be useful without requiring a merchant storefront, checkout, or payment workflow. A consent-based WhatsApp template campaign workflow is implemented; richer scheduling and campaign operations remain incomplete.

The existing products/catalogue can enrich an assistant's answers. Product QR labels and confirmed stock adjustments help owners keep catalogue availability current. Marketplace payments are a separate, optional direction (see [Optional payments](optional-payments.md)).

## Current WhatsApp setup and templates

The WhatsApp tab is gated by `NEXT_PUBLIC_ENABLE_WHATSAPP_UI=true` and account subscription/WABA state. An active subscription is required to connect a business through Meta Embedded Signup. The server exchanges the signup code, verifies the exact WABA and selected phone number, checks tenant ownership and phone-number plan limits, subscribes the app to that WABA, and stores the WABA credential encrypted. Credentials are not passed to client components. Meta phone verification and Cloud API registration are separate states; when the phone is not `CONNECTED`, settings offers a registration dialog for the six-digit WhatsApp two-step verification PIN. The current schema supports one WABA per user.

The settings template library combines three built-in templates (OTP verification, order update, and appointment reminder) with active admin-managed library entries. These curated entries are reusable starting points and are not saved as user-authored blueprints. Users with an active subscription can submit available templates to Meta, subject to the plan's `maxTemplates` cap. A plan with the `Custom WhatsApp Templates` feature can customize components before submission; the template still counts toward that cap. Admins manage curated database entries in the manager route. Template submission status is pending until Meta review; `message_template_status_update` webhook events update the locally stored status when that field is subscribed in Meta.

Owners can delete their own WABA templates from settings. Loci requests deletion from Meta first, then cancels scheduled campaigns using the template and removes the local template row. If the Meta request fails, the local template remains. Removing a phone number deregisters it through Meta first, then deletes the local number; related Loci messages, campaigns, rules, assistant configuration, and agent traces are removed by database cascade.

Authentication/OTP templates use Meta-generated body text: their BODY component must not include custom `text` or body examples. The default OTP uses a copy-code button and expiration footer. Utility and marketing templates use their regular text/header/footer components.

The UI includes connected asset/template state and assistant configuration for a selected owned number. Embedded Signup, webhook subscriptions, app permissions and production review still require setup and verification in Meta's Developer Dashboard; successful local code paths do not prove production provider configuration.

`ChatbotConfig` stores the system prompt, manually entered profile/company/CV context, activation and handoff settings, model parameters, and enabled tools. The **Generate prompt draft from profile** button builds an editable draft that includes owner-pasted profile information. Owners can test the current unsaved draft and optional catalogue capability without sending a WhatsApp message. There is no CV upload or document parsing. AI replies use Meta Model API (`MODEL_API_KEY`, also accepted as `META_AI_API_KEY`; default model `muse-wonder-1.0`) and fall back to Anthropic (`ANTHROPIC_API_KEY`) for retryable Meta API failures. Keep both keys server-side. Without either configured provider, AI-generated replies and preview are unavailable.

If enabled, the assistant has a read-only catalogue search capability over the owner's active products. It returns a bounded minimal product projection. It cannot create orders, accept payment, alter stock, issue refunds, or initiate payouts. The assistant is an initial bounded tool-using implementation, not a generalized provider-independent agent platform.

## Rules and message handling

`AutoReplyRule` supports keyword, message-type, and default rules, each tied to a phone number. Opt-out and human handoff checks take precedence. Active specific matches take precedence over the default; matching rules are considered by ascending priority, then creation time, and a match sends its literal response without invoking AI. If no rule matches, an active assistant conversation can answer; otherwise the message remains for a human. `STOP` opts a contact out, sends an opt-out confirmation, and suppresses later automated replies; `START` clears the opt-out and sends a confirmation. Time-based rules are not exposed.

Meta webhook POST requests are signature-checked. The inbound processor resolves the Meta number to a locally owned phone number, persists contacts/messages, handles status callbacks, checks opt-out/handoff and rules, and then may invoke the assistant. Duplicate event/message checks exist. Initial processing is synchronous; failed webhook events are persisted and retried by `/api/cron/whatsapp-webhooks` up to five times. Schedule that route externally and monitor exhausted failures.

The inbox shows conversation history and supports manual text replies within the WhatsApp customer-service window. Human handoff pauses assistant responses until resumed. The inbox refreshes from the server every 15 seconds while visible. A connected WABA token is stored encrypted with AES-256-GCM and used for inbox replies and scheduled campaigns; the legacy global token remains a fallback for other integration helpers. Media/attachments are not interpreted by the assistant.

Owners can schedule approved WhatsApp templates to selected contacts with recorded opt-in consent. The UI records the consent source, handles customer `STOP`/`START` messages, validates WABA/template/recipient ownership, supports body-text variables, stores recipient outcomes, and updates delivery failures from Meta status callbacks. `/api/cron/whatsapp-campaigns` must be scheduled externally to send due campaigns. Dynamic header/button variables and unsupported media template headers are rejected. Consent must be genuine and externally obtained; the app's record is not itself proof of consent.

Assistant runs and catalogue-tool calls now create privacy-conscious audit rows (`AgentRun`, `AgentToolCall`): they record provider/model, outcome, duration, capability version, and bounded metadata such as query length/result count, not the prompt, customer message, or raw tool result. WhatsApp sends reserve against the active plan's per-billing-period message cap in an atomic database counter. The owner-facing UI for reviewing traces, model-spend budgets, and evaluations is not yet implemented.

## Remaining implementation and operational gaps

- **Meta credentials:** connected WABA tokens are encrypted and used for conversational replies/campaigns. Token type, returned expiry metadata, and update time are stored, but automatic refresh/rotation and revocation UI are not complete. Other legacy integration helpers may still require the global token.
- **Number onboarding limits:** Meta signup verifies the selected number belongs to the selected WABA and enforces plan count/ownership before saving that number. It does not import every number on the WABA. Supporting multiple distinct WABAs per user is not implemented because the current schema is one WABA per user.
- **Campaign operations:** delivery is scheduled through an external cron caller. There is no in-app scheduler provisioning, audience segmentation, per-campaign retry control, or full delivery analytics. Uncertain send outcomes are marked failed for reconciliation rather than blindly retried.
- **Webhook recovery:** failed webhook events are stored and retried by `/api/cron/whatsapp-webhooks`, with a bounded attempt count and idempotent inbound/outbound guards. Failed events still need operator monitoring; some provider/model failures after inbound persistence may leave the inbound visible without an automated reply.
- **Agent runtime:** catalogue search is the only model tool. The bounded runtime, privacy-conscious run/tool audit records, and per-plan outbound message cap are implemented. Meta Model API is primary and Anthropic is fallback; model-spend budgets and evaluations are not complete. No order/payment/inventory mutation tools exist.
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

The Prisma schema is authoritative for assistant context/tool fields. Apply every committed migration through the normal release process before deploying code that uses them.

## Known follow-up

Token lifecycle, broader agent observability/provider support, document ingestion, operational monitoring, and live-provider verification remain future work. Keep capabilities narrow, owner-scoped, and explicitly authorized as new agentic flows are added.
