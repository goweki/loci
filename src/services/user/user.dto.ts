import { Prisma } from "@/lib/prisma/generated";

// Input DTO for creating a user
export type CreateUserDTO = Prisma.UserUncheckedCreateInput;

// This allows you to get the return type of any User query based on the 'select' or 'include' passed
export type UserResponse<T extends Prisma.UserDefaultArgs> =
  Prisma.UserGetPayload<T>;

export const userInclude = Prisma.validator<Prisma.UserInclude>()({
  contacts: true,
  messages: true,
  subscriptions: { include: { product: { include: { lociPlan: true } } } },
  waba: { include: { phoneNumbers: true, templates: true } },
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
    product: { include: { lociPlan: true } },
  });

export type SubscriptionWithRelations = Prisma.PlanGetPayload<{
  include: typeof subscriptionInclude;
}>;
