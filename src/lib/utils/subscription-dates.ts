import { PlanInterval } from "@/lib/prisma/generated";

export function getPeriodEndDate(startDate: Date, interval: PlanInterval): Date {
  const endDate = new Date(startDate);
  const dayOfMonth = endDate.getDate();
  endDate.setDate(1);
  if (interval === PlanInterval.MONTHLY) endDate.setMonth(endDate.getMonth() + 1);
  else endDate.setFullYear(endDate.getFullYear() + 1);
  const lastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
  endDate.setDate(Math.min(dayOfMonth, lastDay));
  return endDate;
}
