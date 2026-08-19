import prisma from "@/lib/prisma";
import {
  apiKeyMiddleware,
  AuthenticatedHandler,
} from "@/lib/auth/token-handlers";
import { NextResponse } from "next/server";

const getContacts: AuthenticatedHandler = async (request, apiKey) => {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");
  const phoneNumberId = searchParams.get("phoneNumberId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const contacts = await prisma.contact.findMany({
    where: {
      userId: apiKey.user.id,
      ...(contactId && { contactId }),
      ...(phoneNumberId && { phoneNumberId }),
    },
    include: {
      messages: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  return NextResponse.json({ success: true, contacts });
};

export const GET = apiKeyMiddleware(getContacts);
