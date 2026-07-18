import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { SocialProof } from "@/components/sections/SocialProof";
import { WhyExallenge } from "@/components/sections/WhyExallenge";
import { Features } from "@/components/sections/Features";
import { LearnVisually } from "@/components/sections/LearnVisually";
import { InteractiveLabs } from "@/components/sections/InteractiveLabs";
import { Roadmap } from "@/components/sections/Roadmap";
import { InterviewQuestions } from "@/components/sections/InterviewQuestions";
import { FounderAccess } from "@/components/sections/FounderAccess";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#0B1020]"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <SocialProof />
        <WhyExallenge />
        <Features />
        <LearnVisually />
        <InteractiveLabs />
        <Roadmap />
        <InterviewQuestions />
        <FounderAccess />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
