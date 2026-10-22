# Expo mobile integration guide

This guide is for coding agents and developers integrating an **existing React Native Expo app** with the Loci web application. Treat the mobile app as its own product surface: preserve useful native-app structure, but change screens, navigation, and supporting client tools where that makes Loci's workflows clearer. The goal is an intuitive, focused business companion, not a pixel-for-pixel copy of the web dashboard.

The Loci API contract is documented in [mobile-api.md](mobile-api.md). The web application's source and Prisma schema remain authoritative when docs differ. The repository containing this guide is the Next.js backend/web app: it currently has no Expo project, `eas.json`, or GitHub Actions deployment workflow. Add and validate mobile deployment files in the existing React Native app repository; do not claim they exist here.

## Product and UX direction

Loci's core job is helping a business manage WhatsApp customer engagement. Lead with the user's next useful action and keep the main flows easy to reach. Use the best parts of highly rated utility apps such as Shazam as interaction inspiration: a clear primary action, immediate feedback, a small number of obvious destinations, and useful recent activity. Do not copy Shazam branding or visual assets.

Start with these navigation areas, adapting to the mobile app's established patterns:

- **Home:** compact account/WhatsApp connection status, subscription status, key counts, recent activity, and direct shortcuts into conversations and contacts. Avoid turning this into a dense desktop-style analytics dashboard.
- **Inbox:** conversation list with search, latest message and timestamp; conversation detail with readable message history and a clear reply composer. Make loading, empty, offline, send-in-progress, sent, and failed states explicit.
- **Contacts:** searchable, paginated customer list and contact details as supported by the app's existing data model.
- **Products:** searchable catalogue and availability view. Clearly indicate that products are read-only through the current mobile API.
- **More / Account:** profile, phone-number and WhatsApp connection status, subscription summary, help, password recovery, and sign out. Avoid presenting unsupported settings as actionable controls.

Keep the most frequent task (checking/replying to a customer) within one or two taps from launch. Use native gestures and platform conventions, large readable touch targets, accessible labels, keyboard-safe forms, and concise confirmation/error messages. Prefer progressive disclosure for less frequent account details. Design useful empty states that explain the next setup step, especially when no WhatsApp number or conversations exist.

## Capability map and honest boundaries

The current authenticated mobile API supports:

| User need | Current API | Notes |
| --- | --- | --- |
| Sign in and account | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me` | Credential login only; login requires an active account with a local password. |
| Home summary | `GET /dashboard` | Counts, recent messages, and subscription summary. |
| WhatsApp assets | `GET /phone-numbers` | Read-only connected-number status; no onboarding or edits. |
| Inbox | `GET /conversations`, `GET /conversations/:contactId/messages`, `GET /messages`, `POST /messages` | Text and supported WhatsApp message types can be sent through `POST /messages`. |
| Contacts | `GET /contacts` | Search and pagination. |
| Catalogue | `GET /products` | Search and pagination; read-only. |
| Orders | `GET /orders` | Read-only; optional commerce area, not the core engagement experience. |
| Password recovery | `POST /auth/password-reset` | Request with username and optional channel; complete with `?action=complete`. |

The mobile API does not currently expose assistant configuration, template management, campaign creation/analytics, WhatsApp onboarding, contact editing, product editing, order mutation, subscription checkout, QR inventory adjustment, or push-notification registration. If one of these is a required mobile journey, first propose and implement a secure, owner-scoped server endpoint and update the API documentation. Do not call web server actions directly from the native app, expose provider credentials, or simulate success locally.

Keep marketplace payments optional. Do not make inbox, assistant, WhatsApp connection status, or catalogue use depend on marketplace checkout or payout features.

## Client integration practices

1. **Inspect before changing.** Find the existing Expo SDK, routing/navigation, state/data-fetching, styling, secure storage, and EAS setup. Preserve compatible conventions and dependencies. Make a small integration plan before replacing navigation or app structure.
2. **Centralize API access.** Add one typed API client using an environment-configured HTTPS base URL. It should attach the bearer token, decode the `{ success, data }` envelope, surface `{ error }` messages safely, and handle network/HTTP errors consistently. Keep endpoint-specific types close to the client and avoid `any` response models.
3. **Use the right storage.** Store access tokens in `expo-secure-store` (or an already adopted equivalent backed by platform secure storage), never plain AsyncStorage, logs, analytics, or crash reports. Keep non-sensitive preferences in ordinary app storage. Clear local credentials on logout and account invalidation.
4. **Model auth state centrally.** Restore a stored token at launch, load `/me`, and route to sign-in or the authenticated app based on the result. Handle 401/403 by clearing invalid credentials and returning to sign-in with a helpful message. Never put credentials in route parameters.
5. **Fetch incrementally.** Use pagination for contacts, conversations, message history, products, and orders. Debounce search, cancel stale requests, support pull-to-refresh, and avoid loading whole histories. Preserve the server's response order: conversation/message lists are newest first; reverse or anchor only in the presentation layer so the composer remains at the bottom.
6. **Handle WhatsApp send uncertainty.** Disable duplicate taps while a send is pending and show a pending state. `POST /messages` has no client idempotency key; if a request times out after reaching the server, its outcome may be uncertain. Refresh the conversation before offering a retry, and label a retry as a new send when the original cannot be confirmed.
7. **Respect platform permissions.** Ask for camera, contacts, or notification permissions only when an implemented feature needs them. The current mobile API has no QR adjustment or push registration route, so permissions alone do not create those capabilities.
8. **Support localization and connectivity.** The web app includes English and Swahili. Reuse the mobile app's localization approach and keep strings ready for both. Provide clear offline, retry, and stale-data states without presenting cached data as current.

## Authentication details and server constraints

- Login request: `POST /api/mobile/v1/auth/login` with `{ "username": "...", "password": "..." }`. A successful response includes `data.accessToken`, `data.tokenType`, `data.expiresAt`, and a user summary. The token lifetime is 30 days.
- Send protected requests with `Authorization: Bearer <accessToken>`.
- Refresh issues a **new additional token**; it does not revoke or rotate the old token. Save the returned token promptly. Repeated refresh calls can leave multiple valid keys until expiry or account-wide logout.
- Logout deactivates **all API keys for that user**, including keys from other devices/integrations. Explain this consequence in the UI or change the backend contract to device-scoped revocation before promising device-only logout.
- Password-reset request: `POST /api/mobile/v1/auth/password-reset` with `{ "username": "...", "channel": "EMAIL" }`; `channel` may be `EMAIL`, `WHATSAPP`, or `SMS`. Completion uses the same path with `?action=complete` and `{ "username": "...", "token": "...", "password": "..." }`. The password length is 8–16 characters. Keep the request confirmation generic.
- Reset requests are throttled to 10 per IP per 15 minutes in process-local memory. This is not a shared multi-instance limit.
- Pagination uses `page` and `limit` (default 25, max 100). Paged results include `{ items, pagination: { page, limit, total, pages } }` inside `data`.
- Do not infer account ownership from identifiers sent by the client. Server endpoints must continue to derive the owner from bearer authentication and scope reads/writes to that owner.

## Deployment and CI expectations for the Expo app

The mobile app repository should contain valid, app-specific Expo/EAS configuration and working workflow files. Before calling deployment ready, inspect the real repository, configure its EAS project ID and signing/submission credentials using EAS secrets or the CI secret store, and run the workflows against a preview build. Never place credentials in committed workflow YAML or Expo public environment variables.

Expected deliverables (adapt names and triggers to the repo's current conventions):

- `eas.json` with development, preview/internal distribution, and production build profiles; production uses the intended app identifiers and release channel. Keep build numbers/versioning consistent with the store release process.
- A pull-request or main-branch **validation workflow** that installs with the lockfile (`npm ci`), runs the app's lint/type-check/unit checks when configured, and runs `eas build --profile preview` for the intended platforms when credentials and build policy allow.
- A **production workflow** triggered by a release tag or explicit protected release event, with concurrency control and environment approval where appropriate. It should run the same checks, build only the approved platforms, and submit to the intended stores only when submission credentials and release policy are configured. Make build-only versus submit behavior explicit.
- Workflow permissions should be least-privilege. Pin third-party GitHub Actions to reviewed versions/SHAs where the repository's policy requires it. Fail clearly when required secrets or EAS project configuration are absent; do not silently skip release steps.
- Document the commands to run locally (`npx expo-doctor`, type-check/lint, and relevant app tests), required repository secrets, release trigger, and how to find the EAS build result.

The web app's backend deployment remains separate. Backend releases must apply committed Prisma migrations through the normal release process, configure server secrets, and schedule the WhatsApp campaign and webhook recovery cron routes as described in [development-guide.md](development-guide.md). A successful Expo build does not deploy or configure the Loci backend, Meta app, WABA, or WhatsApp webhooks.

## Definition of a complete integration

- A signed-out user can log in, restore a valid session securely, recover a password, and sign out with the API's account-wide revocation behavior understood.
- Home, inbox, conversation detail/reply, contacts, product catalogue, and account states are coherent on common phone sizes and accessible with screen readers and dynamic text.
- Search, pagination, refresh, empty/loading/error/offline states are implemented for the data flows the app exposes.
- Message sending reports success/failure honestly and handles uncertain network outcomes without pretending the server supports idempotent retries.
- Unsupported backend capabilities are visibly unavailable or explicitly scheduled as backend work; no UI implies that local-only changes were saved.
- The existing Expo app has checked-in EAS configuration and CI/release workflows that have been run successfully in the target repository, with secrets held outside source control.
- The guide and [mobile-api.md](mobile-api.md) are updated whenever the mobile API contract changes.
