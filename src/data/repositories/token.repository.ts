import { prisma } from "@/lib/prisma";
import { TokenType, Token, Prisma } from "@/lib/prisma/generated";

export class TokenRepository {
  /**
   * Create or update a token for a specific user and type.
   * Using upsert ensures we don't have multiple active tokens of the same type
   */
  async upsertToken(data: {
    userId: string;
    description: string;
    type: TokenType;
    hashedToken: string;
    expiresAt: Date;
    channel?: Token["channel"];
  }) {
    return prisma.token.upsert({
      where: {
        type_userId: {
          type: data.type,
          userId: data.userId,
        },
      },
      update: {
        description: data.description,
        hashedToken: data.hashedToken,
        expiresAt: data.expiresAt,
        channel: data.channel,
        lastUsedAt: null, // Reset usage on update
      },
      create: {
        userId: data.userId,
        description: data.description,
        type: data.type,
        hashedToken: data.hashedToken,
        expiresAt: data.expiresAt,
        channel: data.channel,
      },
    });
  }

  /**
   * Find a valid token by its hash and type.
   * Includes a check to ensure it hasn't expired.
   */
  async findValidToken(hashedToken: string, type: TokenType) {
    return prisma.token.findFirst({
      where: {
        hashedToken,
        type,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true, // Often useful to get the user immediately after validation
      },
    });
  }

  /**
   * Get all tokens for a specific user, optionally filtered by type.
   */
  async getTokensByUser(userId: string, type?: TokenType) {
    return prisma.token.findMany({
      where: {
        userId,
        ...(type && { type }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Updates the 'lastUsedAt' timestamp.
   * Useful for tracking API_KEY usage patterns.
   */
  async touch(tokenId: string) {
    return prisma.token.update({
      where: { id: tokenId },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Deactivate Token
   */
  async revokeApiKey(tokenId: string) {
    return prisma.token.update({
      where: { id: tokenId },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Delete a token (e.g., after successful use or logout)
   */
  async deleteToken(userId: string, type: TokenType) {
    return prisma.token.delete({
      where: {
        type_userId: {
          type,
          userId,
        },
      },
    });
  }

  /**
   * Cleanup: Delete all expired tokens from the database.
   */
  async purgeExpiredTokens() {
    return prisma.token.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

// singleton instance
export const tokenRepository = new TokenRepository();
