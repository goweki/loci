import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

import {
  PhoneNumberStatus,
  Prisma,
  TemplateApprovalStatus,
  TemplateCategory,
  UserRole,
} from "@/lib/prisma/generated";

export type WabaServiceContext = {
  userId: string;
  role: UserRole;
};

export class WabaService {
  private userId: string;
  private role: UserRole;

  private constructor({ userId, role }: WabaServiceContext) {
    this.userId = userId;
    this.role = role;
  }

  static async create() {
    const user = await requireUser();

    return new WabaService({
      userId: user.id,
      role: user.role,
    });
  }

  /**
   * 🔐 Scope protection
   */
  private scope<T extends Prisma.WabaAccountWhereInput>(
    where: T = {} as T,
  ): Prisma.WabaAccountWhereInput {
    if (this.role === UserRole.ADMIN) {
      return where;
    }

    return {
      ...where,
      userId: this.userId,
    };
  }

  // =====================================================
  // WABA ACCOUNT
  // =====================================================

  async createWabaAccount(
    data:
      | Prisma.WabaAccountCreateInput
      | Prisma.WabaAccountUncheckedCreateInput,
  ) {
    return prisma.wabaAccount.create({
      data,

      include: {
        user: true,
        phoneNumbers: true,
        templates: true,
      },
    });
  }

  async getWabaAccountById(id: string) {
    const waba = await prisma.wabaAccount.findFirst({
      where: this.scope({ id }),

      include: {
        user: true,
        phoneNumbers: true,
        templates: true,
      },
    });

    if (!waba) {
      throw new Error("WABA account not found");
    }

    return waba;
  }

  async getWabaAccountByUserId(userId?: string) {
    const targetUserId = userId || this.userId;

    return prisma.wabaAccount.findFirst({
      where: this.scope({
        userId: targetUserId,
      }),

      include: {
        phoneNumbers: true,
        templates: true,
      },
    });
  }

  async getAllWabaAccounts() {
    return prisma.wabaAccount.findMany({
      where: this.scope(),

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        phoneNumbers: true,
        templates: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateWabaAccount(id: string, data: Prisma.WabaAccountUpdateInput) {
    return prisma.wabaAccount.update({
      where: { id },

      data,

      include: {
        phoneNumbers: true,
        templates: true,
      },
    });
  }

  async deleteWabaAccount(id: string) {
    return prisma.wabaAccount.delete({
      where: { id },
    });
  }

  // =====================================================
  // TEMPLATES
  // =====================================================

  async createTemplate(data: Prisma.WabaTemplateCreateInput) {
    return prisma.wabaTemplate.create({
      data,

      include: {
        waba: true,

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getTemplateById(id: string) {
    const template = await prisma.wabaTemplate.findUnique({
      where: { id },

      include: {
        waba: true,
        createdBy: true,
      },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  }

  async getTemplatesByWabaId(wabaId: string) {
    return prisma.wabaTemplate.findMany({
      where: {
        wabaId,
      },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getTemplatesByStatus(wabaId: string, status: TemplateApprovalStatus) {
    return prisma.wabaTemplate.findMany({
      where: {
        wabaId,
        status,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getTemplatesByCategory(wabaId: string, category: TemplateCategory) {
    return prisma.wabaTemplate.findMany({
      where: {
        wabaId,
        category,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async searchTemplates(wabaId: string, query: string) {
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
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateTemplate(id: string, data: Prisma.WabaTemplateUpdateInput) {
    return prisma.wabaTemplate.update({
      where: { id },

      data,

      include: {
        waba: true,
        createdBy: true,
      },
    });
  }

  async deleteTemplate(id: string) {
    return prisma.wabaTemplate.delete({
      where: { id },
    });
  }

  async syncTemplates(templates: Prisma.WabaTemplateCreateInput[]) {
    const operations = templates.map((template) =>
      prisma.wabaTemplate.upsert({
        where: {
          id: template.id as string,
        },

        create: template,

        update: {
          name: template.name,
          status: template.status,
          category: template.category,
          language: template.language,
          components: template.components,
          rejectedReason: template.rejectedReason,
        },
      }),
    );

    return prisma.$transaction(operations);
  }

  // =====================================================
  // PHONE NUMBERS
  // =====================================================

  async createPhoneNumber(data: Prisma.PhoneNumberCreateInput) {
    return prisma.phoneNumber.create({
      data,

      include: {
        waba: true,
        autoReplyRules: true,
      },
    });
  }

  async getPhoneNumberById(id: string) {
    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { id },

      include: {
        waba: true,
        autoReplyRules: true,
      },
    });

    if (!phoneNumber) {
      throw new Error("Phone number not found");
    }

    return phoneNumber;
  }

  async getPhoneNumbersByWabaId(wabaId: string) {
    return prisma.phoneNumber.findMany({
      where: {
        wabaId,
      },

      include: {
        autoReplyRules: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updatePhoneNumber(id: string, data: Prisma.PhoneNumberUpdateInput) {
    return prisma.phoneNumber.update({
      where: { id },

      data,

      include: {
        waba: true,
        autoReplyRules: true,
      },
    });
  }

  async verifyPhoneNumber(id: string) {
    return prisma.phoneNumber.update({
      where: { id },

      data: {
        status: PhoneNumberStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });
  }

  async deletePhoneNumber(id: string) {
    return prisma.phoneNumber.delete({
      where: { id },
    });
  }

  async getVerifiedPhoneNumbers(wabaId: string) {
    return prisma.phoneNumber.findMany({
      where: {
        wabaId,
        status: PhoneNumberStatus.VERIFIED,
      },

      orderBy: {
        verifiedAt: "desc",
      },
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
        where: {
          wabaId: wabaAccount.id,
        },
      }),

      prisma.phoneNumber.count({
        where: {
          wabaId: wabaAccount.id,
          status: PhoneNumberStatus.VERIFIED,
        },
      }),

      prisma.wabaTemplate.count({
        where: {
          wabaId: wabaAccount.id,
        },
      }),

      prisma.wabaTemplate.count({
        where: {
          wabaId: wabaAccount.id,
          status: TemplateApprovalStatus.APPROVED,
        },
      }),

      prisma.contact.count({
        where: {
          userId: targetUserId,
        },
      }),

      prisma.message.count({
        where: {
          userId: targetUserId,
        },
      }),

      prisma.autoReplyRule.count({
        where: {
          createdById: targetUserId,
          isActive: true,
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
