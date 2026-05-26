import { Coins, ShoppingBag, TrendingUp } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  {
    icon: Coins,
    title: "Ganhe GRVM",
    desc: "Interaja com artistas, complete missões e ganhe Groovium (GRVM) automaticamente.",
    glowClass: "hover:box-glow-blue border-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: ShoppingBag,
    title: "Use GRVM",
    desc: "Troque seus GRVM por NFTs, experiências exclusivas, sorteios e drops dos artistas.",
    glowClass: "hover:box-glow-purple border-secondary/20",
    iconColor: "text-secondary",
  },
  {
    icon: TrendingUp,
    title: "Evolua",
    desc: "Suba níveis de Listener a Legend e desbloqueie benefícios cada vez maiores.",
    glowClass: "hover:box-glow-magenta border-accent/20",
    iconColor: "text-accent",
  },
];

const HowItWorksSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative noise-bg">
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-accent/4 blur-[120px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-6">
          Como funciona o <span className="gradient-neon-text text-glow-blue">Groovium</span>
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
          O loop é simples: ganhar → usar → evoluir. Música deixa de ser apenas consumo e vira economia.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connector lines */}
          <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30" />

          {steps.map(({ icon: Icon, title, desc, glowClass, iconColor }, i) => (
            <div
              key={i}
              className={`relative flex flex-col items-center text-center p-8 rounded-2xl glass-card ${glowClass} hover:scale-105 transition-all duration-300`}
            >
              <div className={`p-4 rounded-full bg-muted/50 mb-4 ${iconColor}`}>
                <Icon size={32} />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
