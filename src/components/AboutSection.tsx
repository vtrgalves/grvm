import { Music, Zap, Globe } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const bullets = [
  {
    icon: Music,
    title: "Conecta música à nova tecnologia",
    text: "Artistas, fãs e criadores vão viver a música como nunca antes.",
    color: "text-primary",
    glowClass: "hover:box-glow-blue hover:border-primary/40",
  },
  {
    icon: Zap,
    title: "Monetiza engajamento real",
    text: "A participação é a moeda corrente que faz tudo acontecer.",
    color: "text-secondary",
    glowClass: "hover:box-glow-purple hover:border-secondary/40",
  },
  {
    icon: Globe,
    title: "Promove a economia criativa",
    text: "Uma rede inclusiva em que toda comunidade é beneficiada.",
    color: "text-accent",
    glowClass: "hover:box-glow-magenta hover:border-accent/40",
  },
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
          <p className="text-lg text-muted-foreground">
            Esta plataforma movida por <span className="text-primary font-semibold text-glow-blue">ativos digitais</span> foi desenvolvida para transformar engajamento e participação em recompensas e benefícios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {bullets.map(({ icon: Icon, title, text, color, glowClass }, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-4 p-6 rounded-xl glass-card glass-card-hover ${glowClass} transition-all duration-300 hover:scale-105 group animate-border-glow`}
            >
              <div className={`p-3 rounded-full bg-muted/50 ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={28} />
              </div>
              <h3 className={`font-display font-bold text-center ${color}`}>{title}</h3>
              <p className="font-body text-sm text-muted-foreground text-center">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
