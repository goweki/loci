import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  updateManyAndReturn: vi.fn(),
  transaction: vi.fn(),
  adjustmentFindUnique: vi.fn(),
  adjustmentCreate: vi.fn(),
  productFindUnique: vi.fn(),
  productFindFirst: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireUser: mocks.user }));
vi.mock("@/lib/prisma", () => {
  const client = {
    product: { updateManyAndReturn: mocks.updateManyAndReturn, findUnique: mocks.productFindUnique, findFirst: mocks.productFindFirst },
    inventoryAdjustment: { findUnique: mocks.adjustmentFindUnique },
    $transaction: mocks.transaction,
  };
  return { default: { $extends: () => client } };
});

import { ProductService } from "@/services/commerce/product.service";

describe("inventory stock adjustment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user.mockResolvedValue({ id: "owner-1", role: "USER" });
    mocks.adjustmentFindUnique.mockResolvedValue(null);
  mocks.updateManyAndReturn.mockResolvedValue([{ stockQty: 7 }]);
    mocks.transaction.mockImplementation(async (run: (tx: unknown) => Promise<void>) => run({
      product: {
        updateManyAndReturn: mocks.updateManyAndReturn,
        findUnique: mocks.productFindUnique.mockResolvedValue({ stockQty: 7 }),
      },
      inventoryAdjustment: { create: mocks.adjustmentCreate.mockResolvedValue({ id: "adjustment-1" }) },
    }));
    mocks.productFindFirst.mockResolvedValue({ id: "product-1", userId: "owner-1", name: "Item", stockQty: 7 });
  });

  it("applies a tenant-scoped atomic decrement and records the resulting stock", async () => {
    const service = await ProductService.create();
    await service.updateStock("product-1", -3, "9de9d9e2-e90f-4d57-aeb0-8e66a84d3f60");

    expect(mocks.updateManyAndReturn).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "product-1", userId: "owner-1", stockQty: { gte: 3 } }),
      data: { stockQty: { increment: -3 } },
      select: { stockQty: true },
    }));
    expect(mocks.adjustmentCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ actorId: "owner-1", quantityChange: -3, stockAfter: 7, source: "QR_SCAN" }),
    }));
  });

  it("rejects non-integer and zero adjustments before touching stock", async () => {
    const service = await ProductService.create();
    await expect(service.updateStock("product-1", 0, "9de9d9e2-e90f-4d57-aeb0-8e66a84d3f60")).rejects.toThrow("non-zero whole number");
    await expect(service.updateStock("product-1", 1.5, "9de9d9e2-e90f-4d57-aeb0-8e66a84d3f60")).rejects.toThrow("non-zero whole number");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
