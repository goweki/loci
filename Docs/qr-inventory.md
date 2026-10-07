# QR inventory workflow (planned)

This is the next inventory feature brief, not an implemented capability. Its purpose is to let an authenticated owner scan a product QR code to add or remove stock quickly, while keeping the product catalogue accurate for the AI assistant and customer engagement.

## Owner workflow

1. The owner opens inventory scanning from the authenticated dashboard and grants camera permission.
2. They scan a QR code associated with a product owned by their account.
3. The UI resolves the product and shows its name/current stock before any change.
4. The owner chooses **Add** or **Remove**, enters/scans a quantity, and confirms.
5. The server validates ownership and quantity, updates stock safely, and returns the new balance.
6. The UI shows a clear success/failure result and allows the next scan.

A scan must never silently mutate inventory. Require an explicit adjustment direction and confirmation, particularly for removal. Reject zero/negative quantities, unknown products, products owned by another user, and removals that exceed available stock.

## QR identity and safety

Prefer encoding an opaque, stable product identifier or an application URL containing an opaque identifier. Do not encode price, stock quantity, owner ID, or other mutable/trusted fields in the QR payload. Treat all scanned text as untrusted; the server resolves the identifier under the authenticated owner's scope. A QR code is an identifier, not authorization.

Generate printable/displayable QR codes from the product UI and support existing labels only if their payload format can be safely mapped. SKU exists in the schema but is optional and current product-create inputs do not expose it consistently; decide whether QR resolves by product ID or formalize SKU before implementation. Avoid relying on mutable product names.

## Data and implementation fit

`Product.stockQty` already holds the current quantity. `ProductService.updateStock(productId, quantityChange)` already applies a signed adjustment and prevents negative stock; route the new authenticated server action through the owner-scoped service rather than updating Prisma directly in the client.

Current schema has no inventory movement history. For a first minimal release, retain stock on `Product` and record adjustment metadata only if needed for operational review. If auditability is required, add a narrowly scoped `InventoryAdjustment` model with product/owner, signed quantity delta, resulting quantity, reason/source (`QR_SCAN`), actor, timestamp, and optional idempotency key. Decide this before shipping so duplicate scans/retries cannot double-adjust unnoticed. Use a transaction or conditional atomic update to protect concurrent scans and sales.

## Interaction with commerce and assistant

The assistant's catalogue search reads current `stockQty`, so successful adjustments become visible to subsequent assistant answers. Avoid promising real-time availability beyond the stored quantity. Marketplace checkout already decrements stock; QR adjustments must coexist with checkout and use concurrency-safe updates. This feature does not itself add payment or order workflows.

## Acceptance criteria

- Only an authenticated owner can resolve or adjust their products.
- Scanning alone does not alter stock; Add/Remove and quantity are confirmed.
- Invalid QR data, unauthorized products, invalid quantities, and insufficient stock produce safe errors.
- Concurrent scan and checkout operations cannot create negative or lost stock updates.
- Repeated submission is protected against accidental duplicate adjustment, or the UI clearly prevents/requires confirmation for re-submission.
- The resulting balance appears in product/inventory UI and is available to the catalogue search tool.
- Camera denial, unsupported camera, and manual fallback are handled accessibly.
