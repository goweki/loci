A clean 4-layer architecture for your platform should separate:

1. **Server Actions** → UI-safe entry points
2. **Services** → business logic
3. **Repositories/Data layer** → Prisma DB access
4. **Domain/Utils** → DTOs, validators, helpers

Your platform is now evolving into:

> Omnichannel Commerce + Customer Communication

So the core business flow becomes:

```text
Product
   ↓
Order
   ↓
Invoice / Payment Link
   ↓
WhatsApp / SMS / Email delivery
   ↓
Customer pays
   ↓
Status updates + notifications
```

---

# Recommended Folder Structure

```txt
src/
├── actions/
│   ├── product.actions.ts
│   ├── order.actions.ts
│   ├── invoice.actions.ts
│   └── payment.actions.ts
│
├── services/
│   ├── product/
│   │   ├── product.service.ts
│   │   └── product.types.ts
│   │
│   ├── order/
│   │   ├── order.service.ts
│   │   ├── order-calculator.ts
│   │   └── order.types.ts
│   │
│   ├── invoice/
│   │   ├── invoice.service.ts
│   │   ├── invoice-number.ts
│   │   └── invoice.types.ts
│   │
│   └── communication/
│       ├── communication.service.ts
│       ├── whatsapp.service.ts
│       ├── sms.service.ts
│       └── email.service.ts
│
├── data/
│   └── repositories/
│       ├── product.repository.ts
│       ├── order.repository.ts
│       ├── invoice.repository.ts
│       └── payment.repository.ts
│
├── lib/
│   ├── types/
│   │   └── action-result.ts
│   │
│   └── utils/
│       ├── currency.ts
│       ├── invoice.ts
│       └── payment-links.ts
│
└── components/
    ├── products/
    ├── orders/
    ├── invoices/
    └── payments/
```

---

# 1. Shared Action Result Type

## `src/lib/types/action-result.ts`

```ts
export type ActionResult<T = void> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };
```

---

# 2. Repository Layer

Pure DB logic only.

---

## `product.repository.ts`

```ts
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";

export const productRepository = {
  create(data: Prisma.ProductUncheckedCreateInput) {
    return prisma.product.create({
      data,
    });
  },

  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
    });
  },

  findByUser(userId: string) {
    return prisma.product.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    });
  },

  delete(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  },
};
```

---

# 3. Service Layer

Business rules happen here.

---

# Product Service

## `product.service.ts`

```ts
import { productRepository } from "@/data/repositories/product.repository";

export class ProductService {
  static async createProduct(dto: {
    userId: string;
    name: string;
    price: number;
    stockQty?: number;
    currency?: string;
    description?: string;
  }) {
    return productRepository.create({
      ...dto,
      stockQty: dto.stockQty ?? 0,
      currency: dto.currency ?? "KES",
    });
  }

  static async updateStock(productId: string, quantityChange: number) {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    const nextQty = product.stockQty + quantityChange;

    if (nextQty < 0) {
      throw new Error("Insufficient stock");
    }

    return productRepository.update(productId, {
      stockQty: nextQty,
    });
  }
}
```

---

# Order Service

This becomes your main commerce engine.

---

## `order.service.ts`

```ts
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { InvoiceService } from "../invoice/invoice.service";

export class OrderService {
  static async createOrder(dto: {
    userId: string;
    contactId?: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  }) {
    return prisma.$transaction(async (tx) => {
      let subtotal = 0;

      const itemsData = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error("Product not found");
        }

        if (product.stockQty < item.quantity) {
          throw new Error(`${product.name} out of stock`);
        }

        const total = Number(product.price) * item.quantity;

        subtotal += total;

        itemsData.push({
          productId: product.id,
          name: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          total,
        });

        await tx.product.update({
          where: {
            id: product.id,
          },

          data: {
            stockQty: {
              decrement: item.quantity,
            },
          },
        });
      }

      const order = await tx.order.create({
        data: {
          userId: dto.userId,
          contactId: dto.contactId,
          subtotal,
          total: subtotal,

          items: {
            create: itemsData,
          },
        },

        include: {
          items: true,
          contact: true,
        },
      });

      const invoice = await InvoiceService.createInvoiceFromOrder(order.id, tx);

      await tx.order.update({
        where: { id: order.id },

        data: {
          invoiceId: invoice.id,
        },
      });

      return order;
    });
  }
}
```

---

# Invoice Service

---

## `invoice.service.ts`

```ts
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";

export class InvoiceService {
  static async createInvoiceFromOrder(
    orderId: string,
    txClient?: Prisma.TransactionClient,
  ) {
    const db = txClient ?? prisma;

    const order = await db.order.findUnique({
      where: { id: orderId },

      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const tax = Number(order.subtotal) * 0.16;

    const total = Number(order.subtotal) + tax;

    const invoiceNumber = `INV-${Date.now()}`;

    return db.invoice.create({
      data: {
        userId: order.userId,
        orderId: order.id,

        invoiceNumber,

        subtotal: order.subtotal,
        tax,
        total,

        currency: order.currency,

        status: "PENDING",
      },
    });
  }
}
```

---

# Communication Layer

This is the real differentiator of your platform.

---

## `communication.service.ts`

```ts
import whatsapp from "@/lib/whatsapp";
import sendSms from "@/lib/sms";

export class CommunicationService {
  static async sendInvoiceLink(dto: {
    phone: string;
    customerName?: string;
    invoiceNumber: string;
    amount: number;
    paymentLink: string;
    channel: "WHATSAPP" | "SMS";
  }) {
    const message = `
Hello ${dto.customerName ?? ""}

Invoice: ${dto.invoiceNumber}
Amount: KES ${dto.amount}

Pay here:
${dto.paymentLink}
`;

    if (dto.channel === "WHATSAPP") {
      return whatsapp.sendText({
        to: dto.phone,
        body: message,
      });
    }

    return sendSms({
      to: dto.phone,
      message,
    });
  }
}
```

---

# 4. Server Actions Layer

UI-safe.

---

## `order.actions.ts`

```ts
"use server";

import { ActionResult } from "@/lib/types/action-result";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { OrderService } from "@/services/order/order.service";

export async function createOrderAction(dto: {
  userId: string;
  contactId?: string;

  items: {
    productId: string;
    quantity: number;
  }[];
}): Promise<ActionResult> {
  try {
    const order = await OrderService.createOrder(dto);

    return {
      ok: true,
      data: order,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}
```

---

# Recommended UX Flow

Your app should guide users like this:

---

# FIRST LOGIN EXPERIENCE

Instead of showing empty dashboards:

## Show onboarding CTA cards

```text
1. Create Product
2. Connect WhatsApp
3. Add Customer
4. Send First Invoice
```

---

# CORE FLOW

## A user should be able to:

### 1. Add Products

```text
Rice - KES 300
Cooking Oil - KES 800
```

### 2. Select Customer

From WhatsApp contacts.

### 3. Create Order

```text
2x Rice
1x Oil
```

### 4. Generate Invoice

Auto-generated.

### 5. Send via WhatsApp

```text
Hi John,
Your invoice is ready:
KES 1400

Pay here:
...
```

---

# THIS is the market fit

Not “WhatsApp integrations”.

The real product is:

> Businesses selling and collecting money through WhatsApp/SMS.

That becomes:

- CRM
- invoicing
- commerce
- customer support
- automation
- payment collection

inside one platform.

---

# Next Things You Should Add

In order:

---

# Phase 1

### REQUIRED

- Product catalog
- Orders
- Invoice PDFs
- Payment links
- WhatsApp invoice sending
- Contact purchase history

---

# Phase 2

### HIGH VALUE

- Cart recovery
- AI sales assistant
- Auto followups
- Low stock alerts
- QuickPay links
- Broadcast campaigns

---

# Phase 3

### ENTERPRISE

- Multi-user teams
- Warehouses
- Delivery tracking
- POS mode
- Shopify sync
- WooCommerce sync

---

# Most Important Architectural Rule

Keep:

```text
Server Action = thin
Service = fat
Repository = dumb
```

Meaning:

- Actions → validation + return shape
- Services → all business logic
- Repositories → Prisma only

That keeps your codebase scalable as the commerce layer grows.
