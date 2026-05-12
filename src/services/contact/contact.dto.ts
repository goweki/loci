import { Prisma } from "@/lib/prisma/generated";

// Input DTO for creating a contact
export type CreateContactDTO = Prisma.ContactUncheckedCreateInput;

// This allows you to get the return type of any Contact query based on the 'select' or 'include' passed
export type ContactResponse<T extends Prisma.ContactDefaultArgs> =
  Prisma.ContactGetPayload<T>;

export const contactWithRelations = Prisma.validator<Prisma.ContactInclude>()({
  messages: {
    orderBy: {
      timestamp: "desc",
    },
    take: 1,
  },

  _count: {
    select: {
      messages: {
        where: {
          direction: "INBOUND",
          status: {
            not: "READ",
          },
        },
      },
    },
  },
});

export type ContactWithRelations = Prisma.ContactGetPayload<{
  include: typeof contactWithRelations;
}>;
