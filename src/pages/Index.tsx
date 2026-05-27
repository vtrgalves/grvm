import Particles from "@/components/Particles";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import BenefitsSection from "@/components/BenefitsSection";


import EcosystemSection from "@/components/EcosystemSection";
import Web3StackSection from "@/components/Web3StackSection";
import DifferentialsSection from "@/components/DifferentialsSection";
import RoadmapSection from "@/components/RoadmapSection";
import CTASection from "@/components/CTASection";
import ArtistsCarousel from "@/components/ArtistsCarousel";
import FooterSection from "@/components/FooterSection";
import OracleReputationSection from "@/components/OracleReputationSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative noise-bg scanlines">
      <Header />
      <Particles />
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <BenefitsSection />
      
      <EcosystemSection />
      <DifferentialsSection />
      <Web3StackSection />
      <OracleReputationSection />
      <RoadmapSection />
      <CTASection />
      <ArtistsCarousel />
      <FooterSection />
    </div>
  );
};

export default Index;
