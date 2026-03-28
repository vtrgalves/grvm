import SoundwaveBackground from "./SoundwaveBackground";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const CTASection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/50 to-background" />
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-secondary/10 blur-[100px]" />
      </div>
      <SoundwaveBackground className="opacity-5" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
          Entre na <span className="gradient-neon-text">frequência</span> do futuro
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Não fique de fora da revolução que está transformando música em valor digital.
        </p>
        <button className="px-10 py-5 rounded-xl font-display font-bold text-base uppercase tracking-wider bg-primary text-primary-foreground animate-pulse-glow hover:scale-110 transition-transform">
          Comprar GRVM agora
        </button>
      </div>
    </section>
  );
};

export default CTASection;
