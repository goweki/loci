import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import {
  apiKeyMiddleware,
  AuthenticatedHandler,
} from "@/lib/auth/token-handlers";

const getMessages: AuthenticatedHandler = async (request, apiKey) => {
  let userId = apiKey.id;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");
  const phoneNumberId = searchParams.get("phoneNumberId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const messages = await db.message.findMany({
    where: {
      userId,
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
};

export const GET = apiKeyMiddleware(getMessages);
