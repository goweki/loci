import "server-only";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AutoReplyRule, Prisma, UserRole } from "@/lib/prisma/generated";

export class AutoReplyService {
  private userId: string;
  private userRole: UserRole;

  private constructor({
    userId,
    userRole,
  }: {
    userId: string;
    userRole: UserRole;
  }) {
    this.userId = userId;
    this.userRole = userRole;
  }

  static async create(userData?: {
    id: string;
    role: UserRole;
  }): Promise<AutoReplyService> {
    if (userData) {
      return new AutoReplyService({
        userId: userData.id,
        userRole: userData.role,
      });
    }
    const user = await requireUser();
    return new AutoReplyService({ userId: user.id, userRole: user.role });
  }

  /**
   * 🔐 Scope protection for AutoReplyRule queries
   */
  private scopeRule<T extends Prisma.AutoReplyRuleWhereInput>(
    where: T = {} as T,
  ): T {
    if (this.userRole === UserRole.ADMIN) {
      return where;
    }

    return {
      ...where,
      createdById: this.userId,
    };
  }

  /**
   * Retrieves all AutoReplyRules scoped to the current user (or all if ADMIN).
   */
  async getAllAutoReplyRules(phoneNumberId?: string): Promise<AutoReplyRule[]> {
    return prisma.autoReplyRule.findMany({
      where: this.scopeRule({
        ...(phoneNumberId ? { phoneNumberId } : {}),
      }),
      include: {
        phoneNumber: {
          select: {
            id: true,
            phoneNumber: true,
            displayName: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  }

  async getAutoReplyRuleById(id: string): Promise<AutoReplyRule> {
    const rule = await prisma.autoReplyRule.findFirst({
      where: this.scopeRule({ id }),
      include: {
        phoneNumber: true,
      },
    });

    if (!rule) {
      throw new Error("Auto-reply rule not found or access denied.");
    }

    return rule;
  }

  async createAutoReplyRule(
    data: Omit<Prisma.AutoReplyRuleUncheckedCreateInput, "createdById">,
  ): Promise<AutoReplyRule> {
    return prisma.autoReplyRule.create({
      data: {
        ...data,
        createdById: this.userId,
      },
      include: {
        phoneNumber: true,
      },
    });
  }

  async updateAutoReplyRule(
    id: string,
    data: Prisma.AutoReplyRuleUpdateInput,
  ): Promise<AutoReplyRule> {
    await this.getAutoReplyRuleById(id);

    return prisma.autoReplyRule.update({
      where: { id },
      data,
    });
  }

  async deleteAutoReplyRule(id: string): Promise<AutoReplyRule> {
    await this.getAutoReplyRuleById(id);

    return prisma.autoReplyRule.delete({
      where: { id },
    });
  }
}
