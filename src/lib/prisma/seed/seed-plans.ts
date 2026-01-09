import { PrismaClient, PlanInterval, PlanName } from "../generated";

const featuresData = [
  {
    name: "Phone Numbers",
    description: "Number of WhatsApp phone numbers allowed",
    useMetric: "COUNT",
  },
  {
    name: "Messages",
    description: "Monthly message quota",
    useMetric: "COUNT",
  },
  {
    name: "Basic Templates",
    description: "Access to basic WhatsApp templates",
    useMetric: "BOOLEAN",
  },
  {
    name: "Email Support",
    description: "Email-based customer support",
    useMetric: "BOOLEAN",
  },
  {
    name: "Analytics",
    description: "Message & delivery analytics",
    useMetric: "BOOLEAN",
  },
  {
    name: "Automation",
    description: "Automation & auto-replies",
    useMetric: "BOOLEAN",
  },
  {
    name: "Priority Support",
    description: "Priority customer support",
    useMetric: "BOOLEAN",
  },
  {
    name: "Custom Integrations",
    description: "Custom API & system integrations",
    useMetric: "BOOLEAN",
  },
];

const plansData = [
  {
    name: PlanName.BASIC,
    description: "Best for individuals getting started",
    price: 2499,
    interval: PlanInterval.MONTHLY,
    maxPhoneNumbers: 1,
    maxMessagesPerMonth: 1000,
    popular: false,
    features: [
      { name: "Phone Numbers", limitUse: 1 },
      { name: "Messages", limitUse: 1000 },
      { name: "Basic Templates", enabled: true },
      { name: "Email Support", enabled: true },
      { name: "Analytics", enabled: false },
      { name: "Automation", enabled: false },
      { name: "Priority Support", enabled: false },
      { name: "Custom Integrations", enabled: false },
    ],
  },
  {
    name: PlanName.STANDARD,
    description: "Best for growing teams",
    price: 9999,
    interval: PlanInterval.MONTHLY,
    maxPhoneNumbers: 5,
    maxMessagesPerMonth: 10000,
    popular: true,
    features: [
      { name: "Phone Numbers", limitUse: 5 },
      { name: "Messages", limitUse: 10000 },
      { name: "Basic Templates", enabled: true },
      { name: "Email Support", enabled: true },
      { name: "Analytics", enabled: true },
      { name: "Automation", enabled: true },
      { name: "Priority Support", enabled: false },
      { name: "Custom Integrations", enabled: false },
    ],
  },
  {
    name: PlanName.PREMIUM,
    description: "For enterprises at scale",
    price: 49999,
    interval: PlanInterval.MONTHLY,
    maxPhoneNumbers: 999,
    maxMessagesPerMonth: 100000,
    popular: false,
    features: [
      { name: "Phone Numbers", configValue: "UNLIMITED" },
      { name: "Messages", configValue: "100000+" },
      { name: "Basic Templates", enabled: true },
      { name: "Email Support", enabled: true },
      { name: "Analytics", enabled: true },
      { name: "Automation", enabled: true },
      { name: "Priority Support", enabled: true },
      { name: "Custom Integrations", enabled: true },
    ],
  },
];

export async function seedPlans(prisma: PrismaClient) {
  console.log("📦 Seeding features...");

  for (const feature of featuresData) {
    await prisma.feature.upsert({
      where: { name: feature.name },
      update: {},
      create: feature,
    });
  }

  console.log("📦 Seeding plans & plan features...");

  for (const plan of plansData) {
    const dbPlan = await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        popular: plan.popular,
        maxPhoneNumbers: plan.maxPhoneNumbers,
        maxMessagesPerMonth: plan.maxMessagesPerMonth,
        active: true,
      },
    });

    for (const pf of plan.features) {
      const feature = await prisma.feature.findUnique({
        where: { name: pf.name },
      });

      if (!feature) continue;

      await prisma.planFeature.upsert({
        where: {
          planId_featureId: {
            planId: dbPlan.id,
            featureId: feature.id,
          },
        },
        update: {
          enabled: "enabled" in pf ? pf.enabled : true,
          limitUse: "limitUse" in pf ? pf.limitUse : null,
          configValue: "configValue" in pf ? pf.configValue : null,
        },
        create: {
          planId: dbPlan.id,
          featureId: feature.id,
          enabled: "enabled" in pf ? pf.enabled : true,
          limitUse: "limitUse" in pf ? pf.limitUse : null,
          configValue: "configValue" in pf ? pf.configValue : null,
        },
      });
    }

    console.log(`✔ Seeded plan: ${plan.name}`);
  }
}
