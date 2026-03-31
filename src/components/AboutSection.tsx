import { Music, Zap, Globe } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const bullets = [
  { icon: Music, text: "Conecte música e tecnologia", color: "text-primary" },
  { icon: Zap, text: "Monetize engajamento real", color: "text-secondary" },
  { icon: Globe, text: "Participe de uma economia descentralizada", color: "text-accent" },
];

const AboutSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[150px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-8">
          O que é <span className="gradient-neon-text">Groovium</span>?
        </h2>

        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-lg text-muted-foreground mb-4">
            Groovium é mais do que uma criptomoeda — é um <span className="text-primary font-semibold">movimento</span>.
          </p>
          <p className="text-muted-foreground mb-4">
            Criado para revolucionar a indústria musical, o projeto conecta artistas, fãs e criadores em um ecossistema onde todos são recompensados pela sua participação.
          </p>
          <p className="text-muted-foreground">
            Através da tecnologia blockchain, cada batida, cada interação e cada contribuição ganha valor real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {bullets.map(({ icon: Icon, text, color }, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-4 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:box-glow-blue transition-all duration-300 hover:scale-105 group"
            >
              <div className={`p-3 rounded-full bg-muted ${color} group-hover:scale-110 transition-transform`}>
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
