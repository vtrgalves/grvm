import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { FAN_MISSIONS, MUSICIAN_MISSIONS, FAN_BONUS, MUSICIAN_BONUS, type MissionDef } from "@/lib/missions";

const Missions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") as "fan" | "musician" | null;
  const isFan = type !== "musician";

  const missions: MissionDef[] = isFan ? FAN_MISSIONS : MUSICIAN_MISSIONS;
  const completionBonus = isFan ? FAN_BONUS : MUSICIAN_BONUS;
  const totalPossible = missions.reduce((sum, m) => sum + m.points, 0) + completionBonus;

  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("user_missions")
        .select("mission_key, completed")
        .eq("user_id", user.id);

      if (data) {
        setCompletedKeys(new Set(data.filter(m => m.completed).map(m => m.mission_key)));
      }
      setLoading(false);
    };
    loadMissions();
  }, []);

  const completedCount = completedKeys.size;
  const allComplete = completedCount === missions.length;
  const earnedPoints = missions
    .filter(m => completedKeys.has(m.key))
    .reduce((sum, m) => sum + m.points, 0) + (allComplete ? completionBonus : 0);
  const progress = (completedCount / missions.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 noise-bg scanlines relative overflow-hidden">
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] ${isFan ? "bg-primary/10" : "bg-accent/10"}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] ${isFan ? "bg-accent/5" : "bg-primary/5"}`} />

      <div className="w-full max-w-lg mx-auto relative z-10 pt-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Ir para o Feed
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${isFan ? "bg-primary/20 border border-primary/40" : "bg-accent/20 border border-accent/40"}`}>
            <Trophy className={`w-7 h-7 ${isFan ? "text-primary" : "text-accent"}`} />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text mb-2">
            {isFan ? "Missão Inicial" : "Missão de Boas-Vindas"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Complete todas e ganhe <span className={`font-bold ${isFan ? "text-primary" : "text-accent"}`}>+{completionBonus} GRV</span> de bônus!
          </p>
        </div>

        {/* Progress bar */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">{completedCount}/{missions.length} missões</span>
            <span className={`text-sm font-bold font-display ${isFan ? "text-primary" : "text-accent"}`}>
              +{earnedPoints} GRV
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Mission list */}
        <div className="space-y-3 mb-8">
          {missions.map((mission) => {
            const done = completedKeys.has(mission.key);
            return (
              <div
                key={mission.key}
                className={`glass-card rounded-xl p-4 flex items-center gap-4 transition-all duration-300 ${
                  done
                    ? isFan ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"
                    : "border-border/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  done
                    ? isFan ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                    : "border-2 border-muted-foreground/30"
                }`}>
                  {done && <Check className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {mission.label}
                  </p>
                </div>
                <span className={`text-xs font-display font-bold shrink-0 ${
                  done
                    ? "text-muted-foreground"
                    : isFan ? "text-primary" : "text-accent"
                }`}>
                  +{mission.points}
                </span>
              </div>
            );
          })}
        </div>

        {/* Completion bonus card */}
        <div className={`glass-card rounded-xl p-4 mb-8 border-dashed ${
          allComplete
            ? isFan ? "border-primary/50 bg-primary/10" : "border-accent/50 bg-accent/10"
            : "border-muted-foreground/20"
        }`}>
          <div className="flex items-center gap-3">
            <Sparkles className={`w-5 h-5 ${allComplete ? (isFan ? "text-primary" : "text-accent") : "text-muted-foreground/50"}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${allComplete ? "text-foreground" : "text-muted-foreground"}`}>
                Bônus: completar todas as missões
              </p>
            </div>
            <span className={`text-sm font-display font-bold ${allComplete ? (isFan ? "text-primary" : "text-accent") : "text-muted-foreground/50"}`}>
              +{completionBonus} GRV
            </span>
          </div>
        </div>

        <Button
          onClick={() => navigate("/")}
          className={`w-full font-display text-base font-semibold py-6 ${
            isFan
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-accent text-accent-foreground hover:bg-accent/90"
          }`}
        >
          {isFan ? "Explorar o Feed" : "Ir para Meu Perfil"}
        </Button>
      </div>
    </div>
  );
};

export default Missions;
