import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UserService } from "@/services/user/user.service";
import { NotificationChannel, TokenType } from "@/lib/prisma/generated";

const requestSchema = z.object({ username: z.string().min(1), channel: z.nativeEnum(NotificationChannel).optional() });
const completeSchema = z.object({ username: z.string().min(1), token: z.string().min(1), password: z.string().min(8) });
export async function POST(request: NextRequest) {
  const parsed = request.nextUrl.searchParams.get("action") === "complete"
    ? completeSchema.safeParse(await request.json().catch(() => null))
    : requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid password reset request" }, { status: 400 });
  try {
    if ("password" in parsed.data) {
      const result = await UserService.verifyToken({ username: parsed.data.username, token: parsed.data.token, type: TokenType.RESET });
      if (!result.verification || !result.user) return NextResponse.json({ error: result.message }, { status: 400 });
      const { bcryptHash } = await import("@/lib/utils/authHandlers");
      const prisma = (await import("@/lib/prisma")).default;
      await prisma.user.update({ where: { id: result.user.id }, data: { password: await bcryptHash(parsed.data.password) } });
      await prisma.token.update({ where: { type_userId: { userId: result.user.id, type: TokenType.RESET } }, data: { isActive: false } });
      return NextResponse.json({ success: true });
    }
    await UserService.sendResetLink({ username: parsed.data.username, sendTo: parsed.data.channel });
    return NextResponse.json({ success: true, message: "If the account exists, reset instructions have been sent." });
  } catch {
    // Avoid revealing whether an account exists.
    return NextResponse.json({ success: true, message: "If the account exists, reset instructions have been sent." });
  }
}
