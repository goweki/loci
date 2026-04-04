import { type NextRequest } from "next/server";
import { compareHash, hash } from "@/lib/utils/passwordHandlers";
import { getUserByKey, updateUserPassword } from "@/data/user";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { tokenRepository } from "@/data/repositories/token.repository";
import { TokenType } from "@/lib/prisma/generated";

//validates token
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username") as string;
    const token = searchParams.get("token") as string;
    console.log("email-", username, "\ntoken-", token);

    const userExists = await getUserByKey(username);

    if (!userExists || !userExists.tokens || userExists.tokens.length === 0) {
      return Response.json({ error: "Invalid reset-link" }, { status: 400 });
    }

    const resetToken = await tokenRepository.findValidTokenByTypeUserId(
      TokenType.RESET,
      userExists.id,
    );

    if (!resetToken) {
      return Response.json({ error: "Invalid link" }, { status: 400 });
    }

    const _isTokenValid: boolean = await compareHash(
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
    const userExists = await getUserByKey(username);

    if (!userExists || !userExists.tokens || userExists.tokens.length === 0) {
      return Response.json({ error: "Invalid reset-link" }, { status: 400 });
    }

    const resetToken = await tokenRepository.findValidTokenByTypeUserId(
      TokenType.RESET,
      userExists.id,
    );

    if (!resetToken) {
      return Response.json({ error: "Invalid link" }, { status: 400 });
    }

    const _isTokenValid = await compareHash(token, resetToken.hashedToken);
    if (!_isTokenValid)
      return Response.json(
        { error: "Invalid token. Try Resetting your password." },
        {
          status: 401,
        },
      );

    const userUpdates = {
      password: await hash(password),
      resetToken: null,
      resetTokenExpiry: null,
    };
    const updatedUser = await updateUserPassword(userExists.id, userUpdates);

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
