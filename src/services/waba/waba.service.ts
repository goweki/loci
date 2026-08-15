import "server-only";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  PhoneNumber,
  PhoneNumberStatus,
  Prisma,
  TemplateApprovalStatus,
  TemplateCategory,
  UserRole,
  WabaAccount,
  WabaTemplate,
} from "@/lib/prisma/generated";

export const phoneNumberIncludes = {
  waba: true,
  messages: true,
  autoReplyRules: true,
} satisfies Prisma.PhoneNumberInclude;

export type PhoneNumberWithRelations = Prisma.PhoneNumberGetPayload<{
  include: typeof phoneNumberIncludes;
}>;

export type WabaServiceContext = {
  userId: string;
  userRole: UserRole;
};

export class WabaService {
  private userId: string;
  private userRole: UserRole;

  private constructor({ userId, userRole: role }: WabaServiceContext) {
    this.userId = userId;
    this.userRole = role;
  }

  /**
   * Factory method to initialize WabaService using provided session user or current context.
   */
  static async create(userData?: {
    id: string;
    role: UserRole;
  }): Promise<WabaService> {
    if (userData) {
      return new WabaService({
        userId: userData.id,
        userRole: userData.role,
      });
    }

    const user = await requireUser();
    return new WabaService({
      userId: user.id,
      userRole: user.role,
    });
  }

  /**
   * 🔐 Scope protection for WabaAccount
   */
  private scopeAccount<T extends Prisma.WabaAccountWhereInput>(
    where: T = {} as T,
  ): Prisma.WabaAccountWhereInput {
    if (this.userRole === UserRole.ADMIN) {
      return where;
    }

    return {
      ...where,
      userId: this.userId,
    };
  }

  /**
   * 🔐 Scope protection for sub-entities linked via WabaAccount
   */
  private scopeSubEntity<T extends Record<string, any>>(where: T = {} as T): T {
    if (this.userRole === UserRole.ADMIN) {
      return where;
    }

    return {
      ...where,
      waba: {
        ...((where.waba as Prisma.WabaAccountWhereInput) || {}),
        userId: this.userId,
      },
    };
  }

  // =====================================================
  // WABA ACCOUNT
  // =====================================================

  async createWabaAccount(
    data: Omit<Prisma.WabaAccountUncheckedCreateInput, "userId">,
  ): Promise<WabaAccount> {
    return prisma.wabaAccount.create({
      data: {
        ...data,
        userId: this.userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        phoneNumbers: true,
        templates: true,
      },
    });
  }

  async getWabaAccountById(id: string): Promise<WabaAccount> {
    const waba = await prisma.wabaAccount.findFirst({
      where: this.scopeAccount({ id }),
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        phoneNumbers: true,
        templates: true,
      },
    });

    if (!waba) {
      throw new Error("WABA account not found or access denied.");
    }

    return waba;
  }

  async getWabaAccountByUserId(userId?: string) {
    const targetUserId = userId || this.userId;

    return prisma.wabaAccount.findFirst({
      where: this.scopeAccount({ userId: targetUserId }),
      include: {
        phoneNumbers: true,
        templates: true,
      },
    });
  }

  async getAllWabaAccounts() {
    return prisma.wabaAccount.findMany({
      where: this.scopeAccount(),
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        phoneNumbers: true,
        templates: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateWabaAccount(
    id: string,
    data: Prisma.WabaAccountUpdateInput,
  ): Promise<WabaAccount> {
    await this.getWabaAccountById(id);

    return prisma.wabaAccount.update({
      where: { id },
      data,
      include: {
        phoneNumbers: true,
        templates: true,
      },
    });
  }

  async deleteWabaAccount(id: string): Promise<WabaAccount> {
    await this.getWabaAccountById(id);

    return prisma.wabaAccount.delete({
      where: { id },
    });
  }

  // =====================================================
  // TEMPLATES
  // =====================================================

  async createTemplate(
    data: Omit<Prisma.WabaTemplateUncheckedCreateInput, "createdById">,
  ): Promise<WabaTemplate> {
    await this.getWabaAccountById(data.wabaId);

    return prisma.wabaTemplate.create({
      data: {
        ...data,
        createdById: this.userId,
      },
      include: {
        waba: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getTemplateById(id: string): Promise<WabaTemplate> {
    const template = await prisma.wabaTemplate.findFirst({
      where: this.scopeSubEntity({ id }),
      include: {
        waba: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!template) {
      throw new Error("Template not found or access denied.");
    }

    return template;
  }

  async getTemplatesByWabaId(wabaId: string) {
    await this.getWabaAccountById(wabaId);

    return prisma.wabaTemplate.findMany({
      where: { wabaId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTemplatesByStatus(wabaId: string, status: TemplateApprovalStatus) {
    await this.getWabaAccountById(wabaId);

    return prisma.wabaTemplate.findMany({
      where: { wabaId, status },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTemplatesByCategory(wabaId: string, category: TemplateCategory) {
    await this.getWabaAccountById(wabaId);

    return prisma.wabaTemplate.findMany({
      where: { wabaId, category },
      orderBy: { createdAt: "desc" },
    });
  }

  async searchTemplates(wabaId: string, query: string) {
    await this.getWabaAccountById(wabaId);

    return prisma.wabaTemplate.findMany({
      where: {
        wabaId,
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateTemplate(
    id: string,
    data: Prisma.WabaTemplateUpdateInput,
  ): Promise<WabaTemplate> {
    await this.getTemplateById(id);

    return prisma.wabaTemplate.update({
      where: { id },
      data,
      include: {
        waba: true,
        createdBy: true,
      },
    });
  }

  async deleteTemplate(id: string): Promise<WabaTemplate> {
    await this.getTemplateById(id);

    return prisma.wabaTemplate.delete({
      where: { id },
    });
  }

  async syncTemplates(
    wabaId: string,
    templates: Array<
      Omit<
        Prisma.WabaTemplateUncheckedCreateInput,
        "createdById" | "wabaId"
      > & { id?: string }
    >,
  ) {
    await this.getWabaAccountById(wabaId);

    const operations = templates.map((template) => {
      const templateId = template.id || crypto.randomUUID();

      return prisma.wabaTemplate.upsert({
        where: { id: templateId },
        create: {
          ...template,
          wabaId,
          createdById: this.userId,
        },
        update: {
          name: template.name,
          status: template.status,
          category: template.category,
          language: template.language,
          components: template.components,
          rejectedReason: template.rejectedReason,
        },
      });
    });

    return prisma.$transaction(operations);
  }

  // =====================================================
  // PHONE NUMBERS
  // =====================================================

  async createPhoneNumber(
    data: Prisma.PhoneNumberUncheckedCreateInput & { wabaId: string },
  ): Promise<PhoneNumberWithRelations> {
    await this.getWabaAccountById(data.wabaId);

    return prisma.phoneNumber.create({
      data,
      include: phoneNumberIncludes,
    });
  }

  async getPhoneNumbers(): Promise<PhoneNumberWithRelations[]> {
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: this.scopeSubEntity(),
      include: phoneNumberIncludes,
    });

    if (phoneNumbers.length == 0) {
      throw new Error("Phone number not found or access denied.");
    }

    return phoneNumbers;
  }

  async getPhoneNumberById(id: string): Promise<PhoneNumberWithRelations> {
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: this.scopeSubEntity({ id }),
      include: phoneNumberIncludes,
    });

    if (!phoneNumber) {
      throw new Error("Phone number not found or access denied.");
    }

    return phoneNumber;
  }

  async getPhoneNumbersByWabaId(wabaId: string) {
    await this.getWabaAccountById(wabaId);

    return prisma.phoneNumber.findMany({
      where: { wabaId },
      include: {
        autoReplyRules: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updatePhoneNumber(
    id: string,
    data: Prisma.PhoneNumberUpdateInput,
  ): Promise<PhoneNumber> {
    await this.getPhoneNumberById(id);

    return prisma.phoneNumber.update({
      where: { id },
      data,
      include: {
        waba: true,
        autoReplyRules: true,
      },
    });
  }

  async verifyPhoneNumber(id: string): Promise<PhoneNumber> {
    await this.getPhoneNumberById(id);

    return prisma.phoneNumber.update({
      where: { id },
      data: {
        status: PhoneNumberStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });
  }

  async deletePhoneNumber(id: string): Promise<PhoneNumber> {
    await this.getPhoneNumberById(id);

    return prisma.phoneNumber.delete({
      where: { id },
    });
  }

  async getVerifiedPhoneNumbers(wabaId: string) {
    await this.getWabaAccountById(wabaId);

    return prisma.phoneNumber.findMany({
      where: {
        wabaId,
        status: PhoneNumberStatus.VERIFIED,
      },
      orderBy: { verifiedAt: "desc" },
    });
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  async getDashboardStats(userId?: string) {
    const targetUserId = userId || this.userId;
    const wabaAccount = await this.getWabaAccountByUserId(targetUserId);

    if (!wabaAccount) {
      return null;
    }

    const [
      totalPhoneNumbers,
      verifiedPhoneNumbers,
      totalTemplates,
      approvedTemplates,
      totalContacts,
      totalMessages,
      activeAutoReplyRules,
    ] = await Promise.all([
      prisma.phoneNumber.count({
        where: { wabaId: wabaAccount.id },
      }),
      prisma.phoneNumber.count({
        where: {
          wabaId: wabaAccount.id,
          status: PhoneNumberStatus.VERIFIED,
        },
      }),
      prisma.wabaTemplate.count({
        where: { wabaId: wabaAccount.id },
      }),
      prisma.wabaTemplate.count({
        where: {
          wabaId: wabaAccount.id,
          status: TemplateApprovalStatus.APPROVED,
        },
      }),
      prisma.contact.count({
        where: { userId: targetUserId },
      }),
      prisma.message.count({
        where: { userId: targetUserId },
      }),
      prisma.autoReplyRule.count({
        where: {
          createdById: targetUserId,
          active: true,
        },
      }),
    ]);

    return {
      wabaAccount,
      stats: {
        totalPhoneNumbers,
        verifiedPhoneNumbers,
        totalTemplates,
        approvedTemplates,
        totalContacts,
        totalMessages,
        activeAutoReplyRules,
      },
    };
  }
}
