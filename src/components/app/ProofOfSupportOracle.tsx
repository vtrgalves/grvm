import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity, AlertTriangle, Brain, CheckCircle2, Cpu, Globe, HelpCircle, Link2, Loader2,
  RefreshCw, ShieldCheck, Sparkles, TrendingUp, Zap,
} from "lucide-react";
import { toast } from "sonner";

interface OracleData {
  latest: {
    groove_score: number;
    ai_insight: string;
    ai_profile: string;
    ai_rank: string | null;
    tx_hash: string;
    block_number: number;
    workflow_status: string;
    external_data: Record<string, unknown> | null;
    created_at: string;
  } | null;
  metrics: Record<string, unknown> | null;
  history: Array<{
    id: string;
    score: number;
    insight: string;
    rank: string | null;
    tx_hash: string;
    block_number: number;
    trigger_event: string;
    created_at: string;
  }>;
}

type OracleSyncResponse = {
  success?: boolean;
  error?: string;
  grooveScore?: number;
  rank?: string;
};

const WORKFLOW_STEPS = [
  { label: "Coletando métricas do fã", icon: Activity },
  { label: "APIs externas (CoinGecko · MusicBrainz)", icon: Globe },
  { label: "Calculando Groove Score (0–1000)", icon: Zap },
  { label: "IA analisando perfil (Gemini)", icon: Brain },
  { label: "Registrando prova onchain", icon: ShieldCheck },
];

const RANK_STYLES: Record<string, string> = {
  Rookie: "border-muted-foreground/40 text-muted-foreground bg-muted/10",
  Rising: "border-accent/50 text-accent bg-accent/10",
  Viral: "border-primary/60 text-primary bg-primary/10",
  Legendary: "border-secondary/60 text-secondary bg-secondary/10",
};

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);
  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;
    let raf = 0;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

function timeAgo(iso?: string) {
  if (!iso) return "—";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

export default function ProofOfSupportOracle({ initialData = null }: { initialData?: OracleData | null }) {
  const [data, setData] = useState<OracleData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [runningStep, setRunningStep] = useState<number>(-1);
  const [progress, setProgress] = useState(0);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [lastReward, setLastReward] = useState<number | null>(null);

  const load = async () => {
    const { data: res, error } = await supabase.rpc("get_oracle_dashboard");
    if (error) return;
    setData(res as unknown as OracleData);
  };

  useEffect(() => { setData(initialData); }, [initialData]);
  useEffect(() => { if (!initialData) load(); }, [initialData]);

  const sync = async () => {
    setLoading(true);
    setProgress(5);
    setRunningStep(0);
    setPrevScore(data?.latest?.groove_score ?? null);

    const stepTimer = setInterval(() => {
      setRunningStep((s) => {
        const next = Math.min(s + 1, WORKFLOW_STEPS.length - 1);
        setProgress(Math.min(92, 10 + next * 18));
        return next;
      });
    }, 700);

    try {
      const { data: res, error } = await supabase.functions.invoke("oracle-analyze", {
        body: { trigger: "manual_sync" },
      });
      clearInterval(stepTimer);
      if (error) throw error;
      const r = res as OracleSyncResponse;
      if (!r?.success) throw new Error(r?.error || "Falha ao conectar Oracle. Tente novamente.");

      setRunningStep(WORKFLOW_STEPS.length - 1);
      setProgress(100);

      const reward = Math.max(40, Math.round((r.grooveScore ?? 0) * 0.15));
      setLastReward(reward);

      toast.success(`Oracle sincronizado · +${reward} GRVM`, {
        description: `${r.rank ?? "Rookie"} · Score ${r.grooveScore}/1000`,
        icon: "⚡",
      });

      await load();
    } catch (e: unknown) {
      console.error("[Oracle CRE]", e);
      toast.error(e instanceof Error ? e.message : "Falha ao conectar Oracle. Tente novamente.", {
        description: "O Dashboard continuará exibindo o último score e histórico disponível.",
      });
      setProgress(0);
    } finally {
      clearInterval(stepTimer);
      setTimeout(() => { setRunningStep(-1); setLoading(false); setProgress(0); }, 900);
    }
  };

  const rawScore = Number(data?.latest?.groove_score ?? 0);
  const score = useCountUp(rawScore);
  const delta = useMemo(
    () => (prevScore !== null ? Math.round(rawScore - prevScore) : 0),
    [rawScore, prevScore],
  );
  const rank = data?.latest?.ai_rank ?? (rawScore >= 800 ? "Legendary" : rawScore >= 550 ? "Viral" : rawScore >= 300 ? "Rising" : "Rookie");
  const scoreColor = rawScore >= 700 ? "text-primary" : rawScore >= 400 ? "text-accent" : "text-muted-foreground";
  const shortHash = (h?: string) => h ? `${h.slice(0, 10)}...${h.slice(-6)}` : "0x000000";
  const ext = data?.latest?.external_data ?? {};
  const externalOffline = Boolean(ext.api_offline || ext.coingecko_ok === false || ext.musicbrainz_ok === false);
  const aiOffline = ext.ai_ok === false || (Array.isArray(ext.warnings) && ext.warnings.some((w) => String(w).toLowerCase().includes("ia")));

  return (
    <TooltipProvider delayDuration={150}>
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#0B1B2B]/95 via-background to-background p-5 md:p-6 box-glow-blue">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary blur-md" />
            </div>
            <span className="text-[10px] font-display uppercase tracking-[0.2em] text-primary">
              Powered by Chainlink CRE
            </span>
            <span className="text-[9px] font-display uppercase tracking-widest px-2 py-0.5 rounded-full border border-accent/40 text-accent bg-accent/5">
              Simulated CRE · Beta
            </span>
            {externalOffline && <StatusBadge label="External API Offline" />}
            {aiOffline && <StatusBadge label="IA temporariamente indisponível" />}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-primary transition-colors">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Workflow real: APIs (CoinGecko · MusicBrainz) + IA (Gemini) + persistência Supabase + prova onchain simulada.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <h2 className="font-display text-xl md:text-2xl font-black gradient-neon-text flex items-center gap-2">
            🎧 Proof of Support Oracle
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Última sincronização {timeAgo(data?.latest?.created_at)}.
          </p>
        </div>
        <Button onClick={sync} disabled={loading} size="sm"
          className="bg-gradient-to-r from-primary via-accent to-secondary text-background font-display font-bold shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] transition-shadow">
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sincronizando Oracle...</>
          ) : (
            <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync Oracle</>
          )}
        </Button>
      </div>

      {/* Progress bar */}
      {loading && (
        <div className="relative mb-4">
          <Progress value={progress} className="h-1.5 bg-background/60" />
          <div className="absolute inset-0 h-1.5 rounded-full pointer-events-none"
            style={{ boxShadow: `0 0 12px hsl(var(--primary) / ${progress > 0 ? 0.6 : 0})` }} />
        </div>
      )}

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Score */}
        <div className="md:col-span-1 rounded-xl border border-primary/30 bg-background/40 backdrop-blur p-4 relative overflow-hidden hover:border-primary/60 transition-colors">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            <Zap className="w-3 h-3 text-primary" /> Groove Score
          </div>
          <div className="flex items-end gap-2">
            <div className={`font-display text-5xl md:text-6xl font-black ${scoreColor} drop-shadow-[0_0_18px_hsl(var(--primary)/0.5)] inline-block tabular-nums`}>
              {score}
            </div>
            <div className="text-xs text-muted-foreground pb-2">/ 1000</div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-background/70 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-700"
              style={{ width: `${(rawScore / 1000) * 100}%`, boxShadow: "0 0 10px hsl(var(--primary) / 0.7)" }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-display uppercase tracking-wider ${RANK_STYLES[rank] ?? RANK_STYLES.Rookie}`}>
              <TrendingUp className="w-3 h-3" /> {rank}
            </span>
            {delta !== 0 && (
              <span className={`text-[10px] font-mono ${delta > 0 ? "text-primary" : "text-destructive"}`}>
                {delta > 0 ? "+" : ""}{delta} pts
              </span>
            )}
          </div>
          {lastReward !== null && !loading && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30 text-xs font-display text-accent flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> +{lastReward} GRVM recebidos
            </div>
          )}
        </div>

        {/* Workflow checklist */}
        <div className="md:col-span-2 rounded-xl border border-secondary/30 bg-background/40 backdrop-blur p-4 hover:border-secondary/60 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Activity className="w-3 h-3 text-secondary" /> Chainlink CRE Workflow
            </div>
            <span className="text-[10px] font-display text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> LIVE
            </span>
          </div>
          <div className="space-y-2">
            {WORKFLOW_STEPS.map((s, i) => {
              const isRunning = loading && i === runningStep;
              const isDone = (loading && i < runningStep) || (!loading && data?.latest && runningStep === -1);
              const Icon = s.icon;
              return (
                <div key={i} className={`flex items-center gap-3 text-xs transition-all ${
                  isDone || isRunning ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                    isDone ? "border-primary/50 bg-primary/10 text-primary"
                    : isRunning ? "border-accent/50 bg-accent/10 text-accent animate-pulse"
                    : "border-border/40 text-muted-foreground/40"
                  }`}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" />
                    : isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="flex-1 font-mono">{s.label}</span>
                  <span className={`text-[10px] font-display uppercase ${
                    isDone ? "text-primary" : isRunning ? "text-accent" : "text-muted-foreground/40"
                  }`}>
                    {isRunning ? "running" : isDone ? "✓ ok" : "idle"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insight */}
        <div className="md:col-span-2 rounded-xl border border-accent/30 bg-background/40 backdrop-blur p-4 relative overflow-hidden hover:border-accent/60 transition-colors">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-accent/20 blur-3xl" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            <Brain className="w-3 h-3 text-accent" /> IA Insights · Gemini
          </div>
          {data?.latest?.ai_profile && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-[10px] font-display uppercase tracking-wider text-accent">
              <Sparkles className="w-3 h-3" /> {data.latest.ai_profile}
            </div>
          )}
          <p className="font-display text-sm md:text-base leading-relaxed text-foreground/90">
            {data?.latest?.ai_insight ?? "Clique em Sync Oracle para rodar o workflow CRE e gerar sua análise."}
          </p>
        </div>

        {/* Onchain Proof */}
        <div className="md:col-span-1 rounded-xl border border-primary/40 bg-[#050b12]/80 backdrop-blur p-4 font-mono hover:border-primary/70 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Link2 className="w-3 h-3 text-primary" /> Onchain Proof
            </div>
            {data?.latest && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/15 border border-primary/40 text-[9px] uppercase tracking-wider text-primary">
                <ShieldCheck className="w-2.5 h-2.5" /> Verified
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground/70">$ hash</div>
          <div className="text-[11px] text-primary break-all leading-tight">
            {shortHash(data?.latest?.tx_hash)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">
            Block #{data?.latest?.block_number?.toLocaleString() ?? "—"}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mt-2">
            Status: {data?.latest ? "VERIFIED" : "PENDING"}
          </div>
        </div>

        {/* External signals */}
        <div className="md:col-span-3 rounded-xl border border-border/40 bg-background/40 backdrop-blur p-4 hover:border-accent/40 transition-colors">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            <Globe className="w-3 h-3 text-accent" /> Sinais externos consultados
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
            <ExtCell label="ETH/USD" value={ext.eth_usd ? `$${Number(ext.eth_usd).toLocaleString()}` : "—"} />
            <ExtCell label="ETH 24h" value={ext.eth_change_24h != null ? `${Number(ext.eth_change_24h).toFixed(2)}%` : "—"}
              color={Number(ext.eth_change_24h ?? 0) >= 0 ? "text-primary" : "text-destructive"} />
            <ExtCell label="Trending" value={Array.isArray(ext.trending) && ext.trending.length ? ext.trending.map(String).join(" · ") : String(ext.trending_coin ?? "—")} />
            <ExtCell label="Music seed" value={String(ext.artistSeed ?? ext.music_seed ?? "—")} truncate />
          </div>
          {(externalOffline || aiOffline) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {externalOffline && <StatusBadge label="External API Offline" />}
              {aiOffline && <StatusBadge label="IA temporariamente indisponível" />}
            </div>
          )}
        </div>

        {/* History */}
        <div className="md:col-span-3 rounded-xl border border-border/40 bg-background/40 backdrop-blur p-4 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Cpu className="w-3 h-3 text-primary" /> Histórico de sincronizações
            </div>
            <span className="text-[10px] text-muted-foreground">{data?.history?.length ?? 0} execuções</span>
          </div>
          {!data?.history?.length ? (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhuma execução ainda.</p>
          ) : (
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {data.history.map((h) => {
                const reward = Math.max(40, Math.round(h.score * 0.15));
                return (
                  <div key={h.id} className="flex items-center gap-3 text-[11px] font-mono p-2 rounded-md hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all">
                    <span className="text-muted-foreground/70 w-12">
                      {new Date(h.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-primary font-bold w-20">Score {Math.round(h.score)}</span>
                    {h.rank && <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${RANK_STYLES[h.rank] ?? RANK_STYLES.Rookie}`}>{h.rank}</span>}
                    <span className="text-accent">+{reward} GRVM</span>
                    <span className="text-muted-foreground/60 truncate flex-1 text-right">{shortHash(h.tx_hash)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-destructive/40 bg-destructive/10 text-destructive text-[9px] font-display uppercase tracking-wider">
      <AlertTriangle className="w-3 h-3" /> ⚠ {label}
    </span>
  );
}

function ExtCell({ label, value, color, truncate }: { label: string; value: string; color?: string; truncate?: boolean }) {
  return (
    <div className="rounded-md border border-border/40 bg-background/60 px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70">{label}</div>
      <div className={`text-[12px] ${color ?? "text-foreground"} ${truncate ? "truncate" : ""}`}>{value}</div>
    </div>
  );
}
