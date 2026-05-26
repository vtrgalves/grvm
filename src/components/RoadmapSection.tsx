import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Rocket, Zap, Coins, Sparkles, Globe2, CheckCircle2, Loader2 } from "lucide-react";
import { ChainlinkLogo } from "@/components/web3/ChainlinkLogo";
import { SolanaLogo } from "@/components/web3/SolanaLogo";

type Status = "done" | "active" | "future" | "planned" | "vision";

const phases: {
  n: string;
  title: string;
  desc: string;
  status: Status;
  badge: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: "blue" | "purple" | "magenta";
  extra?: React.ReactNode;
}[] = [
  {
    n: "01",
    title: "Plataforma BETA",
    desc: "Ecossistema GRVM com gamificação, missões, NFTs, Groove Score e IA conectando artistas e fãs.",
    status: "done",
    badge: "Concluído",
    Icon: Rocket,
    accent: "blue",
  },
  {
    n: "02",
    title: "Expansão Web3",
    desc: "Proof of Support Oracle integrando Chainlink CRE e Solana para reputação musical descentralizada.",
    status: "active",
    badge: "Em desenvolvimento",
    Icon: Zap,
    accent: "magenta",
    extra: (
      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
        <ChainlinkLogo className="w-3 h-3 text-primary" /> Chainlink
        <span className="opacity-40">·</span>
        <SolanaLogo className="w-3 h-3" /> Solana
      </div>
    ),
  },
  {
    n: "03",
    title: "Token GRVM",
    desc: "Economia on-chain com wallets, NFTs e recompensas descentralizadas nativas do ecossistema.",
    status: "future",
    badge: "Futuro",
    Icon: Coins,
    accent: "purple",
  },
  {
    n: "04",
    title: "Monetização",
    desc: "Parcerias com marcas, creators, festivais e experiências musicais gamificadas.",
    status: "planned",
    badge: "Planejado",
    Icon: Sparkles,
    accent: "magenta",
  },
  {
    n: "05",
    title: "Mundo Físico",
    desc: "Integração com eventos e festivais como Rock in Rio e Lollapalooza via ecossistema GRVM.",
    status: "vision",
    badge: "Visão futura",
    Icon: Globe2,
    accent: "blue",
  },
];

const accentMap = {
  blue: {
    text: "text-primary",
    border: "border-primary/30",
    glow: "shadow-[0_0_24px_-4px_hsl(191_100%_50%/0.45)]",
    dot: "bg-primary",
    grad: "from-primary/20 to-transparent",
  },
  purple: {
    text: "text-secondary",
    border: "border-secondary/30",
    glow: "shadow-[0_0_24px_-4px_hsl(270_80%_55%/0.45)]",
    dot: "bg-secondary",
    grad: "from-secondary/20 to-transparent",
  },
  magenta: {
    text: "text-accent",
    border: "border-accent/30",
    glow: "shadow-[0_0_24px_-4px_hsl(330_100%_55%/0.5)]",
    dot: "bg-accent",
    grad: "from-accent/20 to-transparent",
  },
};

const statusBadge = (status: Status) => {
  switch (status) {
    case "done":
      return { label: "✅ Concluído", cls: "bg-primary/15 text-primary border-primary/30" };
    case "active":
      return { label: "⚡ Em desenvolvimento", cls: "bg-accent/15 text-accent border-accent/40 animate-pulse-glow" };
    case "future":
      return { label: "◎ Futuro", cls: "bg-secondary/15 text-secondary border-secondary/30" };
    case "planned":
      return { label: "🚀 Planejado", cls: "bg-muted/40 text-muted-foreground border-border" };
    case "vision":
      return { label: "🌎 Visão futura", cls: "bg-muted/40 text-muted-foreground border-border" };
  }
};

const PROGRESS = 45;

const RoadmapSection = () => {
  const ref = useScrollReveal();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="section-reveal py-24 md:py-32 relative noise-bg overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-secondary/[0.06] blur-[180px] pointer-events-none" />
      <div className="absolute top-20 right-10 w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
      <div className="absolute bottom-32 left-20 w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse [animation-delay:1s]" />
      <div className="absolute top-40 left-1/3 w-1 h-1 rounded-full bg-secondary/60 animate-pulse [animation-delay:2s]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-[10px] tracking-[0.3em] uppercase text-primary/80 mb-3 font-display">
            Roadmap · GRVM Ecosystem
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Nossa <span className="gradient-neon-text text-glow-blue">Jornada</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            O Groovium está construindo a próxima geração da economia musical entre fãs, artistas e Web3.
          </p>
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto mb-16">
          <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest mb-2">
            <span className="text-muted-foreground">Progressão do Ecossistema</span>
            <span className="text-primary">{PROGRESS}%</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full shadow-[0_0_12px_hsl(191_100%_50%/0.6)]"
              style={{ width: `${PROGRESS}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent shadow-[0_0_16px_hsl(330_100%_55%/0.9)] animate-pulse"
              style={{ left: `calc(${PROGRESS}% - 6px)` }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Desktop connecting line */}
          <div className="hidden lg:block absolute top-[88px] left-[8%] right-[8%] h-[1px] bg-gradient-to-r from-primary/40 via-secondary/40 to-accent/40">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_8px_hsl(191_100%_50%/0.8)]"
              style={{ width: `${PROGRESS}%` }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-4 relative">
            {phases.map((p, i) => {
              const a = accentMap[p.accent];
              const sb = statusBadge(p.status);
              const isActive = p.status === "active";
              const isHovered = hovered === i;

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="relative flex lg:flex-col gap-4 lg:gap-0 group"
                >
                  {/* Mobile connector */}
                  <div className="lg:hidden flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${a.dot} shadow-[0_0_12px_currentColor] ${isActive ? "animate-pulse" : ""}`} />
                    {i < phases.length - 1 && <div className="w-[1px] flex-1 bg-gradient-to-b from-primary/30 to-transparent mt-2" />}
                  </div>

                  {/* Desktop dot */}
                  <div className="hidden lg:flex justify-center mb-6 relative z-10">
                    <div
                      className={`w-4 h-4 rounded-full ${a.dot} shadow-[0_0_16px_currentColor] ${
                        isActive ? "ring-4 ring-accent/20 animate-pulse" : ""
                      }`}
                    />
                    {isActive && (
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-display uppercase tracking-widest text-accent whitespace-nowrap animate-pulse">
                        Estamos aqui
                      </span>
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className={`flex-1 glass-card rounded-2xl p-5 border transition-all duration-300 bg-gradient-to-b ${a.grad} ${
                      isActive ? `${a.border} ${a.glow}` : "border-white/5"
                    } ${isHovered ? `-translate-y-1 ${a.border} ${a.glow}` : ""}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`font-display text-xs ${a.text} tracking-widest`}>{p.n}</span>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-background/60 border ${a.border}`}>
                        <p.Icon className={`w-4 h-4 ${a.text}`} />
                      </div>
                    </div>

                    <h3 className="font-display text-base font-bold mb-2 leading-tight">{p.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 min-h-[60px]">{p.desc}</p>

                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border ${sb.cls}`}
                    >
                      {p.status === "done" && <CheckCircle2 className="w-3 h-3" />}
                      {p.status === "active" && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>{sb.label.replace(/^[^\s]+\s/, "")}</span>
                    </div>

                    {p.extra}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
