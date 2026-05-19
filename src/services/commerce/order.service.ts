// import prisma from "@/lib/prisma";

// export class OrderService {
//   static async createOrder(dto: {
//     userId: string;
//     contactId?: string;

//     items: {
//       productId: string;
//       quantity: number;
//     }[];
//   }) {
//     return prisma.$transaction(async (tx) => {
//       let subtotal = 0;

//       const orderItems = [];

//       for (const item of dto.items) {
//         const product = await tx.product.findUnique({
//           where: {
//             id: item.productId,
//           },
//         });

//         if (!product) {
//           throw new Error("Product not found");
//         }

//         if (product.stockQty < item.quantity) {
//           throw new Error(`${product.name} is out of stock`);
//         }

//         const lineTotal = Number(product.price) * item.quantity;

//         subtotal += lineTotal;

//         orderItems.push({
//           productId: product.id,
//           name: product.name,
//           quantity: item.quantity,
//           unitPrice: product.price,
//           total: lineTotal,
//         });

//         await tx.product.update({
//           where: {
//             id: product.id,
//           },

//           data: {
//             stockQty: {
//               decrement: item.quantity,
//             },
//           },
//         });
//       }

//       const order = await tx.order.create({
//         data: {
//           userId: dto.userId,
//           contactId: dto.contactId,

//           subtotal,
//           total: subtotal,

//           items: {
//             create: orderItems,
//           },
//         },

//         include: {
//           items: true,
//           contact: true,
//         },
//       });

//       return order;
//     });
//   }
// }

import prisma from "@/lib/prisma";
import { InvoiceService } from "./invoice.service";
// import { Decimal } from "@prisma/client/runtime/library";
// import { InvoiceService } from "../invoice/invoice.service";

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
