import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coins, Trophy, Sparkles, ArrowRight, Mic } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getLevel, getProgress } from "@/lib/levels";
import { Progress } from "@/components/ui/progress";
import { FAN_MISSIONS, MUSICIAN_MISSIONS } from "@/lib/missions";
import Web3ConstructionBar from "@/components/app/Web3ConstructionBar";
import DailyCheckinCard from "@/components/app/DailyCheckinCard";
import LiveActivityFeed from "@/components/app/LiveActivityFeed";
import FeaturedArtists from "@/components/app/FeaturedArtists";
import FeaturedItems from "@/components/app/FeaturedItems";
import AiSuggestion from "@/components/app/AiSuggestion";
import ActiveBoosts from "@/components/app/ActiveBoosts";
import RecentCrateRewards from "@/components/app/RecentCrateRewards";
import ProofOfSupportOracle from "@/components/app/ProofOfSupportOracle";

const Dashboard = () => {
  const { profile, user } = useAuth();
  const [missionsDone, setMissionsDone] = useState<Set<string>>(new Set());
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_missions").select("mission_key, completed").eq("user_id", user.id)
      .then(({ data }) => data && setMissionsDone(new Set(data.filter(x => x.completed).map(x => x.mission_key))));
    supabase.from("profiles").select("user_id", { count: "exact", head: false })
      .gt("grv_points", profile?.grv_points ?? 0)
      .then(({ count }) => setRank((count ?? 0) + 1));
  }, [user, profile?.grv_points]);

  if (!profile) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-muted/30 rounded-lg" />
        <div className="h-32 bg-muted/20 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-muted/20 rounded-2xl" />
          <div className="h-32 bg-muted/20 rounded-2xl" />
          <div className="h-32 bg-muted/20 rounded-2xl" />
        </div>
        <div className="h-64 bg-muted/20 rounded-2xl" />
      </div>
    );
  }

  const level = getLevel(profile.grv_points);
  const progress = getProgress(profile.grv_points);
  const missionList = profile.profile_type === "musician" ? MUSICIAN_MISSIONS : FAN_MISSIONS;
  const activeMissions = missionList.filter(m => !missionsDone.has(m.key)).slice(0, 3);

  return (
    <div className="space-y-6">
      <Web3ConstructionBar />

      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">
          Olá, {profile.name?.split(" ")[0] || "Groover"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Bem-vindo de volta à frequência da música.</p>
      </div>

      <DailyCheckinCard />

      <ProofOfSupportOracle />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-primary/20 box-glow-blue">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Coins className="w-4 h-4 text-primary" /> Saldo GRV
          </div>
          <div className="font-display text-3xl md:text-4xl font-black text-primary animate-pulse-glow inline-block">
            {profile.grv_points.toLocaleString("pt-BR")}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Modo Simulado · BETA</div>
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
            {progress.next ? <>Faltam <span className="text-accent font-bold">{progress.toNext} GRV</span> para {progress.next.name}</> : "Nível máximo!"}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-secondary/20">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Trophy className="w-4 h-4 text-secondary" /> Ranking
          </div>
          <div className="font-display text-3xl md:text-4xl font-black text-secondary">#{rank ?? "—"}</div>
          <Link to="/app/ranking" className="text-xs text-secondary hover:underline inline-flex items-center gap-1 mt-1">
            Ver ranking completo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-6">
          <LiveActivityFeed />
          <FeaturedArtists />
        </div>
        <div className="space-y-6">
          <ActiveBoosts />
          <RecentCrateRewards />
          <AiSuggestion />
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Missões
              </h2>
              <Link to="/app/missions" className="text-xs text-primary hover:underline">Todas</Link>
            </div>
            {activeMissions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">🎉 Tudo concluído!</p>
            ) : (
              <div className="space-y-2">
                {activeMissions.map(m => (
                  <Link key={m.key} to="/app/missions"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                    <span className="text-xs truncate pr-2">{m.label}</span>
                    <span className="font-display font-bold text-primary text-xs shrink-0">+{m.points}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/app/studio"
            className="block glass-card rounded-2xl p-5 border border-accent/30 hover:border-accent transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Mic className="w-5 h-5 text-background" />
              </div>
              <div className="flex-1">
                <div className="font-display font-bold text-sm">
                  {profile.profile_type === "musician" ? "Abrir Studio" : "Tornar-se artista"}
                </div>
                <div className="text-[10px] text-muted-foreground">Publique drops e receba GRV</div>
              </div>
              <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeaturedItems kind="nft" title="NFTs em destaque" to="/app/nfts" />
        <FeaturedItems kind="experience" title="Experiências" to="/app/experiences" />
      </div>
    </div>
  );
};

export default Dashboard;
