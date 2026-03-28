import grooviumCoin from "@/assets/groovium-coin.png";
import SoundwaveBackground from "./SoundwaveBackground";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted" />
      
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
      
      <SoundwaveBackground />

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Coin */}
        <div className="mb-8 flex justify-center">
          <img
            src={grooviumCoin}
            alt="Groovium Coin"
            className="w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 object-contain animate-float animate-coin-glow"
          />
        </div>

        {/* Headline */}
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="gradient-neon-text">A moeda da música.</span>
          <br />
          <span className="text-foreground">A frequência do futuro.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4">
          Groovium conecta artistas, fãs e tecnologia em um ecossistema
          descentralizado onde cada interação gera valor.
        </p>

        <p className="text-sm md:text-base text-muted-foreground/80 max-w-2xl mx-auto mb-10">
          Transforme engajamento em recompensa. Viva a música como nunca antes —
          agora na blockchain.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 rounded-lg font-display font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground animate-pulse-glow hover:scale-105 transition-transform">
            Comprar GRVM
          </button>
          <button className="px-8 py-4 rounded-lg font-display font-bold text-sm uppercase tracking-wider border border-secondary text-secondary hover:bg-secondary/10 box-glow-purple transition-all hover:scale-105">
            Ver Whitepaper
          </button>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
