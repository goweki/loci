import "dotenv/config";
import { PrismaClient } from "../generated";

import { seedUsers } from "./seed-users";
import { seedPlans } from "./seed.plans";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  await seedUsers();
  await seedPlans();

  console.log("🌱 Database seeding completed!");
}

main()
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
