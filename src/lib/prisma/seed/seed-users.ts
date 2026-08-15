// import { generateUniqueUsernameFromSeed } from "../../utils/username";
import { PrismaClient, UserRole, UserStatus, TokenType } from "../generated";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "..";

/**
 * Generates a unique username based on base string by appending a random 5-digit number.
 * Automatically checks the database to prevent collisions.
 * * @param seed - A string base
 * @returns A guaranteed unique string username (e.g., "loci65757")
 */
async function generateUniqueUsernameFromSeed(seed: string): Promise<string> {
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

const usersData = [
  {
    name: "System User",
    email: process.env.SYSTEM_EMAIL || "system@goweki.com",
    tel: process.env.SYSTEM_TEL,
    password: process.env.SYSTEM_PASSWORD || "pass1234",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Demo User",
    email: "demo@goweki.com",
    password: "pass1234",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  },
];

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function seedUsers(prisma: PrismaClient) {
  console.log("👤 Seeding users...");

  let createdCount = 0;
  let skippedCount = 0;

  for (const userData of usersData) {
    try {
      let user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const username = await generateUniqueUsernameFromSeed(userData.name);

        user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
            username,
          },
        });

        console.log(` ➕ ✔ ${user.role} created: ${user.email}`);
        createdCount++;
      } else {
        console.log(` ✔ ${user.role} already exists: ${user.email}`);
        skippedCount++;
      }

      // 🔥 ONLY FOR ADMIN → ensure API KEY
      if (user.role === UserRole.ADMIN) {
        await ensureApiKey(prisma, user.id);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
      throw error;
    }
  }

  console.log(
    `✅ Users seeding completed: ${createdCount} created, ${skippedCount} skipped\n`,
  );
}

async function ensureApiKey(prisma: PrismaClient, userId: string) {
  // check if already exists (idempotent)
  const existing = await prisma.token.findUnique({
    where: {
      type_userId: {
        type: TokenType.API_KEY,
        userId,
      },
    },
  });

  if (existing) {
    console.log(" 🔑 API key already exists for admin");
    return;
  }

  // generate raw token (this is what you show ONCE)
  const rawToken = `loc_A_${crypto.randomBytes(32).toString("hex")}`;

  // hash it before storing
  const hashedToken = hashToken(rawToken);

  await prisma.token.create({
    data: {
      type: TokenType.API_KEY,
      hashedToken,
      userId,
      description: "Default admin API key",
      expiresAt: new Date("2999-12-31"), // effectively no expiry
    },
  });

  console.log(" 🔑 Admin API key created:");
  console.log(" 👉 SAVE THIS TOKEN NOW (won’t be shown again):");
  console.log(rawToken);
}
