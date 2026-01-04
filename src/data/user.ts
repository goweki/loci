/**
 * ============================================================
 * data/user.ts
 *
 * USER DATA ACCESS LAYER
 * ============================================================
 */

"use server";

import db from "@/lib/prisma";
import { buildResetUrlTail, generateResetToken } from "@/lib/utils/resetToken";
import {
  Prisma,
  UserRole,
  UserStatus,
  User,
  TemplateLanguage,
} from "@/lib/prisma/generated";
import { sendMail } from "@/lib/mail";
import { welcomeEmail, resetPasswordEmail } from "@/lib/mail/email-render";
import { BANNER_IMAGE_URL, BASE_URL } from "@/lib/utils/getUrl";
import { compareHash, hash } from "@/lib/utils/passwordHandlers";
import sendSms, { SMSprops } from "@/lib/sms";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import whatsapp from "@/lib/whatsapp";
import { Message } from "@/lib/validations";

export type UserGetPayload = Prisma.UserGetPayload<{
  include: {
    contacts: true;
    messages: true;
    subscriptions: { include: { plan: true } };
    waba: { include: { phoneNumbers: true; templates: true } };
  };
}>;

/**
 * Creates a new user (doesnt send Welcome email)
 */
export async function createUser(
  data: Prisma.UserCreateInput | Prisma.UserUncheckedCreateInput
): Promise<
  Prisma.UserGetPayload<{
    select: { id: true; name: true; email: true; tel: true };
  }>
> {
  console.log("Creating user... ", data);

  return await db.user.create({
    data,
    select: { id: true, name: true, email: true, tel: true },
  });
}

/**
 * Creates a new user, and sends Welcome email.
 */
export async function registerUser(
  data: (Prisma.UserCreateInput | Prisma.UserUncheckedCreateInput) & {
    verificationMethod?: "email" | "whatsapp" | "sms";
  }
): Promise<User & { verificationMethod: "email" | "whatsapp" | "sms" }> {
  console.log("Registering user... ", data);
  let tokenSentTo: "email" | "whatsapp" | "sms" | undefined = undefined;
  const { verificationMethod, ...data_ } = data;
  const { name, email, tel } = data;

  const tokenObj = await generateResetToken();

  const username = email || tel;
  if (!username) {
    throw new Error("Email or Phone No. is required");
  }

  const reseUrlTail = await buildResetUrlTail(tokenObj.plain, username);
  const resetLink = `${BASE_URL}/${reseUrlTail}`;

  try {
    const initUser = await db.user.create({
      data: {
        ...data_,
        resetToken: tokenObj.hashed,
        resetTokenExpiry: tokenObj.expiry.toISOString(),
      },
    });

    if (email) {
      const emailToSend = await welcomeEmail(name || "", resetLink);
      await sendMail({
        to: email,
        subject: "Welcome to Loci",
        html: emailToSend.html,
        text: emailToSend.text,
      });

      tokenSentTo = "email";
    } else if (verificationMethod === "whatsapp" && tel) {
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
              parameters: [
                { type: "image", image: { link: BANNER_IMAGE_URL } },
              ],
            },
            {
              type: "body",
              parameters: [
                { type: "text", parameter_name: "name", text: name },
              ],
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

      tokenSentTo = "whatsapp";
    } else if (verificationMethod === "sms") {
      tokenSentTo = "sms";
    }

    if (!tokenSentTo) {
      throw new Error(`Username not verified:${JSON.stringify(resetLink)}`);
    }

    return { ...initUser, verificationMethod: tokenSentTo };
  } catch (error) {
    console.error("User registration failed: ", error);
    const errorMessage = getFriendlyErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Creates a new user, and sends Welcome email.
 */
export async function sendResetLink(data: {
  username: string;
  sendTo?: "email" | "whatsapp" | "sms";
}): Promise<{
  username: string;
  sentTo: "email" | "whatsapp" | "sms";
}> {
  const { username, sendTo: verificationMethod } = data;
  console.log(`Generating ResetToken for: ${username}`);

  if (!username) {
    throw new Error("No username provided in generating resetToken");
  }

  const user_ = await getUserByKey(username);
  if (!user_) {
    throw new Error(`User not found - ${username}`);
  }
  const usernameAttribute = user_.email === username ? "email" : "tel";
  const tokenObj = await generateResetToken();
  const resetLinkTail = await buildResetUrlTail(tokenObj.plain, username);
  const resetLink = `${BASE_URL}/${resetLinkTail}`;

  try {
    const userUpdates = {
      resetToken: tokenObj.hashed,
      resetTokenExpiry: tokenObj.expiry,
    };
    await updateUserPassword(user_.id, userUpdates);

    let sentTo_: "email" | "whatsapp" | "sms" | undefined = undefined;

    if (usernameAttribute === "email" && user_.email) {
      const emailToSend = await resetPasswordEmail(user_.name || "", resetLink);
      await sendMail({
        to: user_.email,
        subject: "Reset Password: LOCi",
        html: emailToSend.html,
        text: emailToSend.text,
      });

      sentTo_ = "email";
    } else if (verificationMethod === "whatsapp" && user_.tel) {
      const message: Message = {
        messaging_product: "whatsapp",
        recipient_type: "INDIVIDUAL",
        to: user_.tel,
        type: "template",
        template: {
          name: "reset_account_password",
          language: { code: TemplateLanguage.en_US },
          components: [
            {
              type: "header",
              parameters: [
                { type: "image", image: { link: BANNER_IMAGE_URL } },
              ],
            },
            {
              type: "body",
              parameters: [
                { type: "text", parameter_name: "name", text: user_.name },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0", // first button
              parameters: [{ type: "text", text: resetLinkTail }],
            },
          ],
        },
      };

      await whatsapp.sendTemplate(message);
      sentTo_ = "whatsapp";
    } else if (verificationMethod === "sms" && user_.tel) {
      const emailToSend = await resetPasswordEmail(user_.name || "", resetLink);
      const options_: SMSprops = {
        to: user_.tel,
        message: emailToSend.text,
      };
      await sendSms(options_);
      sentTo_ = "sms";
    }

    if (!sentTo_) {
      throw new Error(`Message not sent to ${username}`);
    }

    return { username, sentTo: sentTo_ };
  } catch (error) {
    console.error("Sending reset link failed: ", error);
    const errorMessage = getFriendlyErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * verify token.
 */
export async function verifyToken(data: {
  token: string;
  username: string;
}): Promise<{
  verification: boolean;
  user?: Pick<User, "id" | "name" | "email" | "tel">;
  message: string;
}> {
  const { token, username } = data;

  console.log(`verifying token for user: ${username} \ntoken:${token}\n`);

  const user = await getUserByKey(username);
  if (!user || !user.resetToken || !user.resetTokenExpiry) {
    return { verification: false, message: "Invalid link" };
  }

  if (!(await compareHash(token, user.resetToken))) {
    return { verification: false, message: "Invalid token" };
  }

  if (user.resetTokenExpiry < new Date()) {
    return { verification: false, message: "Expired token" };
  }

  return { verification: true, user, message: "Valid token" };
}

/**
 * Find a user by ID.
 */
export async function getUserById(id: string): Promise<UserGetPayload | null> {
  return db.user.findUnique({
    where: { id },
    include: {
      contacts: true,
      messages: true,
      waba: {
        include: {
          phoneNumbers: true,
          templates: true,
        },
      },
      subscriptions: {
        where: {
          cancelDate: null,
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });
}

/**
 * Find a user by email.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return db.user.findUnique({ where: { email } });
}

/**
 * Find a user by tel.
 */
export async function getUserByTel(tel: string): Promise<User | null> {
  return db.user.findUnique({ where: { tel } });
}

/**
 * Find a user by key attribute.
 */
export async function getUserByKey(key: string): Promise<User | null> {
  return db.user.findFirst({
    where: {
      OR: [{ id: key }, { email: key }, { tel: key }],
    },
  });
}

/**
 * Get all users (paginated).
 */
export async function getAllUsers(
  skip = 0,
  take = 20
): Promise<UserGetPayload[]> {
  return db.user.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      contacts: true,
      messages: true,
      subscriptions: { include: { plan: true } },
      waba: { include: { phoneNumbers: true, templates: true } },
    },
  });
}

/**
 * Get all admin users (paginated).
 */

type AdminUser = Prisma.UserGetPayload<{
  include: { waba: true };
}>;

export async function getAdminUsers(skip = 0, take = 20): Promise<AdminUser[]> {
  return db.user.findMany({
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
  return db.user.findMany({
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
  return db.user.count();
}

/**
 * Find a user by a phoneNumberId (from the PhoneNumber model).
 */
export async function getUserByPhoneNumberId(
  phoneNumberId: string
): Promise<Prisma.UserGetPayload<{ include: { waba: true } }> | null> {
  return db.user.findFirst({
    where: {
      waba: {
        phoneNumbers: {
          some: {
            phoneNumberId,
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
  >
): Promise<Partial<User>> {
  return db.user.update({
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
 * Update user password.
 */

export async function updateUserPassword(
  id: string,
  passwordAttributes: {
    password?: string;
    resetToken?: string | null;
    resetTokenExpiry?: Date | null;
  }
): Promise<Partial<User>> {
  if (passwordAttributes.password) {
    passwordAttributes.password = await hash(passwordAttributes.password);
  }

  return db.user.update({
    where: { id },
    data: passwordAttributes,
    select: { id: true, email: true, tel: true },
  });
}

/**
 * Update user status (e.g. ACTIVE, SUSPENDED).
 */
export async function updateUserStatus(
  id: string,
  status: UserStatus
): Promise<User> {
  return db.user.update({
    where: { id },
    data: { status },
  });
}

/**
 * Promote or demote user role.
 */
export async function updateUserRole(
  id: string,
  role: UserRole
): Promise<User> {
  return db.user.update({
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
  return db.user.update({
    where: { id },
    data: { status: UserStatus.INACTIVE },
  });
}

/**
 * Permanently delete a user and cascade relations.
 */
export async function deleteUser(id: string): Promise<User> {
  return db.user.delete({ where: { id } });
}

/* -----------------------------
 *  RELATION HELPERS
 * ----------------------------- */

/**
 * Get user subscriptions with plan details.
 */
export async function getUserSubscriptions(userId: string) {
  return db.subscription.findMany({
    where: { userId },
    include: { plan: true, payments: true },
  });
}

/**
 * Get all phone numbers belonging to a user.
 */
export async function getUserPhoneNumbers(userId: string) {
  return db.phoneNumber.findMany({ where: { userId } });
}

/**
 * Get all contacts for a user.
 */
export async function getUserContacts(userId: string) {
  return db.contact.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get user's messages (optionally filter by direction or status).
 */
export async function getUserMessages(
  userId: string,
  filter?: { direction?: string; status?: string }
) {
  return db.message.findMany({
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
  const sub = await db.subscription.findFirst({
    where: { userId },
    orderBy: { startDate: "desc" },
  });
  if (!sub) return false;

  const now = new Date();
  const start = new Date(sub.startDate);
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
  return db.user.deleteMany({
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
  return db.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: { include: { plan: true, payments: true } },
      waba: true,
      contacts: true,
      messages: true,
      autoreplyRules: true,
    },
  });
}
