import { Music, Zap, Globe } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const bullets = [
  { icon: Music, text: "Conecte música e tecnologia", color: "text-primary", glowClass: "hover:box-glow-blue hover:border-primary/40" },
  { icon: Zap, text: "Monetize engajamento real", color: "text-secondary", glowClass: "hover:box-glow-purple hover:border-secondary/40" },
  { icon: Globe, text: "Participe de uma economia descentralizada", color: "text-accent", glowClass: "hover:box-glow-magenta hover:border-accent/40" },
];

const AboutSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative noise-bg">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-secondary/4 blur-[150px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-8">
          O que é <span className="gradient-neon-text text-glow-blue">Groovium</span>?
        </h2>

        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-lg text-muted-foreground mb-4">
            <span className="font-bold text-foreground">Groovium</span> é mais do que um ativo digital, é um <span className="text-primary font-semibold text-glow-blue">movimento</span>.
          </p>
          <p className="text-muted-foreground mb-4">
            Trazendo os princípios na <span className="font-bold text-foreground">economia criativa</span> para a <span className="font-bold text-foreground">cena musical</span>, <span className="font-bold text-foreground">Groovium</span> conecta <span className="font-bold text-foreground">artistas</span>, <span className="font-bold text-foreground">fãs</span> e <span className="font-bold text-foreground">criadores</span> por meio de uma <span className="font-bold text-foreground">plataforma</span> participativa e repleta de recompensas. Basta se cadastrar para começar a ganhar e acumular <span className="font-bold text-foreground">GRVM</span>, a moeda corrente Groovium.
          </p>
          <p className="text-muted-foreground">
            Cada batida, cada interação e cada contribuição gera valor real na comunidade Groovium.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {bullets.map(({ icon: Icon, text, color, glowClass }, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-4 p-6 rounded-xl glass-card glass-card-hover ${glowClass} transition-all duration-300 hover:scale-105 group animate-border-glow`}
            >
              <div className={`p-3 rounded-full bg-muted/50 ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={28} />
              </div>
              <p className="font-body font-semibold text-foreground text-center">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
