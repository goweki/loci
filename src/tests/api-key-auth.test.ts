import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  hashSha256: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: { token: { findFirst: mocks.findFirst, update: mocks.update } },
  prisma: { token: { findFirst: mocks.findFirst, update: mocks.update } },
}));
vi.mock("@/lib/utils/authHandlers", () => ({ hashSha256: mocks.hashSha256 }));
vi.mock("@/services/user/user.service", () => ({ UserService: { getUserByKey: vi.fn() } }));

import { TokenType } from "@/lib/prisma/generated";
import { validateToken } from "@/lib/auth/token-handlers";

describe("API key authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hashSha256.mockReturnValue("hashed-key");
    mocks.findFirst.mockResolvedValue({
      id: "key-1",
      isActive: true,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "owner-1", username: "owner", status: "ACTIVE" },
    });
    mocks.update.mockResolvedValue({});
  });

  it("accepts an active, unexpired key for an active user and records use", async () => {
    await expect(validateToken("raw-key", TokenType.API_KEY)).resolves.toMatchObject({
      id: "key-1",
      user: { id: "owner-1" },
    });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "key-1" },
      data: { lastUsedAt: expect.any(Date) },
    }));
  });

  it("rejects expired keys", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "key-1",
      isActive: true,
      expiresAt: new Date(Date.now() - 60_000),
      user: { id: "owner-1", username: "owner", status: "ACTIVE" },
    });
    const response = await validateToken("raw-key", TokenType.API_KEY);
    expect(response).toMatchObject({ status: 401 });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects keys belonging to inactive users", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "key-1",
      isActive: true,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "owner-1", username: "owner", status: "SUSPENDED" },
    });
    const response = await validateToken("raw-key", TokenType.API_KEY);
    expect(response).toMatchObject({ status: 403 });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
