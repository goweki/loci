# LOCi mobile API

The recommended route segment is **`/api/mobile/v1`**. It uses bearer authentication and stable resource names; The mobile-specific prefix keeps these endpoints grouped for the Expo app.

Import [`postman/Loci-Mobile-v1.postman_collection.json`](../postman/Loci-Mobile-v1.postman_collection.json) into Postman. Configure `baseUrl`, `username`, and `password`, then run **Authentication → Login**. The collection saves the returned token automatically.

## Authentication

- `POST /api/mobile/v1/auth/login` — `{ "username": "...", "password": "..." }`; returns a 30-day bearer token.
- `POST /api/mobile/v1/auth/refresh` — bearer token; rotates the current token. Store the returned token immediately.
- `POST /api/mobile/v1/auth/logout` — bearer token; revokes the account's current API token.
- `POST /api/mobile/v1/auth/password-reset` — unauthenticated `{ "username": "...", "channel": "EMAIL|WHATSAPP|SMS" }`.
- `POST /api/mobile/v1/auth/password-reset?action=complete` — `{ "username": "...", "token": "...", "password": "..." }`.

Use `Authorization: Bearer <accessToken>` on protected requests. Password reset requests return a generic response to avoid account enumeration. Reset tokens expire after one hour and can be used once; completion passwords must be 8–16 characters. The reset route currently throttles to 10 requests per IP per 15 minutes using process-local memory, so limits are not shared across instances or restarts. Pagination endpoints accept `page` and `limit` (maximum 100) and return `items` plus pagination metadata.

## App data and actions

`GET /me`, `/dashboard`, `/phone-numbers`, `/contacts`, `/conversations`, `/conversations/:contactId/messages`, `/messages`, `/products`, and `/orders` provide the profile, account summary, inbox, and commerce data. `POST /messages` accepts the existing WhatsApp message payload used by the web API, including text and supported media/template types.

All resource queries are scoped to the authenticated user. The initial API exposes read operations for products and orders; creation and editing can be added as mobile workflows are defined.
