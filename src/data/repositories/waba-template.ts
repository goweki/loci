// data/repositories/waba-template.repository.ts

import { prisma } from "@/lib/prisma";

import {
  Prisma,
  WabaTemplate,
  TemplateApprovalStatus,
  TemplateCategory,
  TemplateLanguage,
} from "@/lib/prisma/generated";

// Filter options for querying templates
export type WabaTemplateFilters = {
  userId?: string;
  wabaAccountId?: string;
  status?: TemplateApprovalStatus;
  category?: TemplateCategory;
  language?: TemplateLanguage;
  searchQuery?: string;
};

// Pagination options
export type PaginationOptions = {
  page?: number;
  pageSize?: number;
};

// Paginated result type
export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export class WabaTemplateRepository {
  /**
   * Create a new WABA template
   */
  static async create(
    data:
      | Prisma.WabaTemplateCreateInput
      | Prisma.WabaTemplateUncheckedCreateInput
  ): Promise<WabaTemplate> {
    return prisma.wabaTemplate.create({
      data,
    });
  }

  /**
   * Find a template by ID
   */
  static async findById(id: string): Promise<WabaTemplate | null> {
    return prisma.wabaTemplate.findUnique({
      where: { id },
    });
  }

  /**
   * Find a template by ID and user ID (for authorization)
   */
  static async findByIdAndUserId(
    id: string,
    userId: string
  ): Promise<Prisma.WabaTemplateGetPayload<{ include: {} }> | null> {
    return prisma.wabaTemplate.findFirst({
      where: {
        id,
        createdById: userId,
      },
    });
  }

  /**
   * Find all templates with optional filters and pagination
   */
  static async findMany(
    filters: WabaTemplateFilters = {},
    pagination?: PaginationOptions
  ): Promise<WabaTemplate[]> {
    const where = this.buildWhereClause(filters);

    return prisma.wabaTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(pagination && {
        skip: ((pagination.page || 1) - 1) * (pagination.pageSize || 10),
        take: pagination.pageSize || 10,
      }),
    });
  }

  /**
   * Find templates with pagination
   */
  static async findManyPaginated(
    filters: WabaTemplateFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<WabaTemplate>> {
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 10;
    const where = this.buildWhereClause(filters);

    const [data, total] = await Promise.all([
      prisma.wabaTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.wabaTemplate.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Find all templates by user ID
   */
  static async findByUserId(
    userId: string
  ): Promise<Prisma.WabaTemplateGetPayload<{}>[]> {
    return prisma.wabaTemplate.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find all templates by WABA account ID
   */
  static async findByWabaAccountId(wabaId: string): Promise<WabaTemplate[]> {
    return prisma.wabaTemplate.findMany({
      where: { wabaId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find templates by status
   */
  static async findByStatus(
    status: TemplateApprovalStatus,
    userId?: string
  ): Promise<WabaTemplate[]> {
    return prisma.wabaTemplate.findMany({
      where: {
        status,
        ...(userId && { userId }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find templates by category
   */
  static async findByCategory(
    category: TemplateCategory,
    userId?: string
  ): Promise<WabaTemplate[]> {
    return prisma.wabaTemplate.findMany({
      where: {
        category,
        ...(userId && { userId }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update a template by ID
   */
  static async update(
    id: string,
    data: Prisma.WabaTemplateUpdateInput
  ): Promise<WabaTemplate> {
    return prisma.wabaTemplate.update({
      where: { id },
      data: data,
    });
  }

  /**
   * Update a template by ID and user ID (for authorization)
   */
  static async updateByIdAndUserId(
    id: string,
    userId: string,
    input: Prisma.WabaTemplateUpdateInput
  ): Promise<WabaTemplate> {
    // First verify the template belongs to the user
    const template = await this.findByIdAndUserId(id, userId);
    if (!template) {
      throw new Error("Template not found or access denied");
    }

    return prisma.wabaTemplate.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete a template by ID
   */
  static async delete(id: string): Promise<WabaTemplate> {
    return prisma.wabaTemplate.delete({
      where: { id },
    });
  }

  /**
   * Delete a template by ID and user ID (for authorization)
   */
  static async deleteByIdAndUserId(
    id: string,
    userId: string
  ): Promise<WabaTemplate> {
    // First verify the template belongs to the user
    const template = await this.findByIdAndUserId(id, userId);
    if (!template) {
      throw new Error("Template not found or access denied");
    }

    return prisma.wabaTemplate.delete({
      where: { id },
    });
  }

  /**
   * Delete all templates for a user
   */
  static async deleteByUserId(userId: string): Promise<{ count: number }> {
    return prisma.wabaTemplate.deleteMany({
      where: { createdById: userId },
    });
  }

  /**
   * Count templates with optional filters
   */
  static async count(filters: WabaTemplateFilters = {}): Promise<number> {
    const where = this.buildWhereClause(filters);
    return prisma.wabaTemplate.count({ where });
  }

  /**
   * Get template statistics for a user
   */
  static async getStatsByUserId(userId: string) {
    const [total, approved, pending, rejected, disabled] = await Promise.all([
      prisma.wabaTemplate.count({ where: { createdById: userId } }),
      prisma.wabaTemplate.count({
        where: { createdById: userId, status: "APPROVED" },
      }),
      prisma.wabaTemplate.count({
        where: { createdById: userId, status: "PENDING" },
      }),
      prisma.wabaTemplate.count({
        where: { createdById: userId, status: "REJECTED" },
      }),
      prisma.wabaTemplate.count({
        where: { createdById: userId, status: "DISABLED" },
      }),
    ]);

    return {
      total,
      byStatus: {
        approved,
        pending,
        rejected,
        disabled,
      },
    };
  }

  /**
   * Get template statistics by category for a user
   */
  static async getStatsByCategoryForUser(userId: string) {
    const [marketing, utility, authentication] = await Promise.all([
      prisma.wabaTemplate.count({
        where: { createdById: userId, category: TemplateCategory.MARKETING },
      }),
      prisma.wabaTemplate.count({
        where: { createdById: userId, category: TemplateCategory.UTILITY },
      }),
      prisma.wabaTemplate.count({
        where: {
          createdById: userId,
          category: TemplateCategory.AUTHENTICATION,
        },
      }),
    ]);

    return {
      byCategory: {
        marketing,
        utility,
        authentication,
      },
    };
  }

  /**
   * Check if a template name exists for a user
   */
  static async existsByNameAndUserId(
    name: string,
    userId: string,
    excludeId?: string
  ): Promise<boolean> {
    const count = await prisma.wabaTemplate.count({
      where: {
        name,
        createdById: userId,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  /**
   * Bulk update template status
   */
  static async bulkUpdateStatus(
    ids: string[],
    status: TemplateApprovalStatus,
    rejectedReason?: string | null
  ): Promise<{ count: number }> {
    return prisma.wabaTemplate.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        ...(rejectedReason !== undefined && { rejectedReason }),
      },
    });
  }

  /**
   * Search templates by name
   */
  static async searchByName(
    searchQuery: string,
    userId?: string
  ): Promise<WabaTemplate[]> {
    return prisma.wabaTemplate.findMany({
      where: {
        name: {
          contains: searchQuery,
          mode: "insensitive",
        },
        ...(userId && { userId }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Private helper method to build where clause from filters
   */
  private static buildWhereClause(
    filters: WabaTemplateFilters
  ): Prisma.WabaTemplateWhereInput {
    const where: Prisma.WabaTemplateWhereInput = {};

    if (filters.userId) {
      where.createdById = filters.userId;
    }

    if (filters.wabaAccountId) {
      where.wabaId = filters.wabaAccountId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.language) {
      where.language = filters.language;
    }

    if (filters.searchQuery) {
      where.name = {
        contains: filters.searchQuery,
        mode: "insensitive",
      };
    }

    return where;
  }
}
