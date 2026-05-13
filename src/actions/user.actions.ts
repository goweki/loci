"use server";

import {
  NotificationChannel,
  Prisma,
  TokenType,
  UserRole,
} from "@/lib/prisma/generated";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { BASE_URL } from "@/lib/utils/getUrl";
import { buildResetUrlTail, generateResetToken } from "@/lib/utils/resetToken";
import { UserService } from "@/services/user/user.service";
import { ActionResult } from "@/types";

/**
 * sends link to reset password.
 */
export async function sendResetLink(data: {
  username: string;
  sendTo?: NotificationChannel;
}): Promise<
  ActionResult<{
    username: string;
    sentTo: NotificationChannel;
  }>
> {
  try {
    const resSend = await UserService.sendResetLink(data);

    return { ok: true, data: resSend };
  } catch (error) {
    const errorMessage = getFriendlyErrorMessage(error);
    return { ok: false, error: errorMessage };
  }
}

// ======================================================
// USER ACTIONS
// ======================================================

export async function getAdminUserAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof UserService.getAdminUser>>>
> {
  try {
    const user = await UserService.getAdminUser();

    return {
      ok: true,
      data: user,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getUserByKeyAction<
  T extends Prisma.UserInclude | undefined = undefined,
>(
  key: string,
  include?: T,
): Promise<
  ActionResult<
    Prisma.UserGetPayload<T extends Prisma.UserInclude ? { include: T } : {}>
  >
> {
  try {
    const user = await UserService.getUserByKey(key, include);

    return {
      ok: true,
      data: user,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getUsersAction(params?: {
  search?: string;
  limit?: number;
  cursor?: string;
  role?: UserRole;
}): Promise<ActionResult<Awaited<ReturnType<UserService["getUsers"]>>>> {
  try {
    const service = await UserService.create();

    const users = await service.getUsers(params);

    return {
      ok: true,
      data: users,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getUserByIdAction<
  T extends Prisma.UserInclude | undefined = undefined,
>(
  userId: string,
  include?: T,
): Promise<
  ActionResult<
    Prisma.UserGetPayload<T extends Prisma.UserInclude ? { include: T } : {}>
  >
> {
  try {
    const service = await UserService.create();

    const user = await service.getUserById(userId, include);

    return {
      ok: true,
      data: user,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getUserStatsAction(): Promise<
  ActionResult<Awaited<ReturnType<UserService["getUserStats"]>>>
> {
  try {
    const service = await UserService.create();

    const stats = await service.getUserStats();

    return {
      ok: true,
      data: stats,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

// ======================================================
// PASSWORD RESET ACTIONS
// ======================================================

export async function sendResetLinkAction(params: {
  username: string;
  sendTo?: NotificationChannel;
}): Promise<
  ActionResult<Awaited<ReturnType<typeof UserService.sendResetLink>>>
> {
  try {
    const result = await UserService.sendResetLink(params);

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

export async function verifyResetTokenAction(params: {
  username: string;
  token: string;
}): Promise<ActionResult<Awaited<ReturnType<typeof UserService.verifyToken>>>> {
  try {
    const result = await UserService.verifyToken({
      username: params.username,
      token: params.token,
      type: TokenType.RESET,
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

// ======================================================
// GENERIC TOKEN VERIFICATION
// ======================================================

export async function verifyTokenAction(params: {
  username: string;
  token: string;
  type: TokenType;
}): Promise<ActionResult<Awaited<ReturnType<typeof UserService.verifyToken>>>> {
  try {
    const result = await UserService.verifyToken(params);

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
