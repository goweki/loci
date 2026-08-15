import { TokenType } from "@/lib/prisma/generated";

export type ApiKey = {
  id: string;
  type: TokenType;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date | null;
  description: string;
};
