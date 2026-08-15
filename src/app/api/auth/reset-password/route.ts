import { type NextRequest } from "next/server";
import { bcryptCompare, bcryptHash } from "@/lib/utils/passwordHandlers";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { TokenType } from "@/lib/prisma/generated";
import { UserService } from "@/services/user/user.service";
import prisma from "@/lib/prisma";

//validates token
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username") as string;
    const token = searchParams.get("token") as string;
    console.log("email-", username, "\ntoken-", token);

    const userExists = await UserService.getUserByKey(username, {
      tokens: true,
    });

    if (!userExists || !userExists.tokens || userExists.tokens.length === 0) {
      return Response.json({ error: "Invalid reset-link" }, { status: 400 });
    }

    const resetToken = userExists.tokens.find(
      ({ isActive, type }) => isActive && type === TokenType.RESET,
    );

    if (!resetToken) {
      return Response.json({ error: "Invalid link" }, { status: 400 });
    }

    const _isTokenValid: boolean = await bcryptCompare(
      token,
      resetToken?.hashedToken,
    );

    if (!_isTokenValid) {
      return Response.json(
        { error: "Invalid token. Try resetting password" },
        {
          status: 400,
        },
      );
    } else return Response.json({ message: "Enter new password" });
  } catch (err: any) {
    console.log("ERROR in route: > /api/auth/reset-password", err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}

//updates password
export async function PUT(request: Request) {
  const { username, token, password } = await request.json();
  console.log("password update request by - ", username);
  try {
    const userExists = await UserService.getUserByKey(username, {
      tokens: true,
    });

    if (!userExists || !userExists.tokens || userExists.tokens.length === 0) {
      return Response.json({ error: "Invalid reset-link" }, { status: 400 });
    }

    const resetToken = userExists.tokens.find(
      ({ isActive, type }) => isActive && type === TokenType.RESET,
    );

    if (!resetToken) {
      return Response.json({ error: "Invalid link" }, { status: 400 });
    }

    const _isTokenValid = await bcryptCompare(token, resetToken.hashedToken);
    if (!_isTokenValid)
      return Response.json(
        { error: "Invalid token. Try Resetting your password." },
        {
          status: 401,
        },
      );

    const userUpdates = {
      password: await bcryptHash(password),
      resetToken: null,
      resetTokenExpiry: null,
    };
    const updatedUser = await prisma.user.update({
      where: { id: userExists.id },
      data: userUpdates,
    });

    if (!updatedUser)
      return Response.json(
        { message: "Password not updated" },
        { status: 500 },
      );

    return Response.json({ message: "Password updated" });
  } catch (error) {
    console.log("ERROR in route /api/reset-password:\n >", error);
    const errorMessage = getFriendlyErrorMessage(error);

    return Response.json({ errorMessage }, { status: 500 });
  }
}
