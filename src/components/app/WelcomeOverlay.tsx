import { useEffect, useState } from "react";
import { Coins, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TARGET = 2000;

export default function WelcomeOverlay() {
  const { profile } = useAuth();
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    if (localStorage.getItem("grv_welcome_seen")) return;
    setShow(true);
    localStorage.setItem("grv_welcome_seen", "1");

    const duration = 1600;
    const steps = 40;
    const inc = TARGET / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= TARGET) {
        setCount(TARGET);
        clearInterval(t);
      } else {
        setCount(Math.floor(cur));
      }
    }, duration / steps);
    return () => clearInterval(t);
  }, [profile]);

  if (!show) return null;

  const perks = [
    "Comprar experiências",
    "Resgatar NFTs",
    "Evoluir de nível",
    "Interagir com artistas",
    "Participar da economia musical",
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/85 backdrop-blur-md animate-fade-in p-4">
      {/* neon particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/70 animate-grv-float"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 8) * 0.25}s`,
              animationDuration: `${2 + (i % 5) * 0.4}s`,
              boxShadow: "0 0 12px hsl(var(--primary))",
            }}
          />
        ))}
      </div>

      <div className="relative glass-card rounded-3xl border-2 border-primary/50 p-8 md:p-10 max-w-md w-full text-center box-glow-blue animate-scale-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 animate-pulse-glow">
          <Sparkles className="w-8 h-8 text-background" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-black gradient-neon-text mb-2">🎉 Bem-vindo ao Groovium</h2>
        <p className="text-muted-foreground mb-5 text-sm">Você recebeu seus créditos iniciais</p>

        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary/15 border border-primary/40 box-glow-blue mb-6">
          <Coins className="w-7 h-7 text-primary" />
          <span className="font-display text-4xl md:text-5xl font-black text-primary tabular-nums">
            +{count.toLocaleString("pt-BR")}
          </span>
          <span className="font-display text-sm text-primary/70">GRV</span>
        </div>

        <div className="text-left space-y-2 mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">Use seus créditos para:</p>
          {perks.map((p) => (
            <div key={p} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-accent shrink-0" />
              <span className="text-foreground/90">{p}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShow(false)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-background font-display font-bold hover:scale-[1.02] transition-transform animate-pulse-glow"
        >
          Começar Jornada
        </button>
      </div>
    </div>
  );
}
