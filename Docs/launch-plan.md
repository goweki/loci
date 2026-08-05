# Loci MVP Launch Plan

This document is the launch-ready implementation plan for the Loci app. It is designed for developers and LLM agents to work from one single source of truth.

## Goal

Get the app production-ready today with an MVP that enables merchants to add products, publish them to a public storefront, and receive buyer interest via contact-first commerce. Use `STANDARD` as the minimum purchase-enabled plan. Keep Paystack ready but defer full checkout integration to post-launch.

## Prioritized task list

### 1. Subscription gating and minimum plan enforcement

- Ticket: `STANDARD` minimum gating
- Files:
  - `src/data/subscription.ts`
  - `src/lib/prisma/seed/seed-plans.ts`
  - `src/lib/auth/auth-options.ts`
- Work:
  - Ensure `STANDARD` or any plan with `popular: true` unlocks purchase-related UI.
  - Map subscription statuses to UI behavior:
    - `ACTIVE` / `DUE` → show buy/cart controls
    - `TRIALING` / `INACTIVE` → show only `Contact Seller`
  - Guarantee gating uses merchant subscription status, not the visiting buyer’s session.

### 2. Public storefront and product pages

- Ticket: public mid-page server components
- Files:
  - `src/app/[lang]/(mid-pages)/space/[username]/page.tsx`
  - `src/app/[lang]/(mid-pages)/product/[productId]/page.tsx`
  - `src/components/layouts/` (new/shared layout files)
- Work:
  - Load merchant active products server-side.
  - Load product details and merchant subscription status on the product page.
  - Add or reuse a shared mid-page layout for consistent public UI.

### 3. MVP order/cart baseline

- Ticket: order draft/cart implementation
- Files:
  - `src/actions/order.actions.ts`
  - `src/services/commerce/order.service.ts`
  - `src/lib/prisma/schema.prisma` (verify `Order` / `OrderItem` structure)
- Work:
  - Use `Order` as the cart/order entity.
  - Support creation of `PENDING` orders with nested items, total, currency, and optional contact.
  - Keep all business logic in service layer methods.

### 4. Service/action separation

- Ticket: enforce service boundaries
- Files:
  - `src/services/commerce/product.service.ts`
  - `src/services/commerce/order.service.ts`
  - `src/actions/*`
- Work:
  - Move business rules into services.
  - Keep actions thin and returning `ActionResult`.
  - Remove direct Prisma access from page/UI components.

### 5. Contact-first commerce UX

- Ticket: fallback contact seller path
- Files:
  - `src/components/dashboard/products/product-view/purchase-card.tsx`
  - `src/app/[lang]/(mid-pages)/space/[username]/_components/product-card.tsx`
  - `src/app/[lang]/(mid-pages)/product/[productId]/page.tsx`
- Work:
  - Show `Contact Seller` for merchants without active `STANDARD` subscriptions.
  - For active `STANDARD` merchants, show buy/cart UI but keep checkout simple and low risk.
  - Prefer existing contact and WABA flows to collect buyer interest.

### 6. Paystack readiness without launch dependency

- Ticket: validate Paystack plumbing
- Files:
  - `src/lib/payments/client.ts`
  - `src/lib/payments/index.ts`
  - `src/app/api/webhooks/paystack/route.ts`
- Work:
  - Confirm Paystack client initialization and env var checking.
  - Confirm payment helpers compile cleanly.
  - Do not require full checkout for launch.

### 7. Chatbot/WABA migration strategy

- Ticket: dashboard chatbot separation
- Files:
  - `src/components/dashboard/chatbot/`
  - `src/components/__dashboard/contacts/`
  - `src/components/settings/waba-templates/`
  - `src/components/settings/settings-client/tab-whatsapp.tsx`
- Work:
  - Keep launch commerce separate from chatbot migration.
  - Move finished WABA/chatbot logic into dashboard chatbot components.
  - Use legacy `__dashboard/contacts` only as migration source until new components are complete.

### 8. Legacy folder cleanup

- Ticket: remove old dashboard imports
- Files:
  - `src/components/__dashboard/*`
  - `src/components/dashboard/*`
- Work:
  - Avoid importing from `src/components/__dashboard` in launch routes.
  - Migrate required UI into `src/components/dashboard`.
  - Clean up duplicates after launch.

### 9. QA and deployment validation

- Ticket: final verification
- Work:
  - Test signup/login for credentials and Google.
  - Test dashboard product creation.
  - Test public storefront and product page behavior.
  - Test subscription gating and order draft creation.
  - Run `npm run lint` and `npm run build`.
  - Confirm environment variables:
    - `DATABASE_URL`
    - `NEXTAUTH_SECRET`
    - `PAYSTACK_SECRET_KEY`
    - `BASE_URL`
    - `NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID`

### 10. Post-launch optimization

- Ticket: post-launch roadmap
- Work:
  - Add full cart persistence and multi-item checkout.
  - Complete Paystack payment flow.
  - Finish `__dashboard` → `dashboard` migration.
  - Harden dashboard chatbot/WABA automation.
  - Add order/invoice history and analytics.
