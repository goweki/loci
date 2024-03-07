import Header from "@/components/elements/header";
import HeroHome from "@/components/elements/heroHome";
import Features from "@/components/elements/features";
import FeaturesBlocks from "@/components/elements/featuresBlocks";
import Testimonials from "@/components/elements/testimonials";
import Newsletter from "@/components/elements/newsletter";
import Footer from "@/components/elements/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/*  Site header */}
      <Header />
      {/*  Page content */}
      <main className="flex-grow">
        <HeroHome />
        <Features />
        <FeaturesBlocks />
        <Testimonials />
        <Newsletter />
      </main>
      {/*  Site footer */}
      <Footer />
    </div>
  );
}
