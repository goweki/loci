import { PrismaClient, PlanName } from "../generated";

interface FeatureSeedData {
  name: string;
  description: string;
  useMetric: string;
}

interface PlanFeatureItem {
  name: string;
  enabled?: boolean;
  limitUse?: number | null;
  configValue?: string | null;
}

interface PlanSeedData {
  name: PlanName;
  description: string;
  monthlyPrice: number;
  maxPhoneNumbers: number;
  maxMessagesPerMonth: number;
  popular: boolean;
  features: PlanFeatureItem[];
}

const featuresData: FeatureSeedData[] = [
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

const plansData: PlanSeedData[] = [
  {
    name: PlanName.BASIC,
    description: "For solo businesses and startups",
    monthlyPrice: 2499,
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
    name: PlanName.STANDARD,
    description: "For growing teams and online businesses",
    monthlyPrice: 9999,
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
    name: PlanName.PREMIUM,
    description: "For enterprises and large-scale commerce",
    monthlyPrice: 49999,
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
    const dbPlan = await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        popular: plan.popular,
        maxPhoneNumbers: plan.maxPhoneNumbers,
        maxMessagesPerMonth: plan.maxMessagesPerMonth,
        active: true,
      },
      create: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
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

      const enabled = pf.enabled ?? true;
      const limitUse = pf.limitUse ?? null;
      const configValue = pf.configValue ?? null;

      await prisma.planFeature.upsert({
        where: {
          planId_featureId: {
            planId: dbPlan.id,
            featureId: feature.id,
          },
        },
        update: {
          enabled,
          limitUse,
          configValue,
        },
        create: {
          planId: dbPlan.id,
          featureId: feature.id,
          enabled,
          limitUse,
          configValue,
        },
      });
    }

    console.log(`✔ Seeded plan: ${plan.name}`);
  }
}
