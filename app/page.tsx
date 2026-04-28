import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { DemoFlow } from "@/components/DemoFlow";
import { Examples } from "@/components/Examples";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <DemoFlow />
        <Examples />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
