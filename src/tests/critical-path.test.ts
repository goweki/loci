import { createHmac } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getUserByKey: vi.fn(),
  bcryptCompare: vi.fn(),
  hashSha256: vi.fn(),
  getSubscriptionByUserId: vi.fn(),
  verifyPaystackTransaction: vi.fn(),
  verifyPaystackTransfer: vi.fn(),
  prisma: {
    $extends: vi.fn(),
    $transaction: vi.fn(),
    product: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
    },
    orderPayout: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    payment: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    subscriptionPayment: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    subscription: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    webhookEvent: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    token: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: mocks.prisma,
  prisma: mocks.prisma,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/services/user/user.service", () => ({
  UserService: {
    getUserByKey: mocks.getUserByKey,
  },
}));

vi.mock("@/utils/authHandlers", () => ({
  bcryptCompare: mocks.bcryptCompare,
  hashSha256: mocks.hashSha256,
}));

vi.mock("@/lib/utils/authHandlers", () => ({
  bcryptCompare: mocks.bcryptCompare,
  hashSha256: mocks.hashSha256,
}));

vi.mock("@/services/subscription/subscription.service", () => ({
  SubscriptionService: {
    getSubscriptionByUserId: mocks.getSubscriptionByUserId,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/payments/paystack-api", () => ({
  initializePaystackTransaction: vi.fn(),
  initiatePaystackTransfer: vi.fn(),
  createPaystackTransferRecipient: vi.fn(),
  verifyPaystackTransaction: mocks.verifyPaystackTransaction,
  verifyPaystackTransfer: mocks.verifyPaystackTransfer,
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: (provider: Record<string, unknown>) => ({
    id: "credentials",
    ...provider,
  }),
}));

vi.mock("next-auth/providers/google", () => ({
  default: (provider: Record<string, unknown>) => ({
    id: "google",
    ...provider,
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const merchantProduct = {
  id: "product-1",
  userId: "user-1",
  name: "Test product",
  description: "A product available to the public",
  imageUrl: null,
  price: 1500,
  currency: "KES",
  isActive: true,
  stockQty: 4,
  user: {
    id: "user-1",
    name: "Test Merchant",
    username: "test-merchant",
    email: "merchant@example.com",
    tel: "254700000000",
    subscriptions: [{ status: "ACTIVE", plan: { name: "STANDARD" } }],
  },
};

describe("merchant launch critical path", () => {
  beforeAll(() => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-nextauth-secret");
    vi.stubEnv("PAYSTACK_SECRET_KEY", "test-paystack-secret");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-google-client");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-google-secret");
    mocks.prisma.$extends.mockReturnValue(mocks.prisma);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$extends.mockReturnValue(mocks.prisma);
  });

  it("authenticates a user with valid credentials", async () => {
    const { authOptions } = await import("@/lib/auth/auth-options");
    const provider = authOptions.providers.find(
      (entry) => "id" in entry && entry.id === "credentials",
    );
    const authorize = (
      provider as unknown as {
        authorize: (
          credentials: { username: string; password: string },
          request: never,
        ) => Promise<unknown>;
      }
    ).authorize;

    mocks.getUserByKey.mockResolvedValue({
      id: "user-1",
      email: "merchant@example.com",
      name: "Test Merchant",
      image: null,
      password: "stored-hash",
      status: "ACTIVE",
      role: "USER",
    });
    mocks.prisma.token.findMany.mockResolvedValue([]);
    mocks.bcryptCompare.mockResolvedValue(true);
    mocks.getSubscriptionByUserId.mockResolvedValue({ subscription: null });

    const user = await authorize(
      {
        username: "merchant@example.com",
        password: "correct-password",
      },
      undefined as never,
    );

    expect(user).toMatchObject({ id: "user-1", email: "merchant@example.com" });
    expect(mocks.getUserByKey).toHaveBeenCalledWith("merchant@example.com");
    expect(mocks.bcryptCompare).toHaveBeenCalledWith(
      "correct-password",
      "stored-hash",
    );
  });

  it("creates a product and exposes it through the public store and product lookup", async () => {
    const { createProductAction, getPublicProductById } =
      await import("@/actions/product.actions");
    const { default: MerchantSpacePage } =
      await import("@/app/[lang]/(mid-pages)/space/[username]/page");
    const { default: PublicProductPage } =
      await import("@/app/[lang]/(mid-pages)/product/[productId]/page");
    const { getMerchantProducts } =
      await import("@/app/[lang]/(mid-pages)/space/[username]/_components/space-utils");

    mocks.requireUser.mockResolvedValue({ id: "user-1", role: "USER" });
    mocks.prisma.product.create.mockResolvedValue(merchantProduct);
    mocks.prisma.product.findMany.mockResolvedValue([merchantProduct]);
    mocks.prisma.product.findFirst.mockResolvedValue(merchantProduct);

    const created = await createProductAction({
      name: merchantProduct.name,
      description: merchantProduct.description,
      price: merchantProduct.price,
      currency: "KES" as never,
      stockQty: merchantProduct.stockQty,
    });

    expect(created).toMatchObject({ ok: true, data: { id: "product-1" } });
    expect(mocks.prisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1", name: "Test product" }),
    });

    const storeProducts = await getMerchantProducts("test-merchant");
    expect(storeProducts).toContain(merchantProduct);
    expect(mocks.prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          user: { username: "test-merchant", status: "ACTIVE" },
        },
      }),
    );

    const storefrontPage = await MerchantSpacePage({
      params: Promise.resolve({ username: "test-merchant" }),
    });
    expect(storefrontPage.props.products).toContain(merchantProduct);

    const publicProduct = await getPublicProductById("product-1");
    expect(publicProduct).toMatchObject({
      ok: true,
      data: { id: "product-1", user: { username: "test-merchant" } },
    });
    expect(mocks.prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "product-1",
          isActive: true,
          user: { status: "ACTIVE" },
        },
      }),
    );

    const productPage = await PublicProductPage({
      params: Promise.resolve({ productId: "product-1", lang: "en" }),
    });
    expect(productPage.props.children[1].props).toMatchObject({
      canPurchase: true,
    });
  });

  it("accepts a signed Paystack success event and activates the subscription", async () => {
    const { POST } = await import("@/app/api/webhooks/paystack/route");
    const payload = JSON.stringify({
      event: "charge.success",
      data: {
        reference: "subscription-payment-1",
        amount: 150000,
        currency: "KES",
        status: "success",
      },
    });
    const signature = createHmac("sha512", "test-paystack-secret")
      .update(payload)
      .digest("hex");

    mocks.prisma.webhookEvent.create.mockResolvedValue({ id: "webhook-1" });
    mocks.verifyPaystackTransaction.mockResolvedValue({
      status: "success",
      reference: "subscription-payment-1",
      amount: 150000,
      currency: "KES",
      paid_at: "2026-09-26T12:00:00.000Z",
    });
    mocks.prisma.payment.findUnique.mockResolvedValue(null);
    mocks.prisma.subscriptionPayment.findUnique.mockResolvedValue({
      id: "subscription-payment-row-1",
      subscriptionId: "subscription-1",
      amount: { toNumber: () => 1500 },
      currency: "KES",
    });
    const paymentClaim = vi.fn().mockResolvedValue({ count: 1 });
    const subscriptionLookup = vi.fn().mockResolvedValue({
      id: "subscription-1",
      interval: "MONTHLY",
    });
    const subscriptionUpdate = vi
      .fn()
      .mockResolvedValue({ id: "subscription-1" });
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          subscriptionPayment: { updateMany: paymentClaim },
          subscription: {
            findUniqueOrThrow: subscriptionLookup,
            update: subscriptionUpdate,
          },
        }),
    );

    const response = await POST(
      new Request("http://localhost/api/webhooks/paystack", {
        method: "POST",
        headers: { "x-paystack-signature": signature },
        body: payload,
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mocks.verifyPaystackTransaction).toHaveBeenCalledWith(
      "subscription-payment-1",
    );
    expect(mocks.prisma.subscriptionPayment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { transactionId: "subscription-payment-1" },
      }),
    );
    expect(paymentClaim).toHaveBeenCalledWith({
      where: { id: "subscription-payment-row-1", status: "PENDING" },
      data: expect.objectContaining({ status: "SUCCESS" }),
    });
    expect(subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: "subscription-1" },
      data: expect.objectContaining({ status: "ACTIVE" }),
    });
    expect(mocks.prisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ processed: true }),
      }),
    );
  });

  it("rejects a Paystack event with an invalid signature", async () => {
    const { POST } = await import("@/app/api/webhooks/paystack/route");
    const payload = JSON.stringify({
      event: "charge.success",
      data: { reference: "payment-2", amount: 1000, status: "success" },
    });

    const response = await POST(
      new Request("http://localhost/api/webhooks/paystack", {
        method: "POST",
        headers: { "x-paystack-signature": "0".repeat(128) },
        body: payload,
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(mocks.prisma.payment.updateMany).not.toHaveBeenCalled();
  });

  it("does not process marketplace payouts while the feature flag is false", async () => {
    vi.stubEnv("PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED", "false");
    const { MarketplacePaymentService } =
      await import("@/services/commerce/marketplace-payment.service");
    const service = new MarketplacePaymentService();

    await expect(service.processQueuedPayouts()).resolves.toEqual({
      processed: 0,
      disabled: true,
    });
    expect(mocks.verifyPaystackTransfer).not.toHaveBeenCalled();
  });

  it("does not queue a seller payout before the dispute window expires", async () => {
    vi.stubEnv("PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED", "false");
    vi.stubEnv("MARKETPLACE_DISPUTE_WINDOW_HOURS", "72");
    const { MarketplacePaymentService } =
      await import("@/services/commerce/marketplace-payment.service");
    mocks.prisma.order.findUnique.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "PAID",
      deliveryConfirmedAt: new Date(Date.now() - 60 * 60 * 1000),
      disputeOpenedAt: null,
      payout: null,
    });

    const service = new MarketplacePaymentService();
    const result = await service.requestSellerPayout("order-1");

    expect(result.released).toBe(false);
    expect(result.reason).toContain("becomes eligible after");
    expect(mocks.prisma.orderPayout.upsert).not.toHaveBeenCalled();
  });
});
