import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coins, Trophy, Sparkles, Image as ImageIcon, Ticket, ArrowRight, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getLevel, getProgress } from "@/lib/levels";
import { Progress } from "@/components/ui/progress";
import { FAN_MISSIONS, MUSICIAN_MISSIONS } from "@/lib/missions";
import { Button } from "@/components/ui/button";

interface Tx { id: string; action: string; points: number; description: string | null; created_at: string; }

const Dashboard = () => {
  const { profile, user } = useAuth();
  const [missionsDone, setMissionsDone] = useState<Set<string>>(new Set());
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: m }, { data: t }] = await Promise.all([
        supabase.from("user_missions").select("mission_key, completed").eq("user_id", user.id),
        supabase.from("point_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (m) setMissionsDone(new Set(m.filter(x => x.completed).map(x => x.mission_key)));
      if (t) setTxs(t as Tx[]);
    })();
  }, [user]);

  if (!profile) return null;

  const level = getLevel(profile.grv_points);
  const progress = getProgress(profile.grv_points);
  const missionList = profile.profile_type === "musician" ? MUSICIAN_MISSIONS : FAN_MISSIONS;
  const activeMissions = missionList.filter(m => !missionsDone.has(m.key)).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">
          Olá, {profile.name?.split(" ")[0] || "Groover"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bem-vindo de volta à frequência da música.
        </p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-primary/20 box-glow-blue">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Coins className="w-4 h-4 text-primary" /> Saldo GRV
          </div>
          <div className="font-display text-4xl md:text-5xl font-black text-primary">
            {profile.grv_points.toLocaleString("pt-BR")}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Modo Testnet Groovium</div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Trophy className="w-4 h-4 text-accent" /> Nível
            </div>
            <span className="font-display text-accent font-bold uppercase tracking-wider text-sm">{level.name}</span>
          </div>
          <Progress value={progress.pct} className="h-2 mb-2" />
          <div className="text-xs text-muted-foreground">
            {progress.next ? <>Faltam <span className="text-accent font-bold">{progress.toNext} GRV</span> para <span className="text-foreground">{progress.next.name}</span></> : "Nível máximo desbloqueado!"}
          </div>
        </div>
      </div>

      {/* Active missions */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Missões ativas
          </h2>
          <Link to="/app/missions" className="text-xs text-primary hover:underline flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {activeMissions.length === 0 ? (
          <div className="text-center text-muted-foreground py-6 text-sm">
            🎉 Você concluiu todas as missões iniciais!
          </div>
        ) : (
          <div className="space-y-2">
            {activeMissions.map(m => (
              <Link key={m.key} to="/app/missions"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                <span className="text-sm">{m.label}</span>
                <span className="font-display font-bold text-primary text-sm">+{m.points} GRV</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" /> Atividade recente
        </h2>
        {txs.length === 0 ? (
          <p className="text-muted-foreground text-sm py-3">Nenhuma transação ainda.</p>
        ) : (
          <div className="space-y-2">
            {txs.map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20">
                <div>
                  <div className="text-sm">{t.description || t.action}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</div>
                </div>
                <div className={`font-display font-bold text-sm ${t.points >= 0 ? "text-primary" : "text-accent"}`}>
                  {t.points >= 0 ? "+" : ""}{t.points} GRV
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NFTs / Experiences mock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-secondary" /> Meus NFTs
            </h2>
            <span className="text-xs text-muted-foreground">Preview</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 border border-border/40 flex items-center justify-center text-2xl">
                🎨
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Ticket className="w-4 h-4 text-accent" /> Experiências
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/app/experiences">Explorar</Link>
            </Button>
          </div>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-muted/20 border border-border/40 text-sm">🎤 Meet & Greet — em breve</div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/40 text-sm">🎟 Show VIP — em breve</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
