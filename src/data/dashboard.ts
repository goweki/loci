// @/data/dashboard.ts

"use server";

import { DashboardStatsProps } from "@/components/dashboard/stats";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { getUserById } from "./user";

export interface DashboardStats {
  totalMessages: number;
  totalMessagesPrevious: number;
  activeContacts: number;
  activeContactsPrevious: number;
  responseRate: number;
  responseRatePrevious: number;
  phoneNumbers: number;
  phoneNumbersPrevious: number;
}

// Cache the dashboard stats for 5 minutes
export const getDashboardStats = cache(
  async (userId: string): Promise<DashboardStats> => {
    // Get date ranges for current and previous period (last 30 days)
    const wabaId = (await getUserById(userId))?.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Total Messages (current period)
    const totalMessages = await prisma.message.count({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Total Messages (previous period)
    const totalMessagesPrevious = await prisma.message.count({
      where: {
        userId,
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    // Active Contacts (contacted in last 30 days)
    const activeContacts = await prisma.contact.count({
      where: {
        userId,
        lastMessageAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Active Contacts (previous period)
    const activeContactsPrevious = await prisma.contact.count({
      where: {
        userId,
        lastMessageAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    // Response Rate Calculation
    const outboundMessages = await prisma.message.count({
      where: {
        userId,
        direction: "OUTBOUND",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const respondedMessages = await prisma.message.count({
      where: {
        userId,
        direction: "INBOUND",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const responseRate =
      outboundMessages > 0 ? (respondedMessages / outboundMessages) * 100 : 0;

    // Response Rate (previous period)
    const outboundMessagesPrevious = await prisma.message.count({
      where: {
        userId,
        direction: "OUTBOUND",
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    const respondedMessagesPrevious = await prisma.message.count({
      where: {
        userId,
        direction: "INBOUND",
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    const responseRatePrevious =
      outboundMessagesPrevious > 0
        ? (respondedMessagesPrevious / outboundMessagesPrevious) * 100
        : 0;

    // Phone Numbers (active/verified)
    const phoneNumbers = await prisma.phoneNumber.count({
      where: {
        wabaId,
        status: "VERIFIED",
      },
    });

    // Phone Numbers (previous count - all time before 30 days ago)
    const phoneNumbersPrevious = await prisma.phoneNumber.count({
      where: {
        wabaId,
        status: "VERIFIED",
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return {
      totalMessages,
      totalMessagesPrevious,
      activeContacts,
      activeContactsPrevious,
      responseRate: Math.round(responseRate * 10) / 10, // Round to 1 decimal
      responseRatePrevious: Math.round(responseRatePrevious * 10) / 10,
      phoneNumbers,
      phoneNumbersPrevious,
    };
  }
);

// Get stats summary (optimized single query version)
export const getDashboardStatsSummary = cache(
  async (userId: string): Promise<DashboardStatsProps> => {
    const stats = await getDashboardStats(userId);

    return {
      totalMessages: {
        label: "Messages",
        value: stats.totalMessages.toString(),
        change: calculatePercentageChange(
          stats.totalMessages,
          stats.totalMessagesPrevious
        ),
        trend:
          stats.totalMessages >= stats.totalMessagesPrevious ? "up" : "down",
      },
      activeContacts: {
        label: "Contacts",
        value: stats.activeContacts.toString(),
        change: calculatePercentageChange(
          stats.activeContacts,
          stats.activeContactsPrevious
        ),
        trend:
          stats.activeContacts >= stats.activeContactsPrevious ? "up" : "down",
      },
      responseRate: {
        label: "Responses",
        value: stats.responseRate.toString(),
        change: calculatePercentageChange(
          stats.responseRate,
          stats.responseRatePrevious
        ),
        trend: stats.responseRate >= stats.responseRatePrevious ? "up" : "down",
      },
      phoneNumbers: {
        label: "Phone Numbers",
        value: stats.phoneNumbers.toString(),
        change: stats.phoneNumbers - stats.phoneNumbersPrevious,
        trend: stats.phoneNumbers >= stats.phoneNumbersPrevious ? "up" : "down",
      },
    };
  }
);

function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "+100%" : "0%";
  }

  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${Math.round(change * 10) / 10}%`;
}
