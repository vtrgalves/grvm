import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Boxes, Coins, Gem, Mic, Package, RefreshCw, Sparkles, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getLevel, getProgress } from "@/lib/levels";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FAN_MISSIONS, MUSICIAN_MISSIONS } from "@/lib/missions";
import Web3ConstructionBar from "@/components/app/Web3ConstructionBar";
import DailyCheckinCard from "@/components/app/DailyCheckinCard";
import AiSuggestion from "@/components/app/AiSuggestion";
import ProofOfSupportOracle from "@/components/app/ProofOfSupportOracle";

type DashboardProfile = {
  id: string;
  user_id: string;
  username?: string;
  name: string;
  handle?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  profile_type: "fan" | "musician";
  grv_balance?: number;
  grv_points: number;
  level: string;
  xp?: number;
  selected_genres?: string[] | null;
};

type DashboardData = {
  profile: DashboardProfile | null;
  wallet: { balance: number; last_transactions?: Array<{ id: string; action: string; points: number; description: string | null; created_at: string }> };
  missions: Array<{ mission_key: string; completed: boolean }>;
  boosts: Array<{ id: string; slug: string; name: string; effect: string; icon: string; rarity: string; expires_at: string }>;
  crates: Array<{ id: string; crate_name: string; prize_rarity: string; prize_name: string; prize_icon: string; created_at: string }>;
  badges: Array<{ id: string; title: string; icon: string; rarity: string }>;
  ranking: { position: number; top: Array<{ user_id: string; username: string; grv_balance: number; level: string; profile_type: string }> };
  nft_holdings: Array<{ id: string; title: string; price_grv: number; rarity: string; image_url: string | null; source: string }>;
  oracle: any;
  feed: Array<{ id: string; user_name: string; action: string; points: number; description: string | null; created_at: string }>;
  artists: Array<{ user_id: string; username: string; handle: string | null; avatar_url: string | null; bio: string | null; grv_balance: number; genres: string[] | null }>;
};

const friendly = (a: string) => ({
  signup_bonus: "🎉 Boas-vindas", mission_complete: "✅ Missão", post_create: "📝 Post",
  post_like: "❤️ Curtida", post_comment: "💬 Comentário", follow_artist: "🎤 Seguiu artista",
  item_sale: "💰 Venda", item_purchase: "🛒 Compra", live_drop_sale: "🔥 Drop vendido",
  live_drop_purchase: "🎟️ Drop comprado", daily_checkin: "📅 Check-in", nft_mint: "💎 NFT mintado",
}[a] || "⚡ Ação");

const rarityClass = (rarity: string) => ({
  common: "border-border/50 text-foreground",
  rare: "border-primary/60 text-primary",
  epic: "border-accent/60 text-accent",
  legendary: "border-secondary/70 text-secondary",
  genesis: "border-accent text-accent",
}[rarity] || "border-primary/50 text-primary");

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 glass-card p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse" />
        <div className="relative h-8 w-72 rounded-lg bg-primary/15 mb-3" />
        <div className="relative h-4 w-96 max-w-full rounded bg-muted/30" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["GRV shimmer", "Oracle loader", "Ranking pulse"].map((label) => (
          <div key={label} className="glass-card rounded-2xl p-6 border border-primary/20 animate-pulse">
            <div className="h-4 w-28 bg-muted/30 rounded mb-4" />
            <div className="h-10 w-36 bg-primary/20 rounded mb-3" />
            <div className="h-3 w-24 bg-muted/20 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-72 glass-card rounded-2xl border border-accent/20 animate-pulse" />
        <div className="h-72 glass-card rounded-2xl border border-secondary/20 animate-pulse" />
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data: res, error: rpcError } = await (supabase.rpc as any)("get_dashboard_data");
    if (rpcError) {
      console.error("[Groovium Dashboard]", rpcError);
      setError(rpcError.message ?? "Falha ao carregar dashboard");
      toast.error("Não foi possível sincronizar o Dashboard Groovium");
      setData(null);
    } else {
      setData(res as DashboardData);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const syncProfile = async () => {
    setSyncing(true);
    try {
      const { error: syncError } = await (supabase.rpc as any)("create_or_sync_profile");
      if (syncError) throw syncError;
      await refreshProfile();
      await loadDashboard();
      toast.success("Perfil Groovium sincronizado");
    } catch (e: any) {
      console.error("[Groovium Dashboard]", e);
      toast.error(e?.message ?? "Falha ao sincronizar perfil");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const dashboardProfile = data?.profile ?? (profile as DashboardProfile | null);

  if (error || !dashboardProfile) {
    return (
      <div className="space-y-6">
        <Web3ConstructionBar />
        <div className="glass-card rounded-2xl p-6 border border-accent/40 box-glow-pink">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-xl md:text-2xl font-bold gradient-neon-text">
                Tivemos um problema ao sincronizar seu perfil Groovium
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Sua sessão está ativa, mas o Dashboard não recebeu um perfil válido. A sincronização cria ou restaura os dados padrão com segurança.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Button onClick={syncProfile} disabled={syncing} className="bg-primary text-primary-foreground font-display font-bold">
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} /> Sincronizar Perfil
                </Button>
                <Button variant="outline" onClick={loadDashboard}>Tentar novamente</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const grv = dashboardProfile.grv_points ?? dashboardProfile.grv_balance ?? data?.wallet?.balance ?? 2000;
  const level = getLevel(grv);
  const progress = getProgress(grv);
  const missionList = dashboardProfile.profile_type === "musician" ? MUSICIAN_MISSIONS : FAN_MISSIONS;
  const missionsDone = useMemo(() => new Set((data?.missions ?? []).filter(m => m.completed).map(m => m.mission_key)), [data?.missions]);
  const activeMissions = missionList.filter(m => !missionsDone.has(m.key)).slice(0, 4);

  return (
    <div className="space-y-6">
      <Web3ConstructionBar />

      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">
          Olá, {dashboardProfile.name?.split(" ")[0] || dashboardProfile.username?.split(" ")[0] || "Groover"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Bem-vindo de volta à frequência da música.</p>
      </div>

      <DailyCheckinCard />

      <ProofOfSupportOracle initialData={data?.oracle ?? null} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-primary/20 box-glow-blue">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Coins className="w-4 h-4 text-primary" /> Saldo GRV
          </div>
          <div className="font-display text-3xl md:text-4xl font-black text-primary animate-pulse-glow inline-block">
            {grv.toLocaleString("pt-BR")}
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
          <div className="font-display text-3xl md:text-4xl font-black text-secondary">#{data?.ranking?.position ?? "—"}</div>
          <Link to="/app/ranking" className="text-xs text-secondary hover:underline inline-flex items-center gap-1 mt-1">
            Ver ranking completo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary animate-pulse" /> Atividade ao vivo
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-display uppercase tracking-widest text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live
              </span>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {(data?.feed ?? []).map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                  <Zap className={`w-3.5 h-3.5 shrink-0 ${r.points >= 0 ? "text-primary" : "text-accent"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate"><span className="text-muted-foreground">{friendly(r.action)} · </span>{r.user_name}</div>
                    <div className="text-[10px] text-muted-foreground/70">{new Date(r.created_at).toLocaleTimeString("pt-BR")}</div>
                  </div>
                  <div className={`font-display font-bold text-xs ${r.points >= 0 ? "text-primary" : "text-accent"}`}>{r.points >= 0 ? "+" : ""}{r.points}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold flex items-center gap-2"><Mic className="w-4 h-4 text-accent" /> Artistas em destaque</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(data?.artists ?? []).slice(0, 3).map((a) => (
                <Link key={a.user_id} to={a.handle ? `/u/${a.handle}` : "/app/feed"} className="group flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/40 hover:border-primary/50 transition-all hover-scale">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent shrink-0">
                      {a.avatar_url && <img src={a.avatar_url} alt={a.username} className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm truncate">{a.username}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{a.genres?.join(" · ") || "Groovium"}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{a.bio || "Artista em ascensão no ecossistema."}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Boosts Ativos</h2>
              <Link to="/app/boosts" className="text-xs text-primary hover:underline">Loja</Link>
            </div>
            <div className="space-y-2">
              {(data?.boosts ?? []).slice(0, 3).map(b => (
                <div key={b.id} className={`flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border ${rarityClass(b.rarity)}`}>
                  <div className="w-9 h-9 rounded-lg bg-background/40 flex items-center justify-center text-lg">{b.icon}</div>
                  <div className="flex-1 min-w-0"><div className="font-display font-bold text-sm truncate">{b.name}</div><div className="text-[10px] text-muted-foreground truncate">{b.effect}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-accent/20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-sm font-bold flex items-center gap-2"><Package className="w-4 h-4 text-accent" /> Últimas Recompensas</h2>
              <Link to="/app/crates" className="text-xs text-accent hover:underline">Abrir mais</Link>
            </div>
            <div className="space-y-2">
              {(data?.crates ?? []).slice(0, 3).map(i => (
                <div key={i.id} className={`flex items-center gap-3 p-2 rounded-lg bg-background/40 border ${rarityClass(i.prize_rarity)}`}>
                  <div className="text-xl">{i.prize_icon}</div>
                  <div className="flex-1 min-w-0"><div className="font-display font-bold text-xs truncate">{i.prize_name}</div><div className="text-[10px] text-muted-foreground truncate">{i.crate_name}</div></div>
                  <span className="text-[9px] uppercase font-display font-black">{i.prize_rarity}</span>
                </div>
              ))}
            </div>
          </div>
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
                  {dashboardProfile.profile_type === "musician" ? "Abrir Studio" : "Tornar-se artista"}
                </div>
                <div className="text-[10px] text-muted-foreground">Publique drops e receba GRV</div>
              </div>
              <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="font-display text-lg font-bold flex items-center gap-2"><Gem className="w-4 h-4 text-secondary" /> NFTs em destaque</h2><Link to="/app/nfts" className="text-xs text-primary hover:underline">Ver todos</Link></div>
          <div className="grid grid-cols-3 gap-3">
            {(data?.nft_holdings ?? []).slice(0, 3).map((i) => (
              <Link key={i.id} to="/app/nfts" className="group rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all hover-scale">
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
                  {i.image_url ? <img src={i.image_url} alt={i.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-3xl">💎</div>}
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-background/95 to-transparent"><div className="text-[10px] font-display font-bold truncate">{i.title}</div><div className="text-[10px] text-primary">{i.price_grv} GRV</div></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-secondary/20">
          <div className="flex items-center justify-between mb-4"><h2 className="font-display text-lg font-bold flex items-center gap-2"><Boxes className="w-4 h-4 text-secondary" /> Economia Groovium</h2><Link to="/app/explorer" className="text-xs text-primary hover:underline">Explorer</Link></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/20 p-4"><div className="text-[10px] text-muted-foreground uppercase tracking-widest">NFTs</div><div className="font-display text-2xl font-black text-secondary">{data?.nft_holdings?.length ?? 0}</div></div>
            <div className="rounded-xl bg-muted/20 p-4"><div className="text-[10px] text-muted-foreground uppercase tracking-widest">Badges</div><div className="font-display text-2xl font-black text-accent">{data?.badges?.length ?? 0}</div></div>
            <div className="rounded-xl bg-muted/20 p-4"><div className="text-[10px] text-muted-foreground uppercase tracking-widest">Boosts</div><div className="font-display text-2xl font-black text-primary">{data?.boosts?.length ?? 0}</div></div>
            <div className="rounded-xl bg-muted/20 p-4"><div className="text-[10px] text-muted-foreground uppercase tracking-widest">Crates</div><div className="font-display text-2xl font-black text-secondary">{data?.crates?.length ?? 0}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
