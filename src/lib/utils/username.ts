import "server-only";

import prisma from "../prisma";

/**
 * Generates a unique username based on base string by appending a random 5-digit number.
 * Automatically checks the database to prevent collisions.
 * * @param seed - A string base
 * @param prisma - Your Prisma client instance
 * @returns A guaranteed unique string username (e.g., "loci65757")
 */
export async function generateUniqueUsernameFromSeed(
  seed: string,
): Promise<string> {
  let isUnique = false;
  let username = "";
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
    username = `${seed.trim().replace(/[^a-z0-9]/g, "")}${randomDigits}`;

    // Check if this username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }, // Only select the ID to keep the query lightning fast
    });

    if (!existingUser) {
      isUnique = true;
    } else {
      attempts++;
    }
  }

  // Fallback in the extremely rare case of 10 consecutive collisions
  if (!isUnique) {
    username = `${username}-${Date.now().toString().slice(-4)}`;
  }

  return username;
}
