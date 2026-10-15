import { requireUser } from "@/lib/auth";
import _prisma from "@/lib/prisma";
import {
  Prisma,
  Product as Product_,
  SubscriptionStatus,
  UserRole,
} from "@/lib/prisma/generated";

const productIncludeRelations = {
  orderItems: true,
  user: {
    select: {
      name: true,
      username: true,
      email: true,
      tel: true,
      subscriptions: {
        where: {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.INCOMPLETE],
          },
        },
        select: {
          status: true,
          plan: true,
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Omit<
  Prisma.ProductGetPayload<{
    include: typeof productIncludeRelations;
  }>,
  "price"
> & {
  price: number;
};

export const prisma = _prisma.$extends({
  result: {
    product: {
      price: {
        needs: { price: true },
        compute(product) {
          return product.price.toNumber();
        },
      },
    },
  },
});

type ProductGet = Omit<Prisma.ProductGetPayload<{}>, "price"> & {
  price: number;
};

type ProductServiceContext = {
  userId: string;
  role: UserRole;
};

export class ProductService {
  private userId: string;
  private role: UserRole;

  private constructor({ userId, role }: ProductServiceContext) {
    this.userId = userId;
    this.role = role;
  }

  static async create() {
    const user = await requireUser();

    return new ProductService({
      userId: user.id,
      role: user.role as UserRole,
    });
  }

  static async getPublicProductById(
    productId: string,
  ): Promise<ProductWithRelations | null> {
    return prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
        user: {
          status: "ACTIVE",
        },
      },
      include: productIncludeRelations,
    });
  }

  static async getPublicProductsByUsername(
    username: string,
  ): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: {
        isActive: true,
        user: {
          username,
          status: "ACTIVE",
        },
      },
      include: productIncludeRelations,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Multi-tenant scoping
   */
  private scope(
    where: Prisma.ProductWhereInput = {},
  ): Prisma.ProductWhereInput {
    if (this.role === UserRole.ADMIN) {
      return where;
    }

    return {
      ...where,
      userId: this.userId,
    };
  }

  /**
   * Create Product
   */
  async createProduct(
    data: Omit<Prisma.ProductUncheckedCreateInput, "userId">,
  ): Promise<ProductGet> {
    const prodDto = {
      ...data,
      userId: this.userId,
    };

    console.log("[CREATING PRODUCT]:", prodDto);

    return prisma.product.create({
      data: prodDto,
    });
  }

  /**
   * Single Product
   */
  async getProductById(
    productId: string,
  ): Promise<ProductWithRelations | null> {
    return prisma.product.findFirst({
      where: this.scope({
        id: productId,
      }),
      include: productIncludeRelations,
    });
  }

  /**
   * All Products
   */
  async getProducts(): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: this.scope(),
      include: productIncludeRelations,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Update Product
   */
  async updateProduct(productId: string, data: Prisma.ProductUpdateInput) {
    const product = await this.getProductById(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    return prisma.product.update({
      where: {
        id: productId,
      },
      data,
    });
  }

  /**
   * Delete Product
   */
  async deleteProduct(productId: string) {
    const product = await this.getProductById(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    return prisma.product.delete({
      where: {
        id: productId,
      },
    });
  }

  /**
   * Stock Adjustment
   */
  async updateStock(productId: string, quantityChange: number, idempotencyKey: string) {
    if (!Number.isInteger(quantityChange) || quantityChange === 0) {
      throw new Error("Stock adjustment must be a non-zero whole number");
    }
    if (!idempotencyKey || idempotencyKey.length > 100) throw new Error("A valid adjustment request ID is required.");

    const prior = await prisma.inventoryAdjustment.findUnique({ where: { idempotencyKey } });
    if (prior) {
      if (prior.productId !== productId || prior.actorId !== this.userId || prior.quantityChange !== quantityChange) {
        throw new Error("This adjustment request ID was already used for a different change.");
      }
      return this.getProductById(productId);
    }

    try {
      await prisma.$transaction(async (tx) => {
        const where: Prisma.ProductWhereInput = this.scope({
          id: productId,
          ...(quantityChange < 0 ? { stockQty: { gte: Math.abs(quantityChange) } } : {}),
        });
        const updated = await tx.product.updateManyAndReturn({
          where,
          data: { stockQty: { increment: quantityChange } },
          select: { stockQty: true },
        });
        if (!updated.length) {
          const product = await this.getProductById(productId);
          if (!product) throw new Error("Product not found or access denied");
          throw new Error("Insufficient stock");
        }
        await tx.inventoryAdjustment.create({
          data: {
            productId,
            actorId: this.userId,
            quantityChange,
            stockAfter: updated[0].stockQty,
            source: "QR_SCAN",
            idempotencyKey,
          },
        });
      });
    } catch (error) {
      const duplicate = await prisma.inventoryAdjustment.findUnique({ where: { idempotencyKey } });
      if (duplicate?.productId === productId && duplicate.actorId === this.userId && duplicate.quantityChange === quantityChange) {
        return this.getProductById(productId);
      }
      throw error;
    }
    return this.getProductById(productId);
  }

  /**
   * Dashboard Stats
   */
  async getProductStats() {
    const [totalProducts, activeProducts, lowStockProducts] = await Promise.all(
      [
        prisma.product.count({
          where: this.scope(),
        }),

        prisma.product.count({
          where: this.scope({
            isActive: true,
          }),
        }),

        prisma.product.count({
          where: this.scope({
            stockQty: {
              lte: 5,
            },
          }),
        }),
      ],
    );

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
    };
  }

  /**
   * ⚠️ Low Stock Products
   */
  async getLowStockProducts(threshold = 5): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: this.scope({
        isActive: true,
        stockQty: {
          lte: threshold,
        },
      }),
      include: productIncludeRelations,
      orderBy: [
        {
          stockQty: "asc",
        },
        {
          name: "asc",
        },
      ],
    });
  }
}
