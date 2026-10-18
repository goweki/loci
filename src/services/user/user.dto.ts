import { Prisma } from "@/lib/prisma/generated";

// Input DTO for creating a user
export type CreateUserDTO = Prisma.UserUncheckedCreateInput;

// This allows you to get the return type of any User query based on the 'select' or 'include' passed
export type UserResponse<T extends Prisma.UserDefaultArgs> =
  Prisma.UserGetPayload<T>;

export const userInclude = Prisma.validator<Prisma.UserInclude>()({
  contacts: true,
  messages: true,
  subscriptions: { include: { plan: true } },
  waba: {
    select: {
      id: true,
      name: true,
      userId: true,
      ownership: true,
      currency: true,
      timezoneId: true,
      messageTemplateNamespace: true,
      businessId: true,
      tokenUpdatedAt: true,
      createdAt: true,
      updatedAt: true,
      phoneNumbers: {
        select: {
          id: true,
          phoneNumber: true,
          displayName: true,
          status: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,
          wabaId: true,
          whatsappRegistrationStatus: true,
        },
      },
      templates: true,
    },
  },
  autoreplyRules: true,
  _count: {
    select: {
      contacts: true,
      messages: true,
    },
  },
});

export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;

/*
 *.  Subscription
 */

export const subscriptionInclude =
  Prisma.validator<Prisma.SubscriptionInclude>()({
    plan: true,
  });

export type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
  include: typeof subscriptionInclude;
}>;
