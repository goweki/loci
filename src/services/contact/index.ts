import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, UserRole } from "@/lib/prisma/generated";

type ServiceContext = {
  userId: string;
  role: UserRole;
};

export class ContactsService {
  private userId: string;
  private role: UserRole;

  private constructor(ctx: { userId: string; role: UserRole }) {
    this.userId = ctx.userId;
    this.role = ctx.role;
  }

  static async create() {
    const user = await requireAuth();

    return new ContactsService({
      userId: user.id,
      role: user.role as UserRole,
    });
  }

  /**
   * 🔐 Centralized access control
   */
  private scope<T extends Prisma.ContactWhereInput>(
    where: T = {} as T,
  ): Prisma.ContactWhereInput {
    if (this.role === UserRole.ADMIN) {
      return where;
    }

    return {
      ...where,
      userId: this.userId,
    };
  }

  /**
   * 📇 Get all contacts (role-aware)
   */
  async getContacts(params?: {
    search?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { search, limit = 20, cursor } = params || {};

    return prisma.contact.findMany({
      where: this.scope({
        OR: search
          ? [
              { phoneNumber: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      }),
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: {
        lastMessageAt: "desc",
      },
    });
  }

  /**
   * 👤 Get single contact
   */
  async getContactById(contactId: string) {
    return prisma.contact.findFirst({
      where: this.scope({
        id: contactId,
      }),
      include: {
        messages: {
          orderBy: { timestamp: "desc" },
          take: 20,
        },
      },
    });
  }

  /**
   * 📞 Get or create contact (useful for inbound messages)
   */
  async getOrCreateContact(phoneNumber: string) {
    const existing = await prisma.contact.findFirst({
      where: this.scope({ phoneNumber }),
    });

    if (existing) return existing;

    return prisma.contact.create({
      data: {
        phoneNumber,
        userId: this.userId,
      },
    });
  }

  /**
   * ➕ Create contact
   */
  async createContact(data: {
    phoneNumber: string;
    name?: string;
    avatar?: string;
  }) {
    return prisma.contact.create({
      data: {
        ...data,
        userId: this.userId,
      },
    });
  }

  /**
   * ✏️ Update contact
   */
  async updateContact(contactId: string, data: Prisma.ContactUpdateInput) {
    const contact = await this.getContactById(contactId);
    if (!contact) throw new Error("Contact not found");

    return prisma.contact.update({
      where: { id: contactId },
      data,
    });
  }

  /**
   * ❌ Delete contact
   */
  async deleteContact(contactId: string) {
    const contact = await this.getContactById(contactId);
    if (!contact) throw new Error("Contact not found");

    return prisma.contact.delete({
      where: { id: contactId },
    });
  }

  /**
   * 💬 Get messages for a contact
   */
  async getMessages(contactId: string, limit = 50) {
    const contact = await this.getContactById(contactId);
    if (!contact) throw new Error("Unauthorized or not found");

    return prisma.message.findMany({
      where: {
        contactId,
        ...(this.role !== UserRole.ADMIN && {
          userId: this.userId,
        }),
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * 📊 Get contacts with last message preview
   */
  async getContactsWithLastMessage() {
    return prisma.contact.findMany({
      where: this.scope(),
      include: {
        messages: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });
  }

  /**
   * 🔍 Search contacts deeply
   */
  async searchContacts(query: string) {
    return prisma.contact.findMany({
      where: this.scope({
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phoneNumber: { contains: query } },
          {
            messages: {
              some: {
                content: {
                  path: [],
                  string_contains: query,
                },
              },
            },
          },
        ],
      }),
      take: 20,
    });
  }

  /**
   * 📈 Get active contacts (recent activity)
   */
  async getActiveContacts(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.contact.findMany({
      where: this.scope({
        lastMessageAt: {
          gte: since,
        },
      }),
      orderBy: {
        lastMessageAt: "desc",
      },
    });
  }
}
