import Particles from "@/components/Particles";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import DiscoPlayerSection from "@/components/DiscoPlayerSection";
import TokenomicsSection from "@/components/TokenomicsSection";
import EcosystemSection from "@/components/EcosystemSection";
import DifferentialsSection from "@/components/DifferentialsSection";
import RoadmapSection from "@/components/RoadmapSection";
import CTASection from "@/components/CTASection";
import ArtistsCarousel from "@/components/ArtistsCarousel";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Particles />
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <DiscoPlayerSection />
      <TokenomicsSection />
      <EcosystemSection />
      <DifferentialsSection />
      <RoadmapSection />
      <CTASection />
      <ArtistsCarousel />
      <FooterSection />
    </div>
  );
};

export default Index;
