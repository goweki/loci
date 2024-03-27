import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Footer from "@/components/elements/footer";
import Header from "@/components/elements/header";

export default async function UnAuthLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/user");
  else
    return (
      <>
        <Header />
        {children}
        <Footer />
      </>
    );
}
