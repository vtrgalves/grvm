import { Mic, Heart, Coins } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  {
    icon: Mic,
    step: "01",
    title: "Artistas criam",
    desc: "Artistas criam e compartilham conteúdo exclusivo",
    color: "border-primary box-glow-blue",
    iconColor: "text-primary",
  },
  {
    icon: Heart,
    step: "02",
    title: "Fãs interagem",
    desc: "Fãs interagem, apoiam e participam da comunidade",
    color: "border-secondary box-glow-purple",
    iconColor: "text-secondary",
  },
  {
    icon: Coins,
    step: "03",
    title: "Todos ganham",
    desc: "Todos são recompensados com tokens GRVM",
    color: "border-accent box-glow-magenta",
    iconColor: "text-accent",
  },
];

const HowItWorksSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative">
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-6">
          Como funciona o ecossistema <span className="gradient-neon-text">Groovium</span>
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
          Um sistema baseado em frequência e valor, onde cada ação gera impacto dentro do ecossistema.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connector lines (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-primary via-secondary to-accent opacity-30" />

          {steps.map(({ icon: Icon, step, title, desc, color, iconColor }, i) => (
            <div
              key={i}
              className={`relative flex flex-col items-center text-center p-8 rounded-2xl border bg-card/60 backdrop-blur-sm ${color} hover:scale-105 transition-all duration-300`}
            >
              <span className="font-display text-xs text-muted-foreground uppercase tracking-widest mb-4">
                Etapa {step}
              </span>
              <div className={`p-4 rounded-full bg-muted mb-4 ${iconColor}`}>
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
