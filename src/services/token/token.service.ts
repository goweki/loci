import "server-only";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  NotificationChannel,
  Prisma,
  Token,
  TokenType,
} from "@/lib/prisma/generated";
import { generateRawToken, hashSha256 } from "@/lib/utils/passwordHandlers";

export type TokenServiceContext = {
  userId: string;
};

export class TokenService {
  private userId: string;

  private constructor({ userId }: TokenServiceContext) {
    this.userId = userId;
  }

  /**
   * Factory method to initialize TokenService using provided userId or current session user.
   */
  static async create(userId?: string): Promise<TokenService> {
    if (userId) {
      return new TokenService({ userId });
    }

    const user = await requireUser();
    return new TokenService({ userId: user.id });
  }

  /**
   * 🔐 Centralized access control scoping tokens strictly to the user
   */
  private scope<T extends Prisma.TokenWhereInput>(
    where: T = {} as T,
  ): Prisma.TokenWhereInput {
    return {
      ...where,
      userId: this.userId,
    };
  }

  /**
   * 🔑 Generate & persist a new token/API key.
   * Returns the raw secret ONLY once alongside the database record.
   */
  async generateToken(params: {
    type: TokenType;
    description?: string;
    expiresInDays?: number;
    channel?: NotificationChannel;
  }): Promise<{ token: Omit<Token, "hashedToken">; rawSecret: string }> {
    const {
      type,
      description = "API Access Token",
      expiresInDays = 30,
      channel,
    } = params;

    const rawToken = generateRawToken(type);
    const hashedToken = hashSha256(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const token = await prisma.token.upsert({
      where: {
        type_userId: {
          type,
          userId: this.userId,
        },
      },
      update: {
        hashedToken,
        description,
        expiresAt,
        channel,
        isActive: true,
        lastUsedAt: null,
      },
      create: {
        userId: this.userId,
        type,
        hashedToken,
        description,
        expiresAt,
        channel,
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        description: true,
        channel: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
        userId: true,
      },
    });

    return { token, rawSecret: rawToken };
  }

  /**
   * 📜 Get all tokens for the active user (excludes hashed values)
   */
  async getTokens(params?: { type?: TokenType; isActive?: boolean }) {
    const { type, isActive } = params || {};

    return prisma.token.findMany({
      where: this.scope({
        ...(type ? { type } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      }),
      select: {
        id: true,
        type: true,
        description: true,
        channel: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
        userId: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * 🔎 Get token by ID
   */
  async getTokenById(tokenId: string) {
    const token = await prisma.token.findFirst({
      where: this.scope({ id: tokenId }),
      select: {
        id: true,
        type: true,
        description: true,
        channel: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
        userId: true,
      },
    });

    if (!token) {
      throw new Error("Token not found or access denied.");
    }

    return token;
  }

  /**
   * 🛑 Revoke an active token
   */
  async revokeToken(tokenId: string) {
    const token = await prisma.token.findFirst({
      where: this.scope({ id: tokenId }),
    });

    if (!token) {
      throw new Error("Token not found or access denied.");
    }

    return prisma.token.update({
      where: { id: tokenId },
      data: { isActive: false },
      select: {
        id: true,
        type: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * 🗑️ Delete token permanently
   */
  async deleteToken(tokenId: string) {
    const token = await prisma.token.findFirst({
      where: this.scope({ id: tokenId }),
    });

    if (!token) {
      throw new Error("Token not found or access denied.");
    }

    return prisma.token.delete({
      where: { id: tokenId },
    });
  }

  /**
   * ⚡ Verify raw secret token and update usage timestamp (Static utility for API gateway / middleware)
   */
  static async validateAndTouchToken(rawSecret: string, type: TokenType) {
    const hashedToken = hashSha256(rawSecret);

    const token = await prisma.token.findFirst({
      where: {
        hashedToken,
        type,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!token) {
      return { valid: false, user: null, token: null };
    }

    // Touch lastUsedAt asynchronously
    await prisma.token.update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    });

    return { valid: true, user: token.user, token };
  }
}
