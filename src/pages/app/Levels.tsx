import { Trophy, Check, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LEVELS, getLevel, getProgress } from "@/lib/levels";
import { Progress } from "@/components/ui/progress";

const Levels = () => {
  const { profile } = useAuth();
  if (!profile) return null;
  const current = getLevel(profile.grv_points);
  const progress = getProgress(profile.grv_points);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">Níveis Groovium</h1>
        <p className="text-muted-foreground text-sm mt-1">Quanto mais você engaja, mais alto sua frequência.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-accent/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Nível atual</div>
            <div className="font-display text-2xl font-bold text-accent">{current.name}</div>
          </div>
          <Trophy className="w-10 h-10 text-accent" />
        </div>
        <Progress value={progress.pct} className="h-2 mb-2" />
        <div className="text-xs text-muted-foreground">
          {progress.next ? <>Faltam <span className="text-accent font-bold">{progress.toNext} GRV</span> para <span className="text-foreground">{progress.next.name}</span></> : "Nível máximo!"}
        </div>
      </div>

      <div className="space-y-3">
        {LEVELS.map((lvl, i) => {
          const reached = profile.grv_points >= lvl.min;
          const isCurrent = lvl.name === current.name;
          return (
            <div key={lvl.name}
              className={`glass-card rounded-2xl p-5 border transition-all ${
                isCurrent ? "border-primary/50 box-glow-blue" : reached ? "border-primary/20" : "border-border/40 opacity-70"
              }`}>
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold ${
                  reached ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/30 text-muted-foreground border border-border"
                }`}>
                  {reached ? <Check className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold text-lg">{lvl.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {lvl.min.toLocaleString("pt-BR")}{lvl.max === Infinity ? "+" : `–${lvl.max.toLocaleString("pt-BR")}`} GRV
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-display uppercase tracking-wider">Atual</span>
                )}
              </div>
              <ul className="space-y-1.5 pl-16">
                {lvl.rewards.map((r, j) => (
                  <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className={`w-1 h-1 rounded-full ${reached ? "bg-primary" : "bg-muted-foreground"}`} /> {r}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Levels;
