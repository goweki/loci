# LOCi mobile API

The route segment is **`/api/mobile/v1`**. It uses bearer authentication and stable resource names. This documents the server implementation as currently checked in; see the [Expo mobile integration guide](expo-mobile-integration.md) for app architecture and UX recommendations.

No Postman collection is currently checked into this repository. For manual requests, set the base URL to the deployed Loci origin, call login, then use the returned token as a bearer credential for protected routes.

## Authentication

- `POST /api/mobile/v1/auth/login` — `{ "username": "...", "password": "..." }`; returns a 30-day bearer token.
- `POST /api/mobile/v1/auth/refresh` — bearer token; issues an additional 30-day API token. It does not revoke the presented token, so replace it in secure storage and do not treat refresh as rotation.
- `POST /api/mobile/v1/auth/logout` — bearer token; deactivates all API keys for that account, including keys created for other clients. Coordinate this behavior before presenting logout as device-only.
- `POST /api/mobile/v1/auth/password-reset` — unauthenticated `{ "username": "...", "channel": "EMAIL|WHATSAPP|SMS" }`.
- `POST /api/mobile/v1/auth/password-reset?action=complete` — `{ "username": "...", "token": "...", "password": "..." }`.

Use `Authorization: Bearer <accessToken>` on protected requests. Login requires an active account with a local password; Google-only users need to set a password through the web account flow first. Password reset requests return a generic response to avoid account enumeration. Reset tokens expire after one hour and can be used once; completion passwords must be 8–16 characters. The reset route currently throttles to 10 requests per IP per 15 minutes using process-local memory, so limits are not shared across instances or restarts. Paginated endpoints accept `page` and `limit` (maximum 100, default 25) and return `{ items, pagination: { page, limit, total, pages } }` under `data`.

## App data and actions

Protected GET endpoints are `/me`, `/dashboard`, `/phone-numbers`, `/contacts`, `/conversations`, `/conversations/:contactId/messages`, `/messages`, `/products`, and `/orders`. Contacts, conversations, products, orders, and message history are paginated; contacts and products accept `q` search; `GET /messages` accepts `contactId`. Most responses use `{ success: true, data: ... }`, with paged results nested under `data`. Error responses may instead be `{ error: ... }`.

`POST /messages` accepts the server's `MessageSchema`: text, image, document, location, audio, contact, video, sticker, interactive, reaction, or template messages, with required per-type fields. It sends through the WhatsApp integration, checks owner/phone-number authorization, reserves subscription message quota, then persists the sent message. Treat send timeouts as uncertain outcomes; this endpoint does not expose a client idempotency key. The server returns `{ success: true, data: { messageId, contactId } }` on success.

All resource queries are scoped to the authenticated user. Products and orders are read-only through this mobile API. It currently has no mobile endpoints for editing contacts, products, orders, assistant settings, templates, phone-number onboarding, campaigns, QR inventory adjustments, or subscription management. Do not imply those actions are available merely because the web dashboard supports related functionality.
