import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import HeroHome from "@/components/elements/landing/heroHome";
import Features from "@/components/elements/landing/features";
import FeaturesBlocks from "@/components/elements/landing/featuresBlocks";
import Testimonials from "@/components/elements/landing/testimonials";
import Newsletter from "@/components/elements/landing/newsletter";

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
