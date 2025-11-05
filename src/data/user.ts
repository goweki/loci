/**
 * ============================================================
 * data/user.ts
 *
 * USER DATA ACCESS LAYER
 * ============================================================
 */

"use server";

import db from "@/lib/prisma";
import { Prisma, UserRole, UserStatus, User } from "@prisma/client";

/**
 * Creates a new user.
 */
export async function createUser(data: {
  name?: string;
  email: string;
  role?: UserRole;
  password?: string;
  status?: UserStatus;
  image?: string;
}): Promise<User> {
  console.log("Creating user... ", data);

  return db.user.create({
    data: {
      name: data.name ?? null,
      email: data.email,
      password: data.password ?? null,
      image: data.image ?? null,
      role: data.role ?? UserRole.USER,
      status: data.status ?? UserStatus.ACTIVE,
    },
  });
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
  data: Partial<Pick<User, "name" | "email" | "image" | "role" | "status">>
): Promise<User> {
  return db.user.update({
    where: { id },
    data,
  });
}

/**
 * Update user password.
 */
export async function updateUserPassword(
  id: string,
  hashedPassword: string
): Promise<User> {
  return db.user.update({
    where: { id },
    data: { password: hashedPassword },
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
      AutoReplyRule: true,
    },
  });
}
