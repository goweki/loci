import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UserService } from "@/services/user/user.service";
import { NotificationChannel, TokenType } from "@/lib/prisma/generated";
import { rateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  username: z.string().min(1),
  channel: z.nativeEnum(NotificationChannel).optional(),
});
const completeSchema = z.object({
  username: z.string().min(1),
  token: z.string().min(1),
  password: z.string().min(8).max(16),
});

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many password reset attempts" },
      { status: 429 },
    );
  }
  const body = await request.json().catch(() => null);
  const parsed =
    request.nextUrl.searchParams.get("action") === "complete"
      ? completeSchema.safeParse(body)
      : requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid password reset request" },
      { status: 400 },
    );
  }

  try {
    if ("password" in parsed.data) {
      const result = await UserService.verifyToken({
        username: parsed.data.username,
        token: parsed.data.token,
        type: TokenType.RESET,
      });
      if (
        !result.verification ||
        !result.user ||
        !result.verifiedChannel ||
        !result.tokenId
      ) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      const { bcryptCompare, bcryptHash } = await import("@/lib/utils/authHandlers");
      const prisma = (await import("@/lib/prisma")).default;
      const now = new Date();
      const password = await bcryptHash(parsed.data.password);
      const consumed = await prisma.$transaction(async (tx) => {
        const currentToken = await tx.token.findUnique({
          where: { id: result.tokenId! },
        });
        if (
          !currentToken ||
          !currentToken.isActive ||
          currentToken.expiresAt <= now ||
          currentToken.channel !== result.verifiedChannel ||
          !(await bcryptCompare(parsed.data.token, currentToken.hashedToken))
        ) {
          return false;
        }

        const tokenUpdate = await tx.token.updateMany({
          where: {
            id: result.tokenId!,
            hashedToken: currentToken.hashedToken,
            userId: result.user!.id,
            type: TokenType.RESET,
            isActive: true,
            expiresAt: { gt: now },
            channel: result.verifiedChannel,
          },
          data: { isActive: false, lastUsedAt: now },
        });
        if (tokenUpdate.count !== 1) return false;

        await tx.user.update({
          where: { id: result.user!.id },
          data: {
            password,
            ...(result.verifiedChannel === NotificationChannel.EMAIL
              ? { emailVerified: now }
              : { telVerified: now }),
          },
        });
        return true;
      });
      if (!consumed) {
        return NextResponse.json(
          { error: "Reset link has expired or was already used" },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true });
    }

    await UserService.sendResetLink({ username: parsed.data.username, sendTo: parsed.data.channel });
    return NextResponse.json({ success: true, message: "If the account exists, reset instructions have been sent." });
  } catch {
    // Avoid revealing whether an account exists.
    return NextResponse.json({ success: true, message: "If the account exists, reset instructions have been sent." });
  }
}
