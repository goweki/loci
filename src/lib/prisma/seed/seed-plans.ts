import { PrismaClient, PlanInterval, PlanName } from "../generated";

const featuresData = [
  // Communication Core
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

  // CRM / Contacts
  {
    name: "Contacts",
    description: "Maximum customer contacts",
    useMetric: "COUNT",
  },

  // Ecommerce
  {
    name: "Products",
    description: "Maximum inventory products",
    useMetric: "COUNT",
  },
  {
    name: "Orders",
    description: "Monthly order processing",
    useMetric: "COUNT",
  },
  {
    name: "Payment Links",
    description: "Generate payment links for customers",
    useMetric: "BOOLEAN",
  },

  // Messaging
  {
    name: "WhatsApp Templates",
    description: "Access to WhatsApp templates",
    useMetric: "BOOLEAN",
  },
  {
    name: "Bulk Messaging",
    description: "Send campaigns to many contacts",
    useMetric: "BOOLEAN",
  },

  // Automation
  {
    name: "Automation",
    description: "Automation & auto-replies",
    useMetric: "BOOLEAN",
  },
  {
    name: "AI Chatbot",
    description: "AI powered chatbot assistant",
    useMetric: "BOOLEAN",
  },

  // Analytics
  {
    name: "Analytics",
    description: "Business analytics & reporting",
    useMetric: "BOOLEAN",
  },

  // Support
  {
    name: "Email Support",
    description: "Email-based customer support",
    useMetric: "BOOLEAN",
  },
  {
    name: "Priority Support",
    description: "Priority customer support",
    useMetric: "BOOLEAN",
  },

  // Enterprise
  {
    name: "Custom Integrations",
    description: "Custom API & system integrations",
    useMetric: "BOOLEAN",
  },
];

const plansData = [
  {
    id: PlanName.BASIC,
    name: PlanName.BASIC,
    description: "For solo businesses and startups",
    price: 2499,
    interval: PlanInterval.MONTHLY,
    maxPhoneNumbers: 1,
    maxMessagesPerMonth: 1000,
    popular: false,

    features: [
      { name: "Phone Numbers", limitUse: 1 },
      { name: "Messages", limitUse: 1000 },
      { name: "Contacts", limitUse: 500 },
      { name: "Products", limitUse: 25 },
      { name: "Orders", limitUse: 100 },

      { name: "Payment Links", enabled: true },

      { name: "WhatsApp Templates", enabled: true },

      { name: "Bulk Messaging", enabled: false },

      { name: "Automation", enabled: false },
      { name: "AI Chatbot", enabled: false },

      { name: "Analytics", enabled: false },

      { name: "Email Support", enabled: true },
      { name: "Priority Support", enabled: false },

      { name: "Custom Integrations", enabled: false },
    ],
  },
  {
    id: PlanName.STANDARD,
    name: PlanName.STANDARD,
    description: "For growing teams and online businesses",
    price: 9999,
    interval: PlanInterval.MONTHLY,
    maxPhoneNumbers: 5,
    maxMessagesPerMonth: 10000,
    popular: true,

    features: [
      { name: "Phone Numbers", limitUse: 5 },
      { name: "Messages", limitUse: 10000 },
      { name: "Contacts", limitUse: 5000 },
      { name: "Products", limitUse: 500 },
      { name: "Orders", limitUse: 5000 },

      { name: "Payment Links", enabled: true },

      { name: "WhatsApp Templates", enabled: true },
      { name: "Bulk Messaging", enabled: true },

      { name: "Automation", enabled: true },
      { name: "AI Chatbot", enabled: true },

      { name: "Analytics", enabled: true },

      { name: "Email Support", enabled: true },
      { name: "Priority Support", enabled: false },

      { name: "Custom Integrations", enabled: false },
    ],
  },
  {
    id: PlanName.PREMIUM,
    name: PlanName.PREMIUM,
    description: "For enterprises and large-scale commerce",
    price: 49999,
    interval: PlanInterval.MONTHLY,
    maxPhoneNumbers: 999,
    maxMessagesPerMonth: 100000,
    popular: false,

    features: [
      { name: "Phone Numbers", configValue: "UNLIMITED" },
      { name: "Messages", configValue: "UNLIMITED" },

      { name: "Contacts", configValue: "UNLIMITED" },
      { name: "Products", configValue: "UNLIMITED" },
      { name: "Orders", configValue: "UNLIMITED" },

      { name: "Payment Links", enabled: true },

      { name: "WhatsApp Templates", enabled: true },
      { name: "Bulk Messaging", enabled: true },

      { name: "Automation", enabled: true },
      { name: "AI Chatbot", enabled: true },

      { name: "Analytics", enabled: true },

      { name: "Email Support", enabled: true },
      { name: "Priority Support", enabled: true },

      { name: "Custom Integrations", enabled: true },
    ],
  },
];

export async function seedPlans(prisma: PrismaClient) {
  console.log("📦 Seeding features...");

  for (const feature of featuresData) {
    const { name, ...feat } = feature;
    await prisma.feature.upsert({
      where: { name },
      update: { ...feat },
      create: feature,
    });
  }

  console.log("📦 Seeding plans & plan features...");

  for (const plan of plansData) {
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });

    if (!adminUser) {
      throw new Error(
        "❌ Seed an Admin user first before seeding plans, because products require a userId.",
      );
    }

    await prisma.product.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        price: plan.price,
        description: plan.description,
      },
      create: {
        id: plan.id,
        userId: adminUser.id,
        name: plan.name,
        price: plan.price,
        description: plan.description,
      },
    });

    const dbPlan = await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        popular: plan.popular,
        maxPhoneNumbers: plan.maxPhoneNumbers,
        maxMessagesPerMonth: plan.maxMessagesPerMonth,
        active: true,
      },
      create: {
        id: plan.id,
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
