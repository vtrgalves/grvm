import { useEffect, useState } from "react";
import { Coins, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function WelcomeOverlay() {
  const { profile } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (!localStorage.getItem("grv_welcome_seen")) {
      setShow(true);
      localStorage.setItem("grv_welcome_seen", "1");
      const t = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(t);
    }
  }, [profile]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-3xl border-2 border-primary/50 p-10 max-w-md mx-4 text-center box-glow-blue animate-scale-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 animate-pulse-glow">
          <Sparkles className="w-8 h-8 text-background" />
        </div>
        <h2 className="font-display text-3xl font-black gradient-neon-text mb-3">Bem-vindo ao Groovium</h2>
        <p className="text-muted-foreground mb-6 text-sm">Você recebeu seu bônus inicial para começar a jornada.</p>
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/15 border border-primary/40 box-glow-blue">
          <Coins className="w-6 h-6 text-primary" />
          <span className="font-display text-3xl font-black text-primary">+500 GRV</span>
        </div>
        <button onClick={() => setShow(false)} className="mt-6 block mx-auto text-xs text-muted-foreground hover:text-foreground underline">
          Continuar
        </button>
      </div>
    </div>
  );
}
