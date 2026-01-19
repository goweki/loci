// @/lib/prisma/seed/seed-users.ts

import { removePlus } from "@/lib/utils/telHandlers";
import { PrismaClient, UserRole, UserStatus } from "../generated";
import bcrypt from "bcryptjs";

// Example users data
const usersData = [
  {
    name: "System Users",
    email: process.env.SYSTEM_EMAIL || "loci@goweki.com",
    tel: process.env.SYSTEM_TEL
      ? removePlus(process.env.SYSTEM_TEL)
      : "254721334944",
    password: process.env.SYSTEM_PASSWORD || "admin1234",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Demo User",
    email: "demo@goweki.com",
    password: "user1234",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  },
];

export async function seedUsers(prisma: PrismaClient) {
  console.log("👤 Seeding users...");

  let createdCount = 0;
  let skippedCount = 0;

  for (const userData of usersData) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`✔ User already exists: ${existingUser.email}`);
        skippedCount++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });

      console.log(`➕ Created user: ${newUser.email} (${newUser.role})`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
      throw error; // Re-throw to stop seeding on error
    }
  }

  console.log(
    `✅ Users seeding completed: ${createdCount} created, ${skippedCount} skipped\n`,
  );
}
