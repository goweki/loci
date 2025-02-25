import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export default async function AuthLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/user");
  else return children;
}
