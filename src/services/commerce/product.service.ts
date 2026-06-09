import { requireUser } from "@/lib/auth";
import _prisma from "@/lib/prisma";
import { Prisma, Product as Product_, UserRole } from "@/lib/prisma/generated";

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
          return product.price.toNumber();
        },
      },
    },
  },
});

export type Product = Omit<Product_, "price"> & {
  price: number;
};

export type ProductWithRelations = Omit<ProductWithRelations_, "price"> & {
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
  ): Promise<Product> {
    return prisma.product.create({
      data: {
        ...data,
        userId: this.userId,
      },
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
  async updateStock(productId: string, quantityChange: number) {
    const product = await this.getProductById(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    const nextQty = product.stockQty + quantityChange;

    if (nextQty < 0) {
      throw new Error("Insufficient stock");
    }

    return prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        stockQty: nextQty,
      },
    });
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
