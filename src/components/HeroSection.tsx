import grooviumCoin from "@/assets/groovium-coin.png";
import SoundwaveBackground from "./SoundwaveBackground";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden noise-bg pt-20">
      {/* Deep black gradient bg */}
      <div className="absolute inset-0 bg-[#0A0A0A]" />
      
      {/* Neon ambient lights */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-primary/5 blur-[160px]" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/4 blur-[140px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[120px]" />
      
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

        {/* Headline with glitch hint */}
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight animate-glitch">
          <span className="gradient-neon-text text-glow-blue">A moeda da música.</span>
          <br />
          <span className="text-foreground">Entre na frequência!</span>
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

        {/* CTA */}
        <div className="flex justify-center">
          <button className="px-8 py-4 rounded-lg font-display font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground animate-pulse-glow hover:scale-105 transition-transform animate-neon-flicker">
            Cadastre-se na rede!
          </button>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
