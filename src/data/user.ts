/**
 * ============================================================
 * data/user.ts
 *
 * USER DATA ACCESS LAYER
 * ============================================================
 */

import "server-only";

import prisma from "@/lib/prisma";
import { buildResetUrlTail, generateResetToken } from "@/lib/utils/resetToken";
import {
  Prisma,
  UserRole,
  UserStatus,
  User,
  TemplateLanguage,
  TokenType,
  NotificationChannel,
} from "@/lib/prisma/generated";
import { sendMail } from "@/lib/mail";
import { welcomeEmail } from "@/lib/mail/email-render";
import { BANNER_IMAGE_URL, BASE_URL } from "@/lib/utils/getUrl";
import { compareHash, hash } from "@/lib/utils/passwordHandlers";
import whatsapp from "@/lib/whatsapp";
import { Message } from "@/lib/validations";
import { userInclude, type UserWithRelations } from "@/services/user/user.dto";

export function excludeFields<User, Key extends keyof User>(
  user: User,
  keys: Key[],
): Omit<User, Key> {
  const newUser = { ...user };
  for (const key of keys) {
    delete newUser[key];
  }
  return newUser;
}

/**
 * Creates a new user (doesnt send Welcome email)
 */
export async function createUser(
  data: Prisma.UserCreateInput | Prisma.UserUncheckedCreateInput,
): Promise<
  Prisma.UserGetPayload<{
    select: { id: true; name: true; email: true; tel: true };
  }>
> {
  console.log("Creating user... ", data);

  return await prisma.user.create({
    data,
    select: { id: true, name: true, email: true, tel: true },
  });
}

/**
 * Creates a new user, and sends Welcome email.
 */
export async function registerUser(
  data: (Prisma.UserCreateInput | Prisma.UserUncheckedCreateInput) & {
    verificationMethod?: NotificationChannel;
  },
): Promise<User & { verificationMethod: NotificationChannel }> {
  console.log("Registering user... ", data);
  let tokenSentTo: NotificationChannel | undefined = undefined;
  const { verificationMethod, name, email, tel, ...data_ } = data;

  if (!email && !tel) {
    throw new Error("Email or Phone No. is required");
  }

  const notificationChannel: NotificationChannel = verificationMethod
    ? verificationMethod
    : email
      ? NotificationChannel.EMAIL
      : NotificationChannel.SMS;
  let username: string;

  if (notificationChannel === NotificationChannel.EMAIL) {
    if (!email) throw new Error("No email provided");
    username = email;
  } else {
    if (!tel) throw new Error("No phone number provided");
    username = tel;
  }

  const tokenObj = await generateResetToken();

  const reseUrlTail = await buildResetUrlTail(tokenObj.plain, username);
  const resetLink = `${BASE_URL}/${reseUrlTail}`;

  const initUser = await prisma.user.create({
    data: {
      name,
      email,
      tel,
      ...data_,
      tokens: {
        create: {
          type: TokenType.RESET,
          hashedToken: tokenObj.hashed,
          expiresAt: tokenObj.expiry,
          description: "Password RESET token on signup",
          isActive: true,
        },
      },
    },
    include: {
      tokens: true,
    },
  });

  if (notificationChannel === NotificationChannel.EMAIL) {
    const emailToSend = await welcomeEmail(name || "", resetLink);
    await sendMail({
      to: email!,
      subject: "Welcome to Loci",
      html: emailToSend.html,
      text: emailToSend.text,
    });

    tokenSentTo = NotificationChannel.EMAIL;
  } else if (verificationMethod === NotificationChannel.WHATSAPP && tel) {
    const message: Message = {
      messaging_product: "whatsapp",
      recipient_type: "INDIVIDUAL",
      to: tel,
      type: "template",
      template: {
        name: "set_password",
        language: { code: TemplateLanguage.en_US },
        components: [
          {
            type: "header",
            parameters: [{ type: "image", image: { link: BANNER_IMAGE_URL } }],
          },
          {
            type: "body",
            parameters: [{ type: "text", parameter_name: "name", text: name }],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: reseUrlTail }],
          },
        ],
      },
    };

    console.log("Sending waba message template:", message);
    await whatsapp.sendTemplate(message);

    tokenSentTo = NotificationChannel.WHATSAPP;
  } else if (verificationMethod === NotificationChannel.SMS) {
    tokenSentTo = NotificationChannel.SMS;
  }

  if (!tokenSentTo) {
    throw new Error(`Username not verified: ${JSON.stringify(resetLink)}`);
  }

  return { ...initUser, verificationMethod: tokenSentTo };
}

/**
 * Get all users (paginated).
 */
export async function getAllUsers(
  skip = 0,
  take = 20,
): Promise<UserWithRelations[]> {
  return prisma.user.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: userInclude,
  });
}

/**
 * Get all admin users (paginated).
 */

type AdminUser = Prisma.UserGetPayload<{
  include: { waba: true };
}>;

export async function getAdminUsers(skip = 0, take = 20): Promise<AdminUser[]> {
  return prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      waba: true,
    },
  });
}

/**
 * Search users by name or email.
 */
export async function searchUsers(query: string): Promise<User[]> {
  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 50,
  });
}

/**
 * Count total users.
 */
export async function countUsers(): Promise<number> {
  return prisma.user.count();
}

/**
 * Find a user by a phoneNumberId (from the PhoneNumber model).
 */
export async function getUserByPhoneNumberId(
  phoneNumberId: string,
): Promise<Prisma.UserGetPayload<{ include: { waba: true } }> | null> {
  return prisma.user.findFirst({
    where: {
      waba: {
        phoneNumbers: {
          some: {
            id: phoneNumberId,
          },
        },
      },
    },
    include: {
      waba: true,
    },
  });
}

/* -----------------------------
 *  UPDATE
 * ----------------------------- */

/**
 * Update user details.
 */
export async function updateUser(
  id: string,
  data: Partial<
    Pick<User, "name" | "email" | "tel" | "image" | "role" | "status">
  >,
): Promise<Partial<User>> {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      tel: true,
      image: true,
      role: true,
      status: true,
    },
  });
}

/**
 * Update user password and clear the reset token.
 */
export async function updateUserPassword(
  id: string,
  passwordAttributes: {
    password?: string;
  },
): Promise<{ id: string; email: string | null; tel: string | null }> {
  // 1. Hash the password if provided
  const hashedPassword = passwordAttributes.password
    ? await hash(passwordAttributes.password)
    : undefined;

  // 2. Execute as a transaction
  return await prisma.$transaction(async (tx) => {
    // A. Update the user password
    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
      select: { id: true, email: true, tel: true },
    });

    // B. Delete the RESET token for this user
    // We use deleteMany instead of delete to avoid throwing an error
    // if the token was already deleted or expired.
    await tx.token.deleteMany({
      where: {
        userId: id,
        type: "RESET",
      },
    });

    return updatedUser;
  });
}

/**
 * Update (or Create) user reset token using an Upsert.
 * respects the @@unique([type, userId]) constraint in schema.
 */

/**
 * Update user status (e.g. ACTIVE, SUSPENDED).
 */
export async function updateUserStatus(
  id: string,
  status: UserStatus,
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { status },
  });
}

/**
 * Promote or demote user role.
 */
export async function updateUserRole(
  id: string,
  role: UserRole,
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { role },
  });
}

/* -----------------------------
 *  DELETE
 * ----------------------------- */

/**
 * Soft-delete (mark as INACTIVE).
 */
export async function deactivateUser(id: string): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { status: UserStatus.INACTIVE },
  });
}

/**
 * Permanently delete a user and cascade relations.
 */
export async function deleteUser(id: string): Promise<User> {
  return prisma.user.delete({ where: { id } });
}

/* -----------------------------
 *  RELATION HELPERS
 * ----------------------------- */

/**
 * Get user subscriptions with plan details.
 */
export async function getUserLociSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: {
      userId,
      product: { lociPlan: { isNot: null } },
      include: { product: { include: { lociPlan: true } } },
    },
  });
}
/**
 * Get all contacts for a user.
 */
export async function getUserContacts(userId: string) {
  return prisma.contact.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get user's messages (optionally filter by direction or status).
 */
export async function getUserMessages(
  userId: string,
  filter?: { direction?: string; status?: string },
) {
  return prisma.message.findMany({
    where: {
      userId,
      direction: filter?.direction as any,
      status: filter?.status as any,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Check if user has active subscription.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      startDate: { not: null },
    },
    orderBy: { startDate: "desc" },
  });
  if (!sub) return false;

  const now = new Date();
  const start = new Date(sub.startDate!);
  const end = new Date(start);

  end.setMonth(end.getMonth() + 1); // simplistic example — adjust for yearly plans

  return now < end;
}

/* -----------------------------
 *  UTILITIES
 * ----------------------------- */

/**
 * Bulk delete inactive users older than X days (e.g. cleanup job).
 */
export async function deleteInactiveUsers(olderThanDays: number) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  return prisma.user.deleteMany({
    where: {
      status: UserStatus.INACTIVE,
      updatedAt: { lt: cutoff },
    },
  });
}

/**
 * Get user with all deep relations (admin use).
 */
export async function getUserFullProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });
}
