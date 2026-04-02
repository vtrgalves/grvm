import { Sparkles, Cpu, Users, AudioWaveform } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const items = [
  { icon: Sparkles, text: "Integração real com música e cultura digital" },
  { icon: Cpu, text: "Tecnologia Web3 de última geração" },
  { icon: Users, text: "Comunidade ativa e engajada" },
  { icon: AudioWaveform, text: "Experiência imersiva baseada em frequência" },
];

const DifferentialsSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative noise-bg">
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-accent/4 blur-[120px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-16">
          Por que <span className="gradient-neon-text text-glow-blue">Groovium</span>?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {items.map(({ icon: Icon, text }, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-6 rounded-xl glass-card hover:box-glow-purple hover:border-secondary/40 transition-all duration-300 group"
            >
              <div className="p-3 rounded-lg bg-muted/50 text-secondary group-hover:scale-110 transition-transform shrink-0">
                <Icon size={24} />
              </div>
              <p className="font-body font-medium text-foreground">{text}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-lg text-muted-foreground max-w-2xl mx-auto italic">
          Groovium não é apenas uma moeda. É uma nova forma de{" "}
          <span className="text-primary font-semibold text-glow-blue">sentir</span>,{" "}
          <span className="text-secondary font-semibold text-glow-purple">viver</span> e{" "}
          <span className="text-accent font-semibold text-glow-magenta">monetizar</span> a música.
        </p>
      </div>
    </section>
  );
};

export default DifferentialsSection;
