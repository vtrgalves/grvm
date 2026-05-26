import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Heart, Music, Check } from "lucide-react";

const fanBenefits = [
  "Ganha GRVM ao curtir, comentar e compartilhar",
  "Troca por NFTs, sorteios e experiências",
  "Sobe de nível: Listener → Legend",
  "Acesso antecipado a drops e shows",
];

const artistBenefits = [
  "Monetiza engajamento real dos fãs",
  "Cria experiências (Meet & Greet, VIP)",
  "Lança NFTs com benefícios atrelados",
  "Constrói uma comunidade fiel",
];

const BenefitsSection = () => {
  const ref = useScrollReveal();
  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative noise-bg">
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[140px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[140px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
          Benefícios para <span className="gradient-neon-text">todos</span>
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
          Uma economia onde fãs e artistas crescem juntos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8 border border-primary/20 hover:box-glow-blue transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold">Para fãs</h3>
            </div>
            <ul className="space-y-3">
              {fanBenefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card rounded-2xl p-8 border border-accent/20 hover:box-glow-magenta transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
                <Music className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold">Para artistas</h3>
            </div>
            <ul className="space-y-3">
              {artistBenefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
export default BenefitsSection;
