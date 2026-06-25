import "server-only";

import { getSubscriptionStatusByUserId } from "@/data/subscription";
import { checkMessageLimits } from "../usage/limits";
import { validatePhoneNumberOwnershipAction } from "@/data/phoneNumber";
import { SubscriptionStatusEnum } from "@/types";
import { MessageType, UserRole } from "../prisma/generated";
import { Message } from "../validations";
import { ApiError } from "../utils/errorHandlers";
import { getUserByKeyAction } from "@/actions/user.actions";

export async function authorizeMessageSend(userId: string, message: Message) {
  const userRes = await getUserByKeyAction(userId);

  // if actor is admin
  if (userRes.ok && userRes.data.role === UserRole.ADMIN) {
    return;
  }

  const [subscription, limits] = await Promise.all([
    getSubscriptionStatusByUserId(userId),
    checkMessageLimits(userId),
    message.phoneNumberId
      ? validatePhoneNumberOwnershipAction(message.phoneNumberId, userId)
      : Promise.resolve(),
  ]);

  if (
    subscription.status !== SubscriptionStatusEnum.ACTIVE &&
    message.type !== MessageType.TEMPLATE
  ) {
    throw new ApiError(403, "Active subscription required");
  }

  if (!limits.allowed) {
    throw new ApiError(403, "Usage Limit exceeded");
  }
}
