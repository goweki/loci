import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bcryptCompare } from "@/lib/utils/authHandlers";
import { UserService } from "@/services/user/user.service";
import { createApiKey } from "@/lib/auth/token-handlers";
import { UserStatus } from "@/lib/prisma/generated";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 },
    );

  let user: Record<string, any> | null = null;

  try {
    user = await UserService.getUserByKey(parsed.data.username);
  } catch (error) {
    return NextResponse.json(
      { error: (error as any).message || "error fetching user" },
      { status: 400 },
    );
  }

  if (
    !user ||
    !user.password ||
    !(await bcryptCompare(parsed.data.password, user.password))
  )
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  if (user.status !== UserStatus.ACTIVE)
    return NextResponse.json(
      { error: "Account is not active" },
      { status: 403 },
    );
  const token = await createApiKey({
    userId: user.id,
    description: "mobile-app",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return NextResponse.json({
    success: true,
    data: {
      accessToken: token.apiKey,
      tokenType: "Bearer",
      expiresAt: token.expiresAt,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        tel: user.tel,
        image: user.image,
        role: user.role,
        status: user.status,
      },
    },
  });
}
