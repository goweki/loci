import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Footer from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";

export default async function UnAuthLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/user");
  else
    return (
      <>
        <Navbar />
        {children}
        <Footer />
      </>
    );
}
