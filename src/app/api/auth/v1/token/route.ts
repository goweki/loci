import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req) {
  if (!secret) {
    console.error("missing process.env.NEXTAUTH_SECRET");
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }

  // Use Promise.all to concurrently execute both getToken calls
  const [accessToken, user] = await Promise.all([
    getToken({
      req,
      secret,
      raw: true,
    }),

    getToken({
      req,
      secret,
      raw: false,
    }),
  ]);

  console.log(`accessToken - ${accessToken} \nuser - ${user} \n...`);

  if (accessToken && user) {
    return NextResponse.json({ accessToken, user });
  } else {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
