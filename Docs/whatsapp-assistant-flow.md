# WhatsApp Assistant Flow Strategy

Reviewed: 2026-10-07. This document describes the intended post-Meta-signup flow and the implementation work needed to make Loci an agentic WhatsApp assistant and inbox platform. The user-facing product is for connecting a business's WhatsApp assets, configuring an assistant, accessing business knowledge such as its catalogue, and viewing/responding to messages. The assistant should not require buyer checkout, order management, seller payouts, or marketplace workflows to operate.

## Product boundary

The core flow is:

1. Connect a Meta WhatsApp Business Account (WABA) with Embedded Signup.
2. Sync and select the business's permitted phone numbers.
3. Configure an assistant for a selected number: identity, instructions, business knowledge/profile, handoff behavior, and activation.
4. Optionally define deterministic auto-reply rules that take precedence over the AI assistant.
5. Receive and store inbound messages, select a response path, and send replies through WhatsApp Cloud API.
6. Show contacts and message history in the inbox; allow a person to take over and resume the assistant.

The assistant may use `Product` as an optional, read-only catalogue capability when its owner has products. This must be scoped to the owner and number's tenant and should not require checkout. Keep `Order`, `OrderItem`, `Payment`, `Invoice`, `OrderPayout`, and ledger workflows outside the default assistant capability set. The assistant must still work for a company or individual with no catalogue or commerce setup. The existing product/storefront and commerce workflows remain independent; this strategy adds an assistant integration point and does not propose changing their current user flows.

The intended product is agentic-first: the model can select from a small, explicit set of tools to answer and carry out approved tasks. A system prompt alone is not an agent. Each capability must have typed inputs/outputs, server-side authorization, bounded effects, auditability, and a clear policy about whether it is read-only or requires user/contact confirmation.

## Current code and schema

### WhatsApp integration UI

`src/components/settings/settings-client/tab-whatsapp/index.tsx` displays WABA connection state, synced phone numbers, and template management. It gates access on an active subscription and renders `WabaEmbeddedSignup` when there is no WABA. The assistant setup panel now selects a connected number and saves an editable prompt, reviewed profile/CV text, human handoff keywords, activation state, and catalogue permission. The “Add Number” button is still presentation only.

The schema already maps Meta resources through `WabaAccount`, `PhoneNumber`, and `WabaTemplate`. `PhoneNumber.id` is intentionally used as the Meta phone number ID by the sync service. Keep that stable external identifier and scope all assistant configuration to the locally owned phone number.

The catalogue is represented by `Product`, which is user-owned and contains name, description, SKU, price/currency, stock quantity, image, and active state. `ProductService` has owner-scoped methods for listing and reading products; public storefront queries expose active products. This is a useful foundation for an assistant tool, but the assistant should use a purpose-built minimal projection rather than `ProductService`'s current broad relation include (which also loads order items and user/subscription data). `createOrderAction` and marketplace actions are separate write paths and should not be callable as general-purpose assistant tools.

### Auto-reply UI and actions

`src/components/settings/settings-client/tab-autoReply.tsx` lists rules and displays rule name, trigger, number, priority, and status. Create/edit, activate/pause, and delete actions now use real connected numbers and authenticated server actions. Time-based rules are intentionally not exposed until their schedule semantics are defined.

`AutoReplyRule` already stores a phone number, creator, trigger type/value, reply text, priority, and `isActive`. `TriggerType` supports `KEYWORD`, `MESSAGE_TYPE`, `TIME_BASED`, and `DEFAULT`. This is enough for a first deterministic rules feature without adding a model field. Treat `replyMessage` as the literal response for a rule; AI-specific instructions belong on `ChatbotConfig`, not duplicated in each rule. For a rule that needs AI, use a rule action/type only if it can be represented without overloading `replyMessage`; otherwise defer AI-backed matching to the assistant's default path.

The auto-reply server actions validate their inputs, derive the creator from the session, and verify number ownership. Matching evaluates specific rules in priority order and uses a default only as fallback. The previous nonexistent `active` field references and placeholder matcher have been removed. A default-rule uniqueness check exists in application logic; concurrent creation still needs a database-level strategy if rule edits become high-volume.

### Assistant and message schema

The schema uses existing records for the main flow, with two narrowly scoped additions made during implementation:

- `ChatbotConfig` is one-to-one with `PhoneNumber` and stores `systemPrompt`, model settings, active state, human handoff keywords, response delay, and context limits.
- `ChatbotConversation` is unique per assistant/contact and stores context, message count, active state, and handoff state.
- `Message`, `Contact`, and `PhoneNumber` provide the inbox data model.
- `PromptTemplate` stores reusable prompt content per user, but is not currently connected to a WhatsApp assistant workflow.
- `Product` already provides optional catalogue data, so no new catalogue model is needed for initial read/search access.
- `ChatbotConfig.profileContext` stores reviewed company/personal/CV text separately from instructions.
- `ChatbotConfig.enabledTools` stores the allowlisted capabilities for that assistant.
- `User` currently has basic identity fields only; there is no company profile, CV/profile document, or business knowledge model in this schema.

The server-only agent runtime currently uses Anthropic Messages API and offers owner-scoped catalogue search as its first tool. `ANTHROPIC_API_KEY` is optional at app startup but required for AI replies. Chatbot configuration actions verify the signed-in user's WABA ownership. Keep the provider call behind the runtime boundary and never accept an arbitrary `userId` from model-generated tool arguments. A provider-neutral runtime contract, durable tool traces, and alternate provider adapters remain future work.

## Recommended user experience

### 1. Connect assets

After Embedded Signup succeeds, sync the WABA and phone number assets and show clear per-number readiness: Meta display number/name, verification/connection state, and whether inbound webhook delivery is active. Let the user choose which connected number to configure. Explain that each number has its own assistant and rules. Keep template management available for approved outbound templates; it is separate from inbound conversational automation.

Do not report “connected” based only on a local row. Reconcile with Meta as appropriate and show actionable sync or permission errors. Treat Meta tokens and webhook verification/signature checks as server-side secrets and controls.

### 2. Create the assistant (per number)

Provide a guided setup with these sections:

- **Assistant identity:** assistant name, organization/person name, description, language, tone, and what it should help with.
- **Business or personal profile:** editable structured fields such as organization/person summary, services, location, hours, contact details, policies, and frequently asked questions. Allow pasting text first. A CV or profile document can be added as a later ingestion option; extract text server-side, let the user review/edit the resulting facts, and only then include those facts in assistant context. Do not send an uploaded document directly to a model on every message.
- **Knowledge and catalogue:** let the owner choose whether the assistant can answer from the active catalogue. Explain which fields it can use (name, description, price/currency, availability/stock policy, image link). Query live catalogue data at answer time through a read-only tool rather than copying potentially stale catalogue rows into the system prompt. Clearly distinguish known stock from unverified availability and support “I don't know”/human handoff when the catalogue has no reliable answer. Profile/CV and catalogue are separate sources with separate controls.
- **Instructions:** a system prompt editor with a generated draft, preview, and manual override. Generate from the reviewed profile and the assistant setup answers. Make clear that generated text is editable and is the actual saved instruction set.
- **Boundaries and handoff:** what the assistant may not claim/do, when to hand off, configured human-handoff keywords, and a clear manual pause/resume control.
- **Response behavior:** model, temperature, max output, response delay, and history/reset policy, bounded by safe server defaults and supported provider configuration.
- **Test before activation:** a preview/test panel with sample questions using the exact saved prompt/profile context. Activation remains explicit.

Persist assistant instructions in `ChatbotConfig.systemPrompt`, reviewed profile/CV text in `ChatbotConfig.profileContext`, and allowed capabilities in `ChatbotConfig.enabledTools`. Use `PromptTemplate` for reusable starting templates if useful. Uploaded-file provenance and ingestion still need a narrowly scoped schema addition if file uploads are implemented; do not add marketplace relationships to solve it.

### Agent runtime and capability design

Separate the model/provider adapter from the application capabilities. The runtime should accept a normalized conversation request and expose a registry of enabled capabilities; each provider adapter translates that registry to its supported function/tool format. Keep tool schemas and execution in application code so model/provider changes do not change business authorization rules.

Initial capabilities should be deliberately small:

| Capability                                                                | Initial access        | Policy                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search/read this owner's active catalogue                                 | Read-only             | Enabled per assistant; owner and number scope applied server-side; return only relevant fields and bounded results.                                                                    |
| Read business profile/FAQ                                                 | Read-only             | Only reviewed content selected for this assistant; apply size and freshness limits.                                                                                                    |
| Request human handoff                                                     | State transition      | May pause the bot and notify/show the operator; should be auditable.                                                                                                                   |
| Send WhatsApp reply                                                       | External side effect  | Runtime-controlled after policy checks; validate message length/type and WhatsApp constraints; persist the send attempt and provider result.                                           |
| Create order, take payment, change stock, issue refund, or trigger payout | Not enabled initially | Future capabilities require explicit product decision, strict tenant/record checks, idempotency, confirmation, and a dedicated audited workflow. Never infer permission from a prompt. |

Treat model output and retrieved catalogue/profile content as untrusted. Validate tool arguments against schemas, enforce timeouts/result limits, prevent arbitrary SQL/URL access, and never let retrieved text override system/developer policy. Return source-grounded results to the model (for example, product name and current listed price) so the answer can be checked and uncertainty expressed. Do not expose secrets, internal user details, order/customer data, or another tenant's catalogue.

Keep an internal provider-neutral capability contract and execution record containing conversation/message IDs, capability name, validated input/output summary, policy decision, duration, and outcome. Redact personal data and prompt contents by default. Add trace/correlation IDs across webhook receipt, agent run, tool call, and outbound message. Retain enough information for debugging and replay without recording secrets. Make capabilities versioned and independently testable. If external interoperability is needed later, expose selected capabilities through a protocol adapter such as MCP; do not make the product's core authorization or data access depend on a particular agent protocol.

For future development, define a narrow `AgentRuntime` boundary (model selection, tool-call loop, cancellation/timeout, token budget, structured outcome) and `Capability` contract (name/version, input schema, authorization, policy class, executor, output schema). Do not let tools recursively grant new tools or execute arbitrary code. Bound tool-call count, wall time, model spend, history, and results. Make state-changing actions require an explicit policy and, where appropriate, confirmation before execution. Record prompt/config version and capability versions for each run so behavior can be reviewed and reproduced.

### 3. Configure deterministic rules

Rules are optional and belong to a selected phone number. The first release should support:

- keyword contains/match (with documented case/normalization behavior),
- message type (only when a usable reply is possible),
- a single default/fallback rule,
- priority and active/inactive state.

Defer `TIME_BASED` until business timezone, schedule format, daylight-saving behavior, and evaluation semantics are defined. The current enum value by itself does not define those semantics.

The rule editor should load the user's actual connected numbers, conditionally require a trigger value, validate the response text, and save through an authenticated action. Provide edit, deactivate/reactivate, and delete controls with clear confirmation. Enforce one active default rule per phone number in application logic (and a database constraint only if a safe representation is chosen). Validate that the actor owns the selected phone number through its WABA. Use `isActive` consistently; remove references to the nonexistent `active` field.

### 4. Inbound execution and response precedence

Use one server-only inbound processor after webhook validation and idempotency handling:

1. Resolve `metadata.phone_number_id` to a locally connected `PhoneNumber` and its owning user. Do not silently assign an unknown customer number to the platform admin. Unknown/unowned numbers should be rejected or quarantined and surfaced operationally.
2. Deduplicate webhook events/messages using Meta event/message IDs and persist the inbound message once. Process status callbacks independently from inbound messages.
3. Resolve/create the contact and persist the inbound message before attempting a reply, so the inbox remains the source of truth even when AI/provider sending fails.
4. Skip automation for unsupported message content, duplicate delivery, or an assistant that is inactive. Optionally route unsupported content to a human/fallback response.
5. Evaluate active rules for that exact phone number in explicit priority order. The first match sends its literal `replyMessage`. If there is no match, use the active `ChatbotConfig` as the default assistant. Avoid firing multiple rules for one inbound message. A rule response is an explicit deterministic shortcut; otherwise the assistant runtime can select enabled read capabilities such as catalogue search.
6. If no rule and no active assistant applies, leave the inbound message visible for a person; do not send an implicit AI response.
7. For an assistant response, load bounded recent conversation history, build system + user context from saved config and reviewed knowledge, and invoke the provider-neutral agent runtime. The runtime may call enabled read tools (such as catalogue search), validates each call, enforces budgets/policies, and returns a final response or handoff outcome. Validate/limit the final response, send using the Cloud API, and persist the outbound message and provider/Meta IDs/status.
8. If a handoff keyword is detected or the assistant requests handoff, set `handedOffToHuman`, stop further bot replies for that conversation, and make takeover state visible in the inbox. A user can explicitly resume automation.
9. Record processing failures and retry safely without duplicate replies. Use `WebhookEvent` and `MessageUnprocessed` with idempotency keys and bounded retries; do not block webhook acknowledgement on long model calls if the deployment supports a durable background job. If synchronous processing remains, enforce timeouts and return success only after durable receipt.

`ChatbotConversation.context` should contain only the minimal state needed beyond canonical `Message` history. Bound history by `conversationHistory`, reset according to `resetContextAfter`, and do not include conversations from other contacts or phone numbers. Use per-conversation serialization/locking or another concurrency guard so simultaneous inbound messages do not race context updates or produce duplicate/out-of-order replies.

### 5. Inbox and human operation

The UI should center on a conversation inbox: connected number filter, contact list ordered by recent message, inbound/outbound thread, delivery status, assistant/handoff state, and manual reply composer. Sending a manual reply should persist the outbound message and follow WhatsApp's current messaging-window/template constraints. A human reply should either pause automation for that conversation or have an explicit policy that avoids a bot immediately speaking over the operator.

Use the existing `Message` and `Contact` models. Add useful filtering/pagination and live refresh later, but do not require commerce data to open a conversation. The current `notifyUserOfNewMessage` is only a console placeholder; choose a supported refresh mechanism before promising real-time delivery.

## Delivery plan

### Phase A — Establish safe foundations

- Confirm Prisma schema/generated-client consistency and repair auto-reply field mismatches.
- Consolidate server actions around authenticated service methods.
- Add ownership checks for WABA, phone number, chatbot config, rules, contacts, and conversations.
- Validate Meta webhook signatures (where applicable), deduplicate events/messages, and remove fallback assignment to admin.
- Keep all provider credentials and model calls server-side.
- Define tenant-scoped, read-only catalogue search for assistant use, returning a minimal product projection and bounded results; do not route assistant reads through public product actions or expose order relations.

### Phase B — Configure per-number assistant

- Add an assistant setup page/panel reachable from each connected number.
- Implement create/read/update/activate/deactivate for `ChatbotConfig` with safe defaults and ownership validation.
- Add profile/prompt builder using user-entered company or personal facts and a prompt preview.
- Connect `PromptTemplate` as optional reusable starting material.
- Implement a server-only AI provider adapter with timeout, token/output limits, error handling, and a test/preview operation.
- Implement the provider-neutral agent runtime and versioned capability registry; add catalogue search as the first read-only tool behind per-assistant enablement.
- Define capability policy classes and execution traces before adding state-changing tools.

### Phase C — Complete auto-reply rules

- Replace static dialog with functional CRUD bound to real numbers and `AutoReplyRule` actions.
- Normalize and test rule matching, priority, default behavior, and active state.
- Implement only deterministic trigger types whose semantics are specified; hide or disable unsupported trigger types.
- Keep rule responses deterministic. Rules may bypass AI; an unmatched message falls through to the assistant.

### Phase D — Connect inbound and outbound flow

- Replace placeholder `processAutoReplies`, `shouldTriggerAutoReply`, and `triggerAutoReply` with the single ordered processor described above.
- Persist every accepted inbound and sent outbound message with correct owner, contact, number, direction, timestamp, and status.
- Implement assistant context loading, response generation, handoff, safe retry, and status updates.
- Ensure a human takeover suppresses automation until explicitly resumed.
- Keep rule matching outside model tool selection so deterministic rules remain predictable; allow the assistant path to use tools only after rules do not match.

### Phase E — Inbox and operational readiness

- Provide inbox thread UI with manual send, number/contact filtering, status, and handoff controls.
- Add useful webhook/assistant processing logs without storing secrets or unnecessary sensitive prompt/profile data.
- Add subscription usage checks around configured limits without making paid marketplace features prerequisites.
- Document Meta app/webhook setup, provider configuration, data retention, and production runbook.

## Minimal schema position

The implementation adds only `ChatbotConfig.profileContext` and `ChatbotConfig.enabledTools`: profile text is distinct from instructions, and capability choices persist per assistant. `AutoReplyRule` covers deterministic rules; `PromptTemplate` can provide reusable prompt content; `Product` is sufficient for initial owner-scoped catalogue search; `Message`/`ChatbotConversation` support the inbox and context. The capability executor is code-defined. Add run/tool audit models only when operational requirements need durable history beyond existing webhook/message records.

Consider a narrowly scoped schema change only if implementation demonstrates a real gap, such as structured reusable business profile fields, uploaded-file metadata/retention, per-assistant capability enablement, agent run/tool audit history, or a distinct rule action that cannot be safely represented in existing fields. Keep ownership explicit and cascade behavior intentional. Do not duplicate catalogue rows into assistant-specific tables unless indexing/snapshot requirements justify it. Avoid coupling the assistant to marketplace order/payment/payout schemas.

## Completion criteria

- A user can connect Meta, sync/select an owned number, and see accurate connection state.
- A user can create, preview, save, activate, pause, and update one assistant per selected number.
- A company or individual can generate/edit a prompt from reviewed profile/CV text with/without setting up products or orders.
- When enabled and a catalogue exists, the assistant can retrieve the owner's relevant active products and answer using current listed details; users without a catalogue can still use profile/FAQ knowledge.
- Tool calls are schema-validated, tenant-scoped, bounded, policy-checked, and traceable; model/provider changes do not bypass application authorization.
- A user can create and manage deterministic rules for an owned number; rule order and fallback behavior are predictable.
- A received message is saved once and appears in the inbox even if automated response generation fails.
- Exactly one configured response path runs per inbound message: matching rule, otherwise active assistant, otherwise no automatic reply.
- Outbound messages are sent through Meta and recorded with delivery state; retries do not duplicate responses.
- Human handoff visibly stops bot replies until resumed.
- Cross-user access to another user's number, config, rules, messages, contact, or conversation is rejected.
- The assistant/inbox flow works without creating any marketplace entity.

## Source references

- `src/components/settings/settings-client/tab-whatsapp/index.tsx`
- `src/components/settings/settings-client/tab-autoReply.tsx`
- `src/components/settings/settings-client/forms.tsx`
- `src/actions/autoReplyRule.actions.ts`
- `src/services/autoReply/autoreply.service.ts`
- `src/lib/whatsapp/actions/index.ts`
- `src/app/api/webhooks/whatsapp/route.ts`
- `src/actions/chatbot.actions.ts`
- `src/actions/product.actions.ts`
- `src/services/commerce/product.service.ts`
- `src/actions/order.actions.ts`
- `src/app/[lang]/(mid-pages)/space/[username]/_components/space-utils.tsx`
- `src/lib/prisma/schema.prisma`
- `src/lib/prisma/migrations/20261007090000_chatbot_enabled_tools/migration.sql`

## Protocol and provider references

Keep protocol support behind adapters. MCP is a possible future interoperability layer for exposing selected tools/resources to external agent clients; it is not required for the first-party WhatsApp runtime. Provider-specific function/tool calling should map to the same internal capability contracts and authorization policies. See the [MCP introduction](https://modelcontextprotocol.io/introduction) and [OpenAI function calling guide](https://developers.openai.com/api/docs/guides/function-calling) for examples of these integration surfaces.

## Implementation checkpoint

The current implementation includes per-number assistant setup, editable prompt/profile context, an opt-in catalogue capability, rule CRUD and precedence, owner-scoped product retrieval, signature-checked Meta webhook ingestion, duplicate-message checks, Anthropic tool execution, human handoff state, inbox thread rendering, and manual text replies with a customer-service-window check. The schema migration adds only `profileContext` and `enabledTools` to `ChatbotConfig`.

Before deployment, apply the new migration through the normal release workflow and configure `ANTHROPIC_API_KEY`. The current WhatsApp Cloud API client still uses the single `WHATSAPP_ACCESS_TOKEN` environment value; per-WABA credential lifecycle is not implemented. CV uploads/file parsing, durable outbound retry/outbox processing, provider-neutral runtime adapters, approved-template sends from the inbox, agent evaluations, and live provider verification remain outstanding.
