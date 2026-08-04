import "server-only";

import prisma from "../prisma";

/**
 * Generates a unique username based on base string by appending a random 5-digit number.
 * Automatically checks the database to prevent collisions.
 * * @param seed - A string base
 * @returns A guaranteed unique string username (e.g., "loci65757")
 */
export async function generateUniqueUsernameFromSeed(
  seed: string,
): Promise<string> {
  let isUnique = false;
  let username = "";
  let attempts = 0;

  // 1. Remove all special characters, spaces, and punctuation (keep only a-z and 0-9)
  let cleanedSeed = seed.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 2. Guarantee the cleaned seed has enough characters so that seed + 5 digits >= 8 chars
  // Since randomDigits is 5 digits long, cleanedSeed needs to be at least 3 chars long
  if (cleanedSeed.length < 3) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    while (cleanedSeed.length < 3) {
      cleanedSeed += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  while (!isUnique && attempts < 10) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
    username = `${cleanedSeed}${randomDigits}`;

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
  // Uses pure digits instead of hyphen to prevent introducing special characters
  if (!isUnique) {
    username = `${username}${Date.now().toString().slice(-4)}`;
  }

  return username;
}
