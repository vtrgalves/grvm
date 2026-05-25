import { useEffect, useState } from "react";
import { Flame, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGrvFx } from "./GrvFxProvider";
import { toast } from "sonner";

export default function DailyCheckinCard() {
  const { user, refreshProfile } = useAuth();
  const { notifyGain } = useGrvFx();
  const [status, setStatus] = useState<{ checked_today: boolean; streak: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase.rpc as any)("get_daily_status").then(({ data }: any) => data && setStatus(data));
  }, [user]);

  const claim = async () => {
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("daily_checkin");
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data?.success) {
      notifyGain(data.points, `Streak ${data.streak}`);
      setStatus({ checked_today: true, streak: data.streak });
      await refreshProfile();
    } else {
      toast("Você já fez check-in hoje");
    }
  };

  if (!status) return null;
  const done = status.checked_today;
  const nextStreak = done ? status.streak : Math.max(1, status.streak + (status.streak === 0 ? 0 : 1));
  const nextReward =
    nextStreak >= 30 ? 1000 :
    nextStreak >= 15 ? 500 :
    nextStreak >= 7  ? 300 :
    nextStreak >= 3  ? 120 : 50;

  return (
    <button
      onClick={done ? undefined : claim}
      disabled={done || loading}
      className={`w-full glass-card rounded-2xl p-4 border flex items-center gap-4 transition-all ${done ? "border-border/40 opacity-70" : "border-accent/40 hover:border-accent box-glow-pink cursor-pointer"}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${done ? "bg-muted/30" : "bg-accent/20 animate-pulse-glow"}`}>
        <Flame className={`w-6 h-6 ${done ? "text-muted-foreground" : "text-accent"}`} />
      </div>
      <div className="flex-1 text-left">
        <div className="font-display font-bold text-sm">
          {done ? `🔥 Streak ${status.streak} dia${status.streak > 1 ? "s" : ""}` : "Check-in diário"}
        </div>
        <div className="text-xs text-muted-foreground">
          {done
            ? "Volte amanhã para manter o streak"
            : `+${nextReward} GRV hoje · 7d=300 · 15d=500 · 30d=1000`}
        </div>
      </div>
      {!done && (
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 font-display font-bold text-primary text-sm">
          <Gift className="w-4 h-4" /> +{nextReward}
        </div>
      )}
    </button>
  );
}
