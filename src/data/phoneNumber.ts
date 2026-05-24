// "use server";

// import { prisma } from "@/lib/prisma";
// import { PhoneNumber, Prisma } from "@/lib/prisma/generated";

// export type PhoneNumberGetPayload = Prisma.PhoneNumberGetPayload<{
//   include: {
//     waba: true;
//     messages: true;
//   };
// }>;

// /**
//  * 🔍 Find a phone number by its ID.
//  */
// export async function getPhoneNumberById(
//   id: string,
// ): Promise<PhoneNumberGetPayload | null> {
//   return prisma.phoneNumber.findUnique({
//     where: { id },
//     include: {
//       waba: true,
//       messages: true,
//     },
//   });
// }

// /**
//  * ✅ Validate that a phone number belongs to the user and is VERIFIED.
//  *
//  * Use this before sending messages, assigning rules, etc.
//  */
// export async function validatePhoneNumberOwnership(
//   phoneNumberId: string,
//   userId: string,
// ): Promise<PhoneNumber> {
//   const wabaId = (await getUserById(userId))?.id;
//   const phoneNumber = await prisma.phoneNumber.findFirst({
//     where: {
//       id: phoneNumberId,
//       wabaId,
//       status: "VERIFIED",
//     },
//   });

//   if (!phoneNumber) {
//     throw new Error("Phone number not found or not verified.");
//   }

//   return phoneNumber;
// }

// /**
//  * 🔍 Find a phone number by its actual number.
//  */
// export async function getPhoneNumberByNumber(phoneNumber: string) {
//   return prisma.phoneNumber.findUnique({
//     where: { phoneNumber },
//   });
// }

// /**
//  * 📦 Get all phone numbers for a given user.
//  */
// export async function getPhoneNumbersByUser(
//   userId: string,
// ): Promise<
//   Prisma.PhoneNumberGetPayload<{ include: { messages: true; waba: true } }>[]
// > {
//   const wabaId = (await getUserById(userId))?.id;
//   return prisma.phoneNumber.findMany({
//     where: { wabaId },
//     orderBy: { createdAt: "desc" },
//     include: { messages: true, waba: true },
//   });
// }

// /**
//  * 📦 Get all phone numbers
//  */
// export async function getAllPhoneNumbers(): Promise<
//   Prisma.PhoneNumberGetPayload<{ include: { messages: true; waba: true } }>[]
// > {
//   return prisma.phoneNumber.findMany({
//     where: {},
//     orderBy: { createdAt: "desc" },
//     include: { messages: true, waba: true },
//   });
// }

// /**
//  * ➕ Create a new phone number record.
//  */
// export async function createPhoneNumber(
//   data: Prisma.PhoneNumberCreateInput | Prisma.PhoneNumberUncheckedCreateInput,
// ): Promise<Prisma.PhoneNumberGetPayload<{}>> {
//   return prisma.phoneNumber.create({
//     data,
//   });
// }

// /**
//  * ✏️ Update an existing phone number.
//  */
// export async function updatePhoneNumber(
//   id: string,
//   data: Prisma.PhoneNumberUpdateInput,
// ) {
//   return prisma.phoneNumber.update({
//     where: { id },
//     data,
//   });
// }

// /**
//  * 🗑️ Delete a phone number (for example, when a user removes integration).
//  */
// export async function deletePhoneNumber(id: string) {
//   return prisma.phoneNumber.delete({
//     where: { id },
//   });
// }

// /**
//  * 📊 Count the number of verified phone numbers for a given user.
//  */
// export async function countVerifiedPhoneNumbers(userId: string) {
//   const wabaId = (await getUserById(userId))?.id;
//   return prisma.phoneNumber.count({
//     where: {
//       wabaId,
//       status: "VERIFIED",
//     },
//   });
// }

// /**
//  * ✅ Check if the user is within their plan’s phone number limit.
//  *
//  * You can call this from your API before creating a new phone number.
//  */
// export async function checkPhoneNumberLimit(userId: string) {
//   const subscription = await prisma.subscription.findFirst({
//     where: { userId, cancelDate: null },
//     include: { plan: true },
//   });

//   if (!subscription) {
//     throw new Error("No active subscription found");
//   }

//   const verifiedCount = await countVerifiedPhoneNumbers(userId);
//   const allowed = subscription.plan.maxPhoneNumbers;

//   return {
//     withinLimit: verifiedCount < allowed,
//     used: verifiedCount,
//     limit: allowed,
//   };
// }

"use server";

import prisma from "@/lib/prisma";
import { PhoneNumber, Prisma, PhoneNumberStatus } from "@/lib/prisma/generated";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { getUserByIdAction } from "@/actions/user.actions";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type PhoneNumberWithRelations = Prisma.PhoneNumberGetPayload<{
  include: {
    waba: true;
    messages: true;
  };
}>;

/**
 * 🔍 Find a phone number by its ID.
 */
export async function getPhoneNumberByIdAction(
  id: string,
): Promise<ActionResult<PhoneNumberWithRelations | null>> {
  try {
    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { id },
      include: {
        waba: true,
        messages: true,
      },
    });

    return {
      ok: true,
      data: phoneNumber,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * ✅ Validate that a phone number belongs to the user and is VERIFIED.
 */
export async function validatePhoneNumberOwnershipAction(
  phoneNumberId: string,
  userId: string,
): Promise<ActionResult<PhoneNumber>> {
  try {
    const userRes = await getUserByIdAction(userId, {
      waba: true,
    });

    if (!userRes.ok) {
      return {
        ok: false,
        error: userRes.error,
      };
    }

    const wabaId = userRes.data.waba?.id;

    if (!wabaId) {
      return {
        ok: false,
        error: "User has no WABA account",
      };
    }

    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: {
        id: phoneNumberId,
        wabaId,
        status: PhoneNumberStatus.VERIFIED,
      },
    });

    if (!phoneNumber) {
      return {
        ok: false,
        error: "Phone number not found or not verified",
      };
    }

    return {
      ok: true,
      data: phoneNumber,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * 🔍 Find a phone number by its actual number.
 */
export async function getPhoneNumberByNumberAction(
  phoneNumber: string,
): Promise<ActionResult<PhoneNumber | null>> {
  try {
    const result = await prisma.phoneNumber.findUnique({
      where: { phoneNumber },
    });

    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * 📦 Get all phone numbers for a given user.
 */
export async function getPhoneNumbersByUserAction(
  userId: string,
): Promise<ActionResult<PhoneNumberWithRelations[]>> {
  try {
    const userRes = await getUserByIdAction(userId, {
      waba: true,
    });

    if (!userRes.ok) {
      return {
        ok: false,
        error: userRes.error,
      };
    }

    const wabaId = userRes.data.waba?.id;

    if (!wabaId) {
      return {
        ok: true,
        data: [],
      };
    }

    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: { wabaId },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        messages: true,
        waba: true,
      },
    });

    return {
      ok: true,
      data: phoneNumbers,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * 📦 Get all phone numbers
 */
export async function getAllPhoneNumbersAction(): Promise<
  ActionResult<PhoneNumberWithRelations[]>
> {
  try {
    const phoneNumbers = await prisma.phoneNumber.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        messages: true,
        waba: true,
      },
    });

    return {
      ok: true,
      data: phoneNumbers,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * ➕ Create a new phone number record.
 */
export async function createPhoneNumberAction(
  data: Prisma.PhoneNumberCreateInput | Prisma.PhoneNumberUncheckedCreateInput,
): Promise<ActionResult<PhoneNumber>> {
  try {
    const phoneNumber = await prisma.phoneNumber.create({
      data,
    });

    return {
      ok: true,
      data: phoneNumber,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * ✏️ Update an existing phone number.
 */
export async function updatePhoneNumberAction(
  id: string,
  data: Prisma.PhoneNumberUpdateInput,
): Promise<ActionResult<PhoneNumber>> {
  try {
    const phoneNumber = await prisma.phoneNumber.update({
      where: { id },
      data,
    });

    return {
      ok: true,
      data: phoneNumber,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * 🗑️ Delete a phone number.
 */
export async function deletePhoneNumberAction(
  id: string,
): Promise<ActionResult<PhoneNumber>> {
  try {
    const phoneNumber = await prisma.phoneNumber.delete({
      where: { id },
    });

    return {
      ok: true,
      data: phoneNumber,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * 📊 Count verified phone numbers for a user.
 */
export async function countVerifiedPhoneNumbersAction(
  userId: string,
): Promise<ActionResult<number>> {
  try {
    const userRes = await getUserByIdAction(userId, {
      waba: true,
    });

    if (!userRes.ok) {
      return {
        ok: false,
        error: userRes.error,
      };
    }

    const wabaId = userRes.data.waba?.id;

    if (!wabaId) {
      return {
        ok: true,
        data: 0,
      };
    }

    const count = await prisma.phoneNumber.count({
      where: {
        wabaId,
        status: PhoneNumberStatus.VERIFIED,
      },
    });

    return {
      ok: true,
      data: count,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * ✅ Check if the user is within their plan phone-number limit.
 */
export async function checkPhoneNumberLimitAction(userId: string): Promise<
  ActionResult<{
    withinLimit: boolean;
    used: number;
    limit: number;
  }>
> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        cancelDate: null,
      },
      include: {
        product: { include: { lociPlan: true } },
      },
    });

    if (!subscription) {
      return {
        ok: false,
        error: "No active subscription found",
      };
    }

    const verifiedCountRes = await countVerifiedPhoneNumbersAction(userId);

    if (!verifiedCountRes.ok) {
      return {
        ok: false,
        error: verifiedCountRes.error,
      };
    }

    const verifiedCount = verifiedCountRes.data;

    if (!subscription.product.lociPlan) {
      throw new Error(
        `No subscription found in [subscription.product]: ${subscription.product}`,
      );
    }

    const allowed = subscription.product.lociPlan.maxPhoneNumbers;

    return {
      ok: true,
      data: {
        withinLimit: verifiedCount < allowed,
        used: verifiedCount,
        limit: allowed,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}
