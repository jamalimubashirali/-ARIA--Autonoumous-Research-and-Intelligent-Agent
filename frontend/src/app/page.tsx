import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ThreeBackground } from "@/components/landing/ThreeBackground";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { MouseGlow } from "@/components/landing/MouseGlow";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      <ThreeBackground />
      <MouseGlow />
      <ScrollProgress />
      <Navbar />
      <div className="content-layer">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <Footer />
      </div>
    </main>
  );
}
