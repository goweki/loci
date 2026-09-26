import { createHmac } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getUserByKey: vi.fn(),
  bcryptCompare: vi.fn(),
  hashSha256: vi.fn(),
  getSubscriptionByUserId: vi.fn(),
  prisma: {
    $extends: vi.fn(),
    $transaction: vi.fn(),
    product: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    payment: {
      updateMany: vi.fn(),
    },
    subscriptionPayment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
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

vi.mock("@/utils/passwordHandlers", () => ({
  bcryptCompare: mocks.bcryptCompare,
  hashSha256: mocks.hashSha256,
}));

vi.mock("@/lib/utils/passwordHandlers", () => ({
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
    subscriptions: [{ status: "ACTIVE" }],
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

    mocks.prisma.payment.updateMany.mockResolvedValue({ count: 0 });
    mocks.prisma.subscriptionPayment.findUnique.mockResolvedValue({
      id: "subscription-payment-row-1",
      subscriptionId: "subscription-1",
    });
    mocks.prisma.subscriptionPayment.update.mockResolvedValue({
      id: "subscription-payment-row-1",
      status: "SUCCESS",
    });
    mocks.prisma.subscription.update.mockResolvedValue({
      id: "subscription-1",
      status: "ACTIVE",
    });
    mocks.prisma.$transaction.mockImplementation(
      (operations: Promise<unknown>[]) => Promise.all(operations),
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
    expect(mocks.prisma.subscriptionPayment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { transactionId: "subscription-payment-1" },
      }),
    );
    expect(mocks.prisma.subscriptionPayment.update).toHaveBeenCalledWith({
      where: { id: "subscription-payment-row-1" },
      data: { status: "SUCCESS" },
    });
    expect(mocks.prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: "subscription-1" },
      data: { status: "ACTIVE" },
    });
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
});
