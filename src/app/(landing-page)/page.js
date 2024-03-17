import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import HeroHome from "@/components/elements/heroHome";
import Features from "@/components/elements/features";
import FeaturesBlocks from "@/components/elements/featuresBlocks";
import Testimonials from "@/components/elements/testimonials";
import Newsletter from "@/components/elements/newsletter";

export default async function Home() {
  return (
    <main>
      <HeroHome />
      <Features />
      <FeaturesBlocks />
      {/* <Testimonials /> */}
      {/* <Newsletter /> */}
    </main>
  );
}
