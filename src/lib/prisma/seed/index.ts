// @/lib/prisma/seed.ts

import prisma from "..";
import { seedUsers } from "./seed-users";
import { seedPlans } from "./seed-plans";

async function main() {
  console.log("🌱 Starting database seeding...\n");

  try {
    await seedUsers(prisma);
    await seedPlans(prisma);

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
