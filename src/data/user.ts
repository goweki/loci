/**
 * ============================================================
 * data/user.ts
 *
 * USER DATA ACCESS LAYER
 * ============================================================
 */

"use server";

import db from "@/lib/prisma";
import { buildResetURL, generateResetToken } from "@/lib/utils/resetToken";
import { Prisma, UserRole, UserStatus, User } from "@prisma/client";
import { sendMail } from "@/lib/mail";
import { welcomeEmail, resetPasswordEmail } from "@/lib/mail/email-render";
import { BASE_URL } from "@/lib/utils/getUrl";
import processError from "@/lib/utils/processError";
import { hash } from "@/lib/utils/passwordHandlers";
import sendSms, { SMSprops } from "@/lib/sms";

/**
 * Creates a new user (doesnt send Welcome email)
 */
export async function createUser(
  data: Prisma.UserCreateInput | Prisma.UserUncheckedCreateInput
): Promise<Pick<User, "id" | "name" | "email" | "tel">> {
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
  let verificationMethod_: "email" | "whatsapp" | "sms" = undefined;
  const { verificationMethod, ...data_ } = data;
  const { name, email, tel } = data;

  if (!email && !tel) {
    throw new Error("Email or Phone No. is required");
  }

  const tokenObj = await generateResetToken();
  const resetLink = await buildResetURL(BASE_URL, tokenObj.plain, email || tel);

  try {
    const initUser = await db.user.create({
      data: {
        ...data_,
        resetToken: tokenObj.hashed,
        resetTokenExpiry: tokenObj.expiry.toISOString(),
      },
    });

    if (email) {
      const emailToSend = await welcomeEmail(name, resetLink);
      await sendMail({
        to: email,
        subject: "Welcome to Loci",
        html: emailToSend.html,
        text: emailToSend.text,
      });
      verificationMethod_ = "email";
    } else if (verificationMethod === "whatsapp" && tel) {
      verificationMethod_ = "whatsapp";
    } else if (verificationMethod === "sms") {
      verificationMethod_ = "sms";
    }

    return { ...initUser, verificationMethod: verificationMethod_ };
  } catch (error) {
    const err = processError(error);
    console.error("User registration failed: ", err);
    throw new Error(err.message);
  }
}

/**
 * Creates a new user, and sends Welcome email.
 */
export async function sendResetLink(data: {
  username: string;
  sendTo?: "email" | "whatsapp" | "sms";
  template?: "welcome" | "resetPassword";
}): Promise<{
  username: string;
  sentTo: "email" | "whatsapp" | "sms";
}> {
  const {
    username,
    sendTo: verificationMethod,
    template: emailTemplate,
  } = data;
  console.log(`Generating ResetToken for: ${username}`);

  if (!username) {
    throw new Error("A username is required");
  }

  const user_ = await getUserByKey(username);
  if (!user_) {
    throw new Error("User not found");
  }
  const usernameAttribute = user_.email === username ? "email" : "tel";
  const tokenObj = await generateResetToken();
  const resetLink = await buildResetURL(BASE_URL, tokenObj.plain, username);

  try {
    const userUpdates = {
      resetToken: tokenObj.plain,
      resetTokenExpiry: tokenObj.expiry,
    };
    await updateUserPassword(user_.id, userUpdates);

    let sentTo_: "email" | "whatsapp" | "sms" = undefined;
    const emailGenFunction =
      emailTemplate === "welcome" ? welcomeEmail : resetPasswordEmail;
    const emailToSend = await emailGenFunction(user_.name, resetLink);
    const subject_ =
      emailTemplate === "welcome" ? "Welcome to Loci" : "Reset Password: Loci";

    if (usernameAttribute === "email") {
      await sendMail({
        to: user_.email,
        subject: subject_,
        html: emailToSend.html,
        text: emailToSend.text,
      });
      sentTo_ = "email";
    } else if (verificationMethod === "whatsapp" && user_.tel) {
      sentTo_ = "whatsapp";
    } else if (verificationMethod === "sms" && user_.tel) {
      const options_: SMSprops = {
        to: user_.tel,
        message: emailToSend.text,
      };
      await sendSms(options_);
    }

    return { username, sentTo: sentTo_ };
  } catch (error) {
    const err = processError(error);
    console.error("Sending reset link failed: ", err);
    throw new Error(err.message);
  }
}

/**
 * verify token.
 */
export async function verifyToken(data: {
  token: string;
  username: string;
}): Promise<Pick<User, "id" | "name" | "email" | "tel">> {
  const { token, username } = data;

  console.log(`verifying token for user: ${username} `);

  try {
    const user = await getUserByKey(username);

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      console.error("Invalid token");
      return null;
    }

    if (user.resetTokenExpiry < new Date()) {
      console.error("Expired link. Reset password to get new link");
      return null;
    }

    return user;
  } catch (error) {
    const err = processError(error);
    console.error("Token verification failed: ", err);
    throw new Error(err.message);
  }
}

/**
 * Find a user by ID.
 */
export async function getUserById(id: string): Promise<User | null> {
  return db.user.findUnique({
    where: { id },
    include: {
      subscriptions: { include: { plan: true } },
      phoneNumbers: true,
      contacts: true,
      messages: true,
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
      OR: [{ email: key }, { id: key }],
    },
  });
}

/**
 * Get all users (paginated).
 */
export async function getAllUsers(skip = 0, take = 20): Promise<User[]> {
  return db.user.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
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
    data: {
      ...passwordAttributes,
    },
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
      phoneNumbers: true,
      contacts: true,
      messages: true,
      AutoReplyRules: true,
    },
  });
}
