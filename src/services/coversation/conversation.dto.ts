import { Prisma } from "@/lib/prisma/generated";

// Input DTO for creating a message
export type CreateMessageDTO = Prisma.MessageUncheckedCreateInput;

// This allows you to get the return type of any Message query based on the 'select' or 'include' passed
export type MessageResponse<T extends Prisma.MessageDefaultArgs> =
  Prisma.MessageGetPayload<T>;

export const messageWithRelations = Prisma.validator<Prisma.MessageInclude>()({
  contact: true,
});

export type MessageWithRelations = Prisma.MessageGetPayload<{
  include: typeof messageWithRelations;
}>;
