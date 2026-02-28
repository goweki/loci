// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");
  const phoneNumberId = searchParams.get("phoneNumberId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const messages = await db.message.findMany({
    where: {
      userId: session.user.id,
      ...(contactId && { contactId }),
      ...(phoneNumberId && { phoneNumberId }),
    },
    include: {
      contact: true,
      phoneNumber: true,
    },
    orderBy: { timestamp: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  return NextResponse.json({ messages });
}
