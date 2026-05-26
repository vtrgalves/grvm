import { useEffect, useState } from "react";
import { Check, Trophy, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { FAN_MISSIONS, MUSICIAN_MISSIONS, type MissionDef } from "@/lib/missions";

const MissionsApp = () => {
  const { user, profile, refreshProfile } = useAuth();
  const isFan = profile?.profile_type !== "musician";
  const missions: MissionDef[] = isFan ? FAN_MISSIONS : MUSICIAN_MISSIONS;
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_missions")
      .select("mission_key, completed")
      .eq("user_id", user.id);
    if (data) setCompleted(new Set(data.filter(m => m.completed).map(m => m.mission_key)));
  };

  useEffect(() => { load(); }, [user]);

  const claim = async (key: string) => {
    setClaiming(key);
    const { data, error } = await supabase.rpc("claim_mission", { _mission_key: key });
    setClaiming(null);
    if (error) { toast.error(error.message); return; }
    const result = data as { success: boolean; reason?: string; points?: number };
    if (!result.success) { toast.info("Missão já concluída"); return; }
    toast.success(`+${result.points} GRVM! 🎵`);
    setCompleted(prev => new Set(prev).add(key));
    refreshProfile();
  };

  const completedCount = completed.size;
  const progress = (completedCount / missions.length) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" /> Missões
        </h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[10px] font-display uppercase tracking-wider text-primary/80 border border-primary/30 rounded-full px-2 py-0.5">⚡ Oracle Synced</span>
        </div>
        <p className="text-muted-foreground text-sm mt-1.5">Complete missões e ganhe GRVM instantaneamente.</p>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">{completedCount}/{missions.length} concluídas</span>
          <span className="font-display font-bold text-primary text-sm">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-3">
        {missions.map(m => {
          const done = completed.has(m.key);
          const isLoading = claiming === m.key;
          return (
            <div key={m.key}
              className={`glass-card rounded-xl p-4 flex items-center gap-4 transition-all ${
                done ? "border-primary/30 bg-primary/5" : "border-border/40"
              }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                done ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"
              }`}>
                {done && <Check className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {m.label}
                </p>
                <span className="text-xs font-display font-bold text-primary">+{m.points} GRVM</span>
              </div>
              {done ? (
                <span className="text-xs text-muted-foreground">Concluída</span>
              ) : (
                <Button size="sm" onClick={() => claim(m.key)} disabled={isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Concluir"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="glass-card rounded-xl p-4 border-dashed border-accent/30 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-accent" />
        <div className="text-sm text-muted-foreground">
          Em breve: missões <span className="text-accent font-medium">diárias</span> e <span className="text-accent font-medium">semanais</span>.
        </div>
      </div>
    </div>
  );
};

export default MissionsApp;
