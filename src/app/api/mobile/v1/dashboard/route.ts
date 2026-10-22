import { NextResponse } from "next/server";
import { mobileAuth } from "@/lib/auth/mobile-api";
import prisma from "@/lib/prisma";

export const GET = mobileAuth(async (_request, auth) => {
  const userId = auth.user.id;
  const [contacts, messages, phoneNumbers, products, orders, recentMessages, subscription] = await Promise.all([
    prisma.contact.count({ where: { userId } }), prisma.message.count({ where: { userId } }), prisma.phoneNumber.count({ where: { waba: { userId } } }), prisma.product.count({ where: { userId, isActive: true } }), prisma.order.count({ where: { userId } }),
    prisma.message.findMany({ where: { userId }, take: 5, orderBy: { timestamp: "desc" }, select: { id: true, type: true, content: true, direction: true, status: true, timestamp: true, contact: { select: { id: true, name: true, phoneNumber: true } } } }),
    prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { status: true, currentPeriodEnd: true, plan: { select: { name: true, maxPhoneNumbers: true, maxMessagesPerMonth: true } } } }),
  ]);
  return NextResponse.json({ success: true, data: { stats: { contacts, messages, phoneNumbers, products, orders }, recentMessages, subscription } });
});
