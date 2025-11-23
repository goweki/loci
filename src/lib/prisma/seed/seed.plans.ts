import { PrismaClient, PlanInterval, PlanName } from "@/lib/prisma/generated";

const prisma = new PrismaClient();

const plansData = [
  {
    name: PlanName.BASIC,
    price: 100,
    interval: PlanInterval.MONTHLY,
    maxPhoneNumbers: 1,
    maxMessagesPerMonth: 100,
    active: true,
  },
  {
    name: PlanName.STANDARD,
    price: 500,
    interval: PlanInterval.MONTHLY,
    maxPhoneNumbers: 5,
    maxMessagesPerMonth: 1000,
    active: true,
  },
];

export async function seedPlans() {
  console.log("📦 Seeding plans...");

  for (const plan of plansData) {
    const exists = await prisma.plan.findUnique({ where: { name: plan.name } });
    if (!exists) {
      await prisma.plan.create({ data: plan });
      console.log("➕ Created plan:", plan.name);
    } else {
      console.log("✔ Plan already exists:", plan.name);
    }
  }
}
