import { useScrollReveal } from "@/hooks/useScrollReveal";

const phases = [
  {
    phase: "Fase 1",
    title: "Lançamento",
    desc: "Lançamento do token e comunidade inicial",
    color: "border-primary",
    dotColor: "bg-primary",
    glow: "box-glow-blue",
  },
  {
    phase: "Fase 2",
    title: "Plataforma",
    desc: "Desenvolvimento da plataforma musical",
    color: "border-secondary",
    dotColor: "bg-secondary",
    glow: "box-glow-purple",
  },
  {
    phase: "Fase 3",
    title: "NFTs",
    desc: "Integração com NFTs e marketplace",
    color: "border-accent",
    dotColor: "bg-accent",
    glow: "box-glow-magenta",
  },
  {
    phase: "Fase 4",
    title: "Expansão",
    desc: "Expansão global e parcerias estratégicas",
    color: "border-primary",
    dotColor: "bg-primary",
    glow: "box-glow-blue",
  },
];

const RoadmapSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="section-reveal py-24 md:py-32 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-16">
          Nossa <span className="gradient-neon-text">jornada</span>
        </h2>

        <div className="max-w-4xl mx-auto relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-secondary to-accent opacity-30 md:-translate-x-[1px]" />

          <div className="space-y-12">
            {phases.map(({ phase, title, desc, color, dotColor, glow }, i) => (
              <div
                key={i}
                className={`relative flex flex-col md:flex-row items-start gap-6 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-2">
                  <div className={`w-4 h-4 rounded-full ${dotColor} ${glow}`} />
                </div>

                {/* Card */}
                <div
                  className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${
                    i % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8 md:ml-auto"
                  }`}
                >
                  <div className={`p-6 rounded-xl border ${color} bg-card/50 backdrop-blur-sm hover:scale-105 transition-all duration-300`}>
                    <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                      {phase}
                    </span>
                    <h3 className="font-display text-xl font-bold mt-1 mb-2">{title}</h3>
                    <p className="text-muted-foreground text-sm">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
