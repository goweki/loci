import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createApiKey: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/auth/token-handlers", () => ({ createApiKey: mocks.createApiKey }));
vi.mock("@/lib/prisma", () => ({
  default: { token: { updateMany: mocks.updateMany } },
}));

import { generateUserApiKey, revokeApiKey } from "@/actions/api-key.actions";

describe("Settings API key actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "owner-1", role: "USER" });
    mocks.createApiKey.mockResolvedValue({ apiKey: "loc_ak_secret" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("generates a one-day key for the authenticated owner", async () => {
    await expect(generateUserApiKey("integration test")).resolves.toBe("loc_ak_secret");
    expect(mocks.createApiKey).toHaveBeenCalledWith(expect.objectContaining({
      userId: "owner-1",
      description: "integration test",
      expiresAt: expect.any(Date),
    }));
    const expiresAt = mocks.createApiKey.mock.calls[0][0].expiresAt as Date;
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 24 * 60 * 60 * 1000);
  });

  it("scopes revocation to the authenticated user and API key type", async () => {
    await expect(revokeApiKey("key-1")).resolves.toMatchObject({ ok: true });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "key-1", type: "API_KEY", userId: "owner-1" },
      data: { isActive: false },
    });
  });

  it("does not report success when the key is not owned by the user", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(revokeApiKey("foreign-key")).resolves.toMatchObject({ ok: false });
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "foreign-key", userId: "owner-1" }),
    }));
  });
});
