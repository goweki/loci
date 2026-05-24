import { requireUser } from "@/lib/auth";
import _prisma from "@/lib/prisma";
import { Prisma, Product as Product_ } from "@/lib/prisma/generated";

const productIncludeRelations: Prisma.ProductInclude = {
  orderItems: true,
};

export type ProductWithRelations_ = Prisma.ProductGetPayload<{
  include: typeof productIncludeRelations;
}>;

export const prisma = _prisma.$extends({
  result: {
    product: {
      price: {
        needs: { price: true },
        compute(product) {
          return product.price.toNumber(); // Or .toFixed(2)
        },
      },
    },
  },
});

// 1. Swap the price out for standard Product
export type Product = Omit<Product_, "price"> & {
  price: number;
};

// 2. Swap the price out for ProductWithRelations
export type ProductWithRelations = Omit<ProductWithRelations_, "price"> & {
  price: number;
};

export class ProductService {
  static async createProduct(
    data: Prisma.ProductUncheckedCreateInput,
  ): Promise<Product> {
    return prisma.product.create({
      data,
    });
  }

  static async getProductById(
    productId: string,
  ): Promise<ProductWithRelations | null> {
    const user = await requireUser();

    const where: Prisma.ProductWhereInput =
      user.role === "ADMIN" ? {} : { userId: user.id };

    return prisma.product.findFirst({
      where: { id: productId, ...where },
      include: productIncludeRelations,
    });
  }

  static async getUserProducts(): Promise<ProductWithRelations[]> {
    const user = await requireUser();
    return prisma.product.findMany({
      where: { userId: user.id },
      include: productIncludeRelations,
    });
  }

  static async updateStock(productId: string, quantityChange: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const nextQty = product.stockQty + quantityChange;

    if (nextQty < 0) {
      throw new Error("Insufficient stock");
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        stockQty: nextQty,
      },
    });
  }
}
