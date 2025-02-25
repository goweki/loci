import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/authOptions";
import Footer from "@/components/elements/footer";
import Header from "@/components/elements/header";
import Providers from "./providers";

export default async function UserLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signIn");
  else
    return (
      <Providers>
        <Header user={session.user} />
        {children}
        <Footer />
      </Providers>
    );
}
