import "server-only";

// import { getLociSubscriptionStatusByUserId } from "@/data/subscription";
import { checkMessageLimits } from "../usage/limits";
// import { validatePhoneNumberOwnershipAction } from "@/data/phoneNumber";
import {
  MessageType,
  PhoneNumber,
  PhoneNumberStatus,
  SubscriptionStatus,
  UserRole,
} from "../prisma/generated";
import { Message } from "../validations";
import { ApiError, getFriendlyErrorMessage } from "../utils/errorHandlers";
import { getUserByKeyAction } from "@/actions/user.actions";
import { ActionResult, SubscriptionStatusCheck } from "@/types";
import { SubscriptionService } from "@/services/subscription/subscription.service";
import { UserService } from "@/services/user/user.service";
import prisma from "../prisma";

export async function authorizeMessageSend(userId: string, message: Message) {
  console.log(`[AUTHORIZING]: ${userId}`);
  const userRes = await getUserByKeyAction(userId);

  if (!userRes.ok) {
    throw new Error("[AUTHORIZING]: user not found ");
  }

  // if actor is admin
  if (userRes.data.role === UserRole.ADMIN) {
    return;
  }

  console.log(`[AUTHORIZING]: user role is - ${userRes.data.role}`);

  const resPhoneOwnership = message.phoneNumberId
    ? await validatePhoneNumberOwnershipAction(message.phoneNumberId, userId)
    : null;

  if (resPhoneOwnership && !resPhoneOwnership?.ok) {
    throw new Error(resPhoneOwnership?.error);
  }

  const [subscription, limits] = await Promise.all<
    [Promise<SubscriptionStatusCheck>, ReturnType<typeof checkMessageLimits>]
  >([
    SubscriptionService.getSubscriptionByUserId(userId),
    checkMessageLimits(userId),
  ]);

  if (
    subscription.status !== SubscriptionStatus.ACTIVE &&
    message.type !== MessageType.TEMPLATE
  ) {
    throw new ApiError(403, "Active subscription required");
  }

  if (!limits.allowed) {
    throw new ApiError(403, "Usage Limit exceeded");
  }

  console.log("[AUTHORIZATION PASSED]");
}

/**
 * ✅ Validate that a phone number belongs to the user and is VERIFIED.
 */
export async function validatePhoneNumberOwnershipAction(
  phoneNumberId: string,
  userId: string,
): Promise<ActionResult<PhoneNumber>> {
  try {
    const user = await UserService.getUserByKey(userId, {
      waba: true,
    });

    if (!user) {
      return {
        ok: false,
        error: "User not found",
      };
    }

    const wabaId = user.waba?.id;

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
