import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, Product } from "@/lib/prisma/generated";

const productIncludeRelations: Prisma.ProductInclude = {
  orderItems: true,
};

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productIncludeRelations;
}>;

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
