import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Header from "@/components/elements/header";
import HeroHome from "@/components/elements/heroHome";
import Features from "@/components/elements/features";
import FeaturesBlocks from "@/components/elements/featuresBlocks";
import Testimonials from "@/components/elements/testimonials";
import Newsletter from "@/components/elements/newsletter";
import Footer from "@/components/elements/footer";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/user");
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/*  Site header */}
      <Header />
      {/*  Page content */}
      <main className="flex-grow">
        <HeroHome />
        <Features />
        <FeaturesBlocks />
        {/* <Testimonials /> */}
        {/* <Newsletter /> */}
      </main>
      {/*  Site footer */}
      <Footer />
    </div>
  );
}
