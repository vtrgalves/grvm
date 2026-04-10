import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useIsMobile } from "@/hooks/use-mobile";

const phases = [
  {
    phase: "Fase 1",
    title: "Lançamento",
    desc: "Lançamento do token e comunidade inicial",
    detail: "O início do ecossistema Groovium.\nAqui, a economia da música ganha vida: músicos e fãs começam a interagir, gerar valor e receber créditos através da participação ativa. Cada conexão vira recompensa.",
    glowClass: "hover:box-glow-blue border-primary/20",
    activeClass: "box-glow-blue border-primary/40",
    dotColor: "bg-primary",
  },
  {
    phase: "Fase 2",
    title: "Plataforma",
    desc: "Desenvolvimento da plataforma musical",
    detail: "Mais informações em breve.",
    glowClass: "hover:box-glow-purple border-secondary/20",
    activeClass: "box-glow-purple border-secondary/40",
    dotColor: "bg-secondary",
  },
  {
    phase: "Fase 3",
    title: "NFTs",
    desc: "Integração com NFTs e marketplace",
    detail: "Mais informações em breve.",
    glowClass: "hover:box-glow-magenta border-accent/20",
    activeClass: "box-glow-magenta border-accent/40",
    dotColor: "bg-accent",
  },
  {
    phase: "Fase 4",
    title: "Expansão",
    desc: "Expansão global e parcerias estratégicas",
    detail: "Mais informações em breve.",
    glowClass: "hover:box-glow-blue border-primary/20",
    activeClass: "box-glow-blue border-primary/40",
    dotColor: "bg-primary",
  },
];

const RoadmapSection = () => {
  const ref = useScrollReveal();
  const isMobile = useIsMobile();
  const [activePhase, setActivePhase] = useState<number | null>(null);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative noise-bg">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[150px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-16">
          Nossa <span className="gradient-neon-text text-glow-blue">jornada</span>
        </h2>

        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/30 via-secondary/30 to-accent/30" />

            <div className="flex flex-col gap-10">
              {phases.map(({ phase, title, desc, glowClass, activeClass, dotColor, detail }, i) => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <div className="absolute left-4 md:left-8 -translate-x-1/2 top-8">
                    <div className={`w-4 h-4 rounded-full ${dotColor} shadow-[0_0_12px_currentColor]`} />
                  </div>

                  {/* Row: card + detail side by side */}
                  <div className="ml-12 md:ml-16 flex flex-col md:flex-row md:items-center gap-4">
                    {/* Phase card */}
                    <div
                      onMouseEnter={() => !isMobile && setActivePhase(i)}
                      onMouseLeave={() => !isMobile && setActivePhase(null)}
                      onClick={() => isMobile && setActivePhase(activePhase === i ? null : i)}
                      className={`p-6 rounded-xl glass-card transition-all duration-300 md:w-[320px] flex-shrink-0 ${
                        activePhase === i ? activeClass : glowClass
                      } cursor-pointer hover:scale-105`}
                    >
                      <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                        {phase}
                      </span>
                      <h3 className="font-display text-xl font-bold mt-1 mb-2">{title}</h3>
                      <p className="text-muted-foreground text-sm">{desc}</p>
                    </div>

                    {/* Detail card - desktop: inline right, mobile: below */}
                    <div
                      className={`md:w-[320px] flex-shrink-0 transition-all duration-300 ${
                        activePhase === i
                          ? "opacity-100 translate-x-0 max-h-[500px]"
                          : "opacity-0 md:translate-x-4 max-h-0 md:max-h-[500px] overflow-hidden md:overflow-visible pointer-events-none"
                      }`}
                    >
                      <div className={`glass-card ${activeClass} rounded-xl p-6`}>
                        <h3 className="font-display text-lg font-bold mb-3">{title}</h3>
                        {detail.split("\n").map((line, idx) => (
                          <p key={idx} className="text-muted-foreground text-sm leading-relaxed mb-2">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
