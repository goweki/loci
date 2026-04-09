// // @/lib/prisma/seed/seed-users.ts

// import { removePlus } from "@/lib/utils/telHandlers";
// import { PrismaClient, UserRole, UserStatus } from "../generated";
// import bcrypt from "bcryptjs";

// // Example users data
// const usersData = [
//   {
//     name: "System User",
//     email: process.env.SYSTEM_EMAIL || "loci@goweki.com",
//     tel: process.env.SYSTEM_TEL || "254721334944",
//     password: process.env.SYSTEM_PASSWORD || "admin1234",
//     role: UserRole.ADMIN,
//     status: UserStatus.ACTIVE,
//   },
//   {
//     name: "Demo User",
//     email: "demo@goweki.com",
//     password: "pass1234",
//     role: UserRole.USER,
//     status: UserStatus.ACTIVE,
//   },
// ];

// export async function seedUsers(prisma: PrismaClient) {
//   console.log("👤 Seeding users...");

//   let createdCount = 0;
//   let skippedCount = 0;

//   for (const userData of usersData) {
//     try {
//       const existingUser = await prisma.user.findUnique({
//         where: { email: userData.email },
//       });

//       if (existingUser) {
//         console.log(`✔ User already exists: ${existingUser.email}`);
//         skippedCount++;
//         continue;
//       }

//       const hashedPassword = await bcrypt.hash(userData.password, 10);

//       const newUser = await prisma.user.create({
//         data: {
//           ...userData,
//           password: hashedPassword,
//         },
//       });

//       console.log(`➕ Created user: ${newUser.email} (${newUser.role})`);
//       createdCount++;
//     } catch (error) {
//       console.error(`❌ Error creating user ${userData.email}:`, error);
//       throw error; // Re-throw to stop seeding on error
//     }
//   }

//   console.log(
//     `✅ Users seeding completed: ${createdCount} created, ${skippedCount} skipped\n`,
//   );
// }

import { PrismaClient, UserRole, UserStatus, TokenType } from "../generated";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const usersData = [
  {
    name: "System User",
    email: process.env.SYSTEM_EMAIL || "loci@goweki.com",
    tel: process.env.SYSTEM_TEL || "254721334944",
    password: process.env.SYSTEM_PASSWORD || "admin1234",
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

        user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
        });

        console.log(`➕ Created user: ${user.email} (${user.role})`);
        createdCount++;
      } else {
        console.log(`✔ User already exists: ${user.email}`);
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
    console.log("🔑 API key already exists for admin");
    return;
  }

  // generate raw token (this is what you show ONCE)
  const rawToken = crypto.randomBytes(32).toString("hex");

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

  console.log("🔑 Admin API key created:");
  console.log("👉 SAVE THIS TOKEN NOW (won’t be shown again):");
  console.log(rawToken);
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
