import prisma from "@/lib/prisma";
import { ContactStatus, ContactUs, Prisma } from "@/lib/prisma/generated";

export interface CreateContactUsInput {
  email: string;
  message: string;
  name?: string;
  subject?: string;
  phone?: string;
  company?: string;
}

export interface UpdateContactUsInput {
  name?: string;
  subject?: string;
  message?: string;
  phone?: string;
  company?: string;
  status?: ContactStatus;
}

export interface ContactUsFilters {
  email?: string;
  status?: ContactStatus;
  startDate?: Date;
  endDate?: Date;
}

export class ContactUsRepository {
  /**
   * Create a new contact submission
   */
  async create(data: CreateContactUsInput): Promise<ContactUs> {
    return await prisma.contactUs.create({
      data,
    });
  }

  /**
   * Find contact by ID
   */
  async findById(id: string): Promise<ContactUs | null> {
    return await prisma.contactUs.findUnique({
      where: { id },
    });
  }

  /**
   * Find all contacts with optional filtering
   */
  async findAll(filters?: ContactUsFilters): Promise<ContactUs[]> {
    const where: Prisma.ContactUsWhereInput = {};

    if (filters?.email) {
      where.email = {
        contains: filters.email,
        mode: "insensitive",
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return await prisma.contactUs.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Find contacts by email
   */
  async findByEmail(email: string): Promise<ContactUs[]> {
    return await prisma.contactUs.findMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Find contacts by status
   */
  async findByStatus(status: ContactStatus): Promise<ContactUs[]> {
    return await prisma.contactUs.findMany({
      where: { status },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Update contact by ID
   */
  async update(id: string, data: UpdateContactUsInput): Promise<ContactUs> {
    return await prisma.contactUs.update({
      where: { id },
      data,
    });
  }

  /**
   * Update contact status
   */
  async updateStatus(id: string, status: ContactStatus): Promise<ContactUs> {
    return await prisma.contactUs.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Delete contact by ID
   */
  async delete(id: string): Promise<ContactUs> {
    return await prisma.contactUs.delete({
      where: { id },
    });
  }

  /**
   * Get contact count by status
   */
  async countByStatus(status?: ContactStatus): Promise<number> {
    return await prisma.contactUs.count({
      where: status ? { status } : undefined,
    });
  }

  /**
   * Get paginated contacts
   */
  async findPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: ContactUsFilters
  ): Promise<{
    data: ContactUs[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: Prisma.ContactUsWhereInput = {};

    if (filters?.email) {
      where.email = {
        contains: filters.email,
        mode: "insensitive",
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [data, total] = await Promise.all([
      prisma.contactUs.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.contactUs.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark contact as spam
   */
  async markAsSpam(id: string): Promise<ContactUs> {
    return await this.updateStatus(id, ContactStatus.SPAM);
  }

  /**
   * Mark contact as resolved
   */
  async markAsResolved(id: string): Promise<ContactUs> {
    return await this.updateStatus(id, ContactStatus.RESOLVED);
  }

  /**
   * Get recent contacts (last 7 days)
   */
  async getRecent(days: number = 7): Promise<ContactUs[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.contactUs.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

// Export a singleton instance
export const contactUsRepository = new ContactUsRepository();
