import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
/* -------------------------------------------------------------------------- */
/*                              PLAN OPERATIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Create a new plan.
 */
export async function createPlan(data: Prisma.PlanCreateInput) {
  return prisma.plan.create({
    data,
    include: {
      features: {
        include: { feature: true },
      },
    },
  });
}

/**
 * Get a plan by ID.
 */
export async function getPlanById(id: string) {
  return prisma.plan.findUnique({
    where: { id },
    include: {
      features: {
        include: { feature: true },
      },
      subscriptions: true,
    },
  });
}

/**
 * Get all available (active) plans.
 */
export async function getAllActivePlans() {
  return prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
    include: {
      features: {
        include: { feature: true },
      },
    },
  });
}

/**
 * Update plan details (e.g., price, limits, description).
 */
export async function updatePlan(id: string, data: Prisma.PlanUpdateInput) {
  return prisma.plan.update({
    where: { id },
    data,
    include: {
      features: {
        include: { feature: true },
      },
    },
  });
}

/**
 * Deactivate a plan (soft delete).
 */
export async function deactivatePlan(id: string) {
  return prisma.plan.update({
    where: { id },
    data: { active: false },
  });
}

/**
 * Permanently delete a plan and its feature links.
 */
export async function deletePlan(id: string) {
  await prisma.planFeature.deleteMany({ where: { planId: id } });
  return prisma.plan.delete({ where: { id } });
}

/**
 * Get plan by name (e.g., "BASIC", "STANDARD", "PREMIUM").
 */
export async function getPlanByName(name: string) {
  return prisma.plan.findFirst({
    where: { name: name as any, active: true },
    include: {
      features: { include: { feature: true } },
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                             FEATURE OPERATIONS                             */
/* -------------------------------------------------------------------------- */

/**
 * Create a new feature.
 */
export async function createFeature(data: Prisma.FeatureCreateInput) {
  return prisma.feature.create({ data });
}

/**
 * Get all available features.
 */
export async function getAllFeatures() {
  return prisma.feature.findMany({
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get a single feature by its ID.
 */
export async function getFeatureById(id: string) {
  return prisma.feature.findUnique({
    where: { id },
    include: { plans: true },
  });
}

/**
 * Update a feature’s details.
 */
export async function updateFeature(
  id: string,
  data: Prisma.FeatureUpdateInput
) {
  return prisma.feature.update({
    where: { id },
    data,
  });
}

/**
 * Delete a feature and unlink it from plans.
 */
export async function deleteFeature(id: string) {
  await prisma.planFeature.deleteMany({ where: { featureId: id } });
  return prisma.feature.delete({ where: { id } });
}

/* -------------------------------------------------------------------------- */
/*                         PLAN-FEATURE RELATIONSHIP                          */
/* -------------------------------------------------------------------------- */

/**
 * Link an existing feature to a plan.
 */
export async function addFeatureToPlan(
  planId: string,
  featureId: string,
  options?: {
    enabled?: boolean;
    limitUse?: number;
    configValue?: string;
  }
) {
  return prisma.planFeature.create({
    data: {
      planId,
      featureId,
      enabled: options?.enabled ?? true,
      limitUse: options?.limitUse,
      configValue: options?.configValue,
    },
    include: { feature: true, plan: true },
  });
}

/**
 * Remove a feature from a plan.
 */
export async function removeFeatureFromPlan(planId: string, featureId: string) {
  return prisma.planFeature.delete({
    where: { planId_featureId: { planId, featureId } },
  });
}

/**
 * Get all features associated with a plan.
 */
export async function getFeaturesForPlan(planId: string) {
  return prisma.planFeature.findMany({
    where: { planId },
    include: { feature: true },
  });
}

/**
 * Toggle (enable/disable) a feature for a plan.
 */
export async function togglePlanFeature(
  planId: string,
  featureId: string,
  enabled: boolean
) {
  return prisma.planFeature.update({
    where: { planId_featureId: { planId, featureId } },
    data: { enabled },
  });
}

/**
 * Update plan-feature configuration (limitUse, configValue, etc.).
 */
export async function updatePlanFeature(
  planId: string,
  featureId: string,
  data: Prisma.PlanFeatureUpdateInput
) {
  return prisma.planFeature.update({
    where: { planId_featureId: { planId, featureId } },
    data,
  });
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY HELPERS                               */
/* -------------------------------------------------------------------------- */

/**
 * Get plan details including its feature list and limits.
 */
export async function getPlanDetails(planId: string) {
  return prisma.plan.findUnique({
    where: { id: planId },
    include: {
      features: {
        include: { feature: true },
      },
    },
  });
}

/**
 * Check whether a given feature is enabled in a plan.
 */
export async function isFeatureEnabled(planId: string, featureName: string) {
  const planFeature = await prisma.planFeature.findFirst({
    where: {
      planId,
      feature: { name: featureName },
    },
  });
  return planFeature?.enabled ?? false;
}
