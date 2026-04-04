// app/api/contacts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import { extractApiKey, hashToken } from "@/lib/auth/token-handlers";
import { tokenRepository } from "@/data/repositories/token.repository";
import { TokenType } from "@/lib/prisma/generated";

export async function GET(request: NextRequest) {
  let userId: string | null = null;

  const session = await getServerSession(authOptions);
  if (session?.user.id) userId = session?.user.id;
  else {
    const apiKey = extractApiKey(request);
    const token_inDb = await tokenRepository.findValidToken(
      hashToken(apiKey),
      TokenType.API_KEY,
    );
    userId = token_inDb?.user.id || null;
  }

  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");
  const phoneNumberId = searchParams.get("phoneNumberId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const contacts = await db.contact.findMany({
    where: {
      userId,
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

  return NextResponse.json({ contacts });
}
