import { NextResponse } from "next/server";

const JWT_SECRET = process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET) throw new Error("NEXTAUTH_SECRET not set");

export async function POST(req: Request) {
  return NextResponse.json({ message: "Yet to be implemented" });
}
