import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Activity, ArrowRight, ChevronDown, Coins, Crown, ExternalLink, Filter,
  Hash, Loader2, Sparkles, Trophy, Zap,
} from "lucide-react";
import GrooviumHeartIcon from "@/components/web3/GrooviumHeartIcon";
import { OracleDemoModal } from "@/components/app/OracleDemoModal";
import { PremiumProofModal, type PremiumProofView } from "@/components/app/OracleSuccessModal";
import ProofOfSupportOracle from "@/components/app/ProofOfSupportOracle";
import { normalizeRank, rankForScore, RANK_STYLES } from "@/lib/oracle";
import { explorerTxUrl, isSolanaSignature } from "@/lib/solana";
import { getLevel, getProgress } from "@/lib/levels";

type SyncRow = {
  id: string; groove_score: number; ai_insight: string | null; ai_profile: string | null;
  ai_rank: string | null; tx_hash: string; chain: string | null; explorer_url: string | null;
  oracle_hash: string | null; external_data: Record<string, unknown> | null; created_at: string;
};
type PremiumProof = {
  id: string; action: string; label: string; icon: string; points: number;
  reputation_delta: number; oracle_synced: boolean; tx_hash: string | null;
  explorer_url: string | null; chain: string | null; created_at: string;
};
type SmartAction = {
  id: string; action: string; label: string; icon: string; points: number;
  reputation_delta: number; category: string; premium: boolean; created_at: string;
  description?: string | null;
};
type DashData = {
  profile: any;
  wallet: { balance: number };
  ranking: { position: number };
  oracle: any;
};

const RANGES: { key: "today" | "week" | "month" | "all"; label: string }[] = [
  { key: "today", label: "Hoje" }, { key: "week", label: "Semana" },
  { key: "month", label: "Mês" }, { key: "all", label: "Tudo" },
];

const shortHash = (h: string | null) =>
  !h ? "—" : h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s atrás`;
  if (s < 3600) return `${Math.floor(s / 60)}m atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  return `${Math.floor(s / 86400)}d atrás`;
};

export default function GrooviumHeart() {
  const { profile, user } = useAuth();
  const [dash, setDash] = useState<DashData | null>(null);
  const [reputation, setReputation] = useState(0);
  const [range, setRange] = useState<"today" | "week" | "month" | "all">("all");
  const [rows, setRows] = useState<SyncRow[]>([]);
  const [proofs, setProofs] = useState<PremiumProof[]>([]);
  const [actions, setActions] = useState<SmartAction[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [premiumModalProofs, setPremiumModalProofs] = useState<PremiumProofView[]>([]);
  const [premiumModalCount, setPremiumModalCount] = useState(0);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const [dashRes, repRes, histRes, proofsRes, actionsRes] = await Promise.all([
      (supabase.rpc as any)("get_dashboard_data"),
      supabase.rpc("compute_reputation_score", { _uid: user.id }),
      supabase.rpc("get_oracle_history", { _range: range }),
      (supabase.rpc as any)("get_user_premium_proofs", { _limit: 50 }),
      (supabase.rpc as any)("get_smart_actions", { _limit: 60 }),
    ]);
    setDash(dashRes.data as DashData);
    setReputation(Number(repRes.data ?? 0));
    setRows((histRes.data as SyncRow[]) ?? []);
    setProofs((proofsRes.data as PremiumProof[]) ?? []);
    setActions((actionsRes.data as SmartAction[]) ?? []);
  }, [user, range]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSyncPremium = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("premium-proof-sync", { body: {} });
      if (error) throw error;
      const n = (data as any)?.processed ?? 0;
      const { data: latest } = await (supabase.rpc as any)("get_user_premium_proofs", { _limit: 50 });
      setProofs((latest as PremiumProof[]) ?? []);
      if (n > 0) {
        const synced = ((latest as PremiumProof[]) ?? []).filter((p) => p.oracle_synced).slice(0, n);
        const views: PremiumProofView[] = synced.map((p) => ({
          label: p.label, icon: p.icon, txHash: p.tx_hash,
          explorerUrl: p.explorer_url ?? (isSolanaSignature(p.tx_hash) ? explorerTxUrl(p.tx_hash!) : null),
          reputationDelta: p.reputation_delta, chain: p.chain, createdAt: p.created_at,
        }));
        if (views.length > 0) {
          setPremiumModalProofs(views);
          setPremiumModalCount(n);
          setPremiumModalOpen(true);
        } else {
          toast.success(`${n} prova(s) registrada(s) na Devnet`);
        }
      } else {
        toast.info("Nenhuma prova pendente");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao sincronizar provas");
    } finally {
      setSyncing(false);
    }
  };

  const grv = dash?.profile?.grv_points ?? profile?.grv_points ?? 0;
  const level = getLevel(grv);
  const progress = getProgress(grv);
  const currentRank = rankForScore(reputation);
  const pending = proofs.filter((p) => !p.oracle_synced).length;
  const lastSync = rows[0];
  const firstName = (dash?.profile?.name ?? profile?.name ?? "Groover").split(" ")[0];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border border-primary/30 flex items-center justify-center box-glow-blue">
            <GrooviumHeartIcon className="w-7 h-7" animated />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-display">Groovium Heart</div>
            <h1 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">
              Olá, {firstName} 👋
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              O coração da sua reputação musical verificável.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-primary text-sm tabular-nums">
              {grv.toLocaleString("pt-BR")} GRVM
            </span>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-[11px] font-display font-bold uppercase tracking-wider border ${RANK_STYLES[currentRank]}`}>
            {currentRank}
          </span>
          <OracleDemoModal />
        </div>
      </div>

      {/* HERO — Proof of Support Score */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 glass-card p-6 md:p-8 bg-gradient-to-br from-primary/10 via-background/40 to-accent/10">
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_30%_20%,hsl(191_100%_50%/.25),transparent_60%),radial-gradient(circle_at_80%_80%,hsl(330_100%_55%/.25),transparent_60%)]" />
        <div className="relative grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold gradient-neon-text">
              Groovium Heart
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Sua reputação musical. Seu legado on-chain. Suas ações viraram reputação verificável,
              orquestradas pela Chainlink CRE e registradas na Solana Devnet.
            </p>
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Trophy className="w-3.5 h-3.5 text-accent" />
                <span className="font-display uppercase tracking-wider">{level.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span>#{dash?.ranking?.position ?? "—"} no ranking</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-background/40 p-5">
            <div className="text-[10px] uppercase tracking-widest text-primary font-display">
              Proof of Support Score
            </div>
            <div className="font-display text-5xl md:text-6xl font-black gradient-neon-text tabular-nums mt-1">
              {reputation}
              <span className="text-base text-muted-foreground font-bold">/1000</span>
            </div>
            <div className="mt-3">
              <Progress value={progress.pct} className="h-2" />
              <div className="text-[11px] text-muted-foreground mt-1.5">
                {progress.next
                  ? <>Faltam <span className="text-accent font-bold">{progress.toNext} GRVM</span> para {progress.next.name}</>
                  : "Nível máximo!"}
              </div>
            </div>
            {lastSync && (
              <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">GRVM</div>
                  <div className="font-display text-sm font-bold text-primary tabular-nums">
                    +{Number((lastSync.external_data as any)?.bonus_grvm ?? 0) || Math.round(Number(lastSync.groove_score) * 0.15)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Ações</div>
                  <div className="font-display text-sm font-bold text-accent tabular-nums">
                    {Number((lastSync.external_data as any)?.actions_analyzed ?? 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Devnet</div>
                  <div className="font-display text-[10px] font-bold text-primary uppercase">
                    {lastSync.chain && lastSync.chain !== "solana-devnet" ? "Simulado" : "On-chain"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTRAL — Oracle Sync Panel with live CRE stepper */}
      <ProofOfSupportOracle initialData={dash?.oracle ?? null} />

      {/* TABS */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="premium">Premium Proofs</TabsTrigger>
          <TabsTrigger value="actions">Smart Actions</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-card rounded-2xl p-4 border border-primary/20">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Saldo GRVM</div>
              <div className="font-display text-2xl font-black text-primary tabular-nums mt-1">{grv.toLocaleString("pt-BR")}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-accent/20">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reputação</div>
              <div className="font-display text-2xl font-black text-accent tabular-nums mt-1">{reputation}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-secondary/20">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ranking</div>
              <div className="font-display text-2xl font-black text-secondary tabular-nums mt-1">#{dash?.ranking?.position ?? "—"}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-primary/20">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Provas pendentes</div>
              <div className="font-display text-2xl font-black text-primary tabular-nums mt-1">{pending}</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-accent/40 p-5 bg-gradient-to-br from-accent/5 via-background/40 to-primary/5">
            <div className="text-[10px] uppercase tracking-widest text-accent font-display">Resumo para jurados</div>
            <p className="text-sm text-foreground mt-1 leading-relaxed">
              O Groovium usa <strong className="text-secondary">Chainlink CRE</strong> para orquestrar dados, IA e blockchain.
              Cada interação musical gera reputação verificável. A <strong className="text-primary">Solana Devnet</strong> registra
              provas públicas da jornada do fã, criando uma camada de confiança para a economia GRVM.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <Link to="/app/missions" className="glass-card rounded-2xl p-4 border border-primary/20 hover:border-primary/60 transition-colors group">
              <div className="flex items-center justify-between mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition" />
              </div>
              <div className="font-display font-bold text-sm">Continuar missões</div>
              <div className="text-[11px] text-muted-foreground">Cada missão vira Smart Action.</div>
            </Link>
            <Link to="/app/feed" className="glass-card rounded-2xl p-4 border border-accent/20 hover:border-accent/60 transition-colors group">
              <div className="flex items-center justify-between mb-1">
                <Zap className="w-4 h-4 text-accent" />
                <ArrowRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition" />
              </div>
              <div className="font-display font-bold text-sm">Engajar no feed</div>
              <div className="text-[11px] text-muted-foreground">Likes e comentários sobem o score.</div>
            </Link>
            <Link to="/app/explorer" className="glass-card rounded-2xl p-4 border border-secondary/20 hover:border-secondary/60 transition-colors group">
              <div className="flex items-center justify-between mb-1">
                <Activity className="w-4 h-4 text-secondary" />
                <ArrowRight className="w-4 h-4 text-secondary opacity-0 group-hover:opacity-100 transition" />
              </div>
              <div className="font-display font-bold text-sm">Auditar no Explorer</div>
              <div className="text-[11px] text-muted-foreground">Veja provas e syncs globais.</div>
            </Link>
          </div>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider border transition-all ${
                  range === r.key
                    ? "bg-primary text-background border-primary"
                    : "border-border/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {rows.length === 0 ? (
            <div className="glass-card rounded-2xl border border-border/40 p-8 text-center text-muted-foreground text-sm">
              Nenhuma sincronização nesse período. Rode o Oracle acima.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rows.map((r) => {
                const rank = normalizeRank(r.ai_rank, Number(r.groove_score));
                const explorerHref = r.explorer_url ?? (isSolanaSignature(r.tx_hash) ? explorerTxUrl(r.tx_hash) : null);
                const ext = (r.external_data ?? {}) as any;
                const bonus = Number(ext.bonus_grvm ?? 0);
                const repDelta = Number(ext.reputation_delta ?? 0);
                const acts = Number(ext.actions_analyzed ?? 0);
                const isExpanded = expanded === r.id;
                const isDemo = r.chain && r.chain !== "solana-devnet";
                return (
                  <div key={r.id} className="rounded-2xl border border-primary/20 hover:border-primary/50 transition-colors bg-gradient-to-br from-background/80 via-background/40 to-accent/5 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="font-display text-base font-bold text-accent truncate">{r.ai_profile ?? "Groover"}</div>
                        <div className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider border ${RANK_STYLES[rank]}`}>{rank}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-border/30 bg-background/40 p-2 text-center">
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">GRVM</div>
                        <div className="font-display text-base font-bold text-primary tabular-nums">+{bonus || Math.max(40, Math.round(Number(r.groove_score) * 0.15))}</div>
                      </div>
                      <div className="rounded-lg border border-border/30 bg-background/40 p-2 text-center">
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Reputação</div>
                        <div className={`font-display text-base font-bold tabular-nums ${repDelta > 0 ? "text-primary" : "text-muted-foreground"}`}>
                          {repDelta > 0 ? "+" : ""}{repDelta}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/30 bg-background/40 p-2 text-center">
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Score</div>
                        <div className="font-display text-base font-bold gradient-neon-text tabular-nums">{Math.round(Number(r.groove_score))}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-wider">
                      <span className="text-muted-foreground">{acts > 0 ? `${acts} ações verificadas` : "Hash registrado"}</span>
                      {isDemo ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">simulado em devnet</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">on-chain</span>
                      )}
                    </div>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : r.id)}
                      className="w-full text-[11px] font-display uppercase tracking-wider text-primary hover:text-primary/80 flex items-center justify-center gap-1 py-1 border-t border-border/30 mt-1"
                    >
                      {isExpanded ? "Ocultar" : "Detalhes"}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    {isExpanded && (
                      <div className="space-y-2 pt-1 animate-fade-in">
                        {r.ai_insight && <p className="text-xs text-muted-foreground">{r.ai_insight}</p>}
                        <div className="flex items-center gap-3 flex-wrap text-[10px] font-mono text-muted-foreground">
                          <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {shortHash(r.tx_hash)}</span>
                          {r.oracle_hash && <span>oracle: {shortHash(r.oracle_hash)}</span>}
                          {explorerHref && (
                            <a href={explorerHref} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1 hover:underline">
                              Solana Explorer <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PREMIUM */}
        <TabsContent value="premium" className="mt-4 space-y-4">
          <div className="glass-card rounded-2xl border border-accent/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-accent" />
                <span className="font-display text-sm font-bold">Premium Proofs Individuais</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {pending > 0 ? `${pending} pendente(s)` : "tudo sincronizado"}
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleSyncPremium}
                disabled={syncing || pending === 0}
                className="bg-gradient-to-r from-accent to-primary text-background font-display font-bold"
              >
                {syncing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Crown className="w-3 h-3 mr-1" />}
                Sincronizar na Devnet
              </Button>
            </div>
            {proofs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Conquiste NFTs, VIP, badges ou crates lendárias para gerar provas individuais.
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {proofs.map((p) => {
                  const href = p.explorer_url ?? (isSolanaSignature(p.tx_hash) ? explorerTxUrl(p.tx_hash!) : null);
                  return (
                    <div key={p.id} className="px-4 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
                      <div className="text-xl shrink-0">{p.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-[11px] font-bold uppercase tracking-wider text-accent">{p.label}</span>
                          <span className="text-[10px] text-muted-foreground">• {timeAgo(p.created_at)}</span>
                          {p.oracle_synced ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider">on-chain</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted-foreground uppercase tracking-wider">pendente</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {shortHash(p.tx_hash)}</span>
                          <span className="uppercase tracking-wider">{p.chain ?? "pending"}</span>
                          {href && (
                            <a href={href} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1 hover:underline">
                              explorer <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="font-display font-bold text-sm shrink-0 text-accent">+{p.reputation_delta} REP</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* SMART ACTIONS */}
        <TabsContent value="actions" className="mt-4 space-y-4">
          <div className="glass-card rounded-2xl border border-primary/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="font-display text-sm font-bold">Ações verificáveis que alimentam o Oracle</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-auto">
                {actions.length} ações
              </span>
            </div>
            {actions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Suas ações aparecerão aqui assim que você interagir com a plataforma.
              </div>
            ) : (
              <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
                {actions.map((a) => (
                  <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="text-xl shrink-0">{a.icon || "⚡"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-[11px] font-bold uppercase tracking-wider text-foreground">
                          {a.label || a.action}
                        </span>
                        {a.premium && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent uppercase tracking-wider border border-accent/30">
                            Premium
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted-foreground uppercase tracking-wider">
                          {a.category || "ação"}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {timeAgo(a.created_at)}{a.description ? ` · ${a.description}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-display font-bold text-xs text-primary">+{a.points} GRVM</span>
                      <span className="text-[9px] uppercase tracking-wider text-accent">+{a.reputation_delta} REP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
            🔗 Ações regulares são agregadas em um único memo on-chain por sync.
            Ações premium recebem hash individual na Solana Devnet.
          </p>
        </TabsContent>
      </Tabs>

      <PremiumProofModal
        open={premiumModalOpen}
        onOpenChange={setPremiumModalOpen}
        proofs={premiumModalProofs}
        count={premiumModalCount}
      />
    </div>
  );
}
