import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity, Brain, CheckCircle2, Cpu, HelpCircle, Link2, Loader2,
  RefreshCw, ShieldCheck, Sparkles, TrendingUp, Zap,
} from "lucide-react";
import { toast } from "sonner";

interface OracleData {
  latest: {
    groove_score: number;
    ai_insight: string;
    ai_profile: string;
    tx_hash: string;
    block_number: number;
    workflow_status: string;
    created_at: string;
  } | null;
  metrics: any;
  history: Array<{
    id: string;
    score: number;
    insight: string;
    tx_hash: string;
    block_number: number;
    trigger_event: string;
    created_at: string;
  }>;
}

const WORKFLOW_STEPS = [
  { label: "Coletando métricas", icon: Activity },
  { label: "Consultando APIs externas", icon: Link2 },
  { label: "IA analisando perfil", icon: Brain },
  { label: "Registrando prova onchain", icon: ShieldCheck },
  { label: "Calculando Groove Score", icon: Zap },
];

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
      setRunningStep(s => {
        const next = Math.min(s + 1, WORKFLOW_STEPS.length - 1);
        setProgress(Math.min(95, 10 + next * 18));
        return next;
      });
    }, 650);

    try {
      const { data: res, error } = await supabase.functions.invoke("oracle-analyze", {
        body: { trigger: "manual_sync" },
      });
      clearInterval(stepTimer);
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).message || (res as any).error);

      setRunningStep(WORKFLOW_STEPS.length - 1);
      setProgress(100);

      const newScore = Number((res as any).groove_score ?? 0);
      const reward = Math.max(40, Math.round(newScore * 15));
      setLastReward(reward);

      toast.success(`+${reward} GRV recebidos`, {
        description: "Atividade social validada pelo Oracle CRE",
        icon: "⚡",
      });

      await load();
    } catch (e: any) {
      console.error("[Groovium Dashboard]", e);
      toast.error(e?.message ?? "Falha ao sincronizar oracle");
      setProgress(0);
    } finally {
      clearInterval(stepTimer);
      setTimeout(() => { setRunningStep(-1); setLoading(false); setProgress(0); }, 1200);
    }
  };

  const score = data?.latest?.groove_score ?? 0;
  const delta = useMemo(
    () => (prevScore !== null ? Number((score - prevScore).toFixed(2)) : 0),
    [score, prevScore]
  );
  const scoreColor = score >= 7 ? "text-primary" : score >= 4 ? "text-accent" : "text-muted-foreground";
  const scoreLabel = score >= 8 ? "Em ascensão" : score >= 5 ? "Em crescimento" : score >= 2 ? "Despertando" : "Iniciante";
  const shortHash = (h?: string) => h ? `${h.slice(0, 10)}...${h.slice(-6)}` : "0x000000";

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
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-primary transition-colors">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">O Oracle CRE conecta IA, dados externos e blockchain para validar reputação musical dentro do Groovium.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <h2 className="font-display text-xl md:text-2xl font-black gradient-neon-text flex items-center gap-2">
            🎧 Proof of Support Oracle
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Blockchain e reputação onchain simuladas para demonstração do ecossistema.
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
            <div className={`font-display text-5xl md:text-6xl font-black ${scoreColor} drop-shadow-[0_0_18px_hsl(var(--primary)/0.5)] inline-block`}>
              {score.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground pb-2">/ 10</div>
          </div>
          {/* Visual neon bar */}
          <div className="mt-3 h-1.5 rounded-full bg-background/70 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-700"
              style={{ width: `${(score / 10) * 100}%`, boxShadow: "0 0 10px hsl(var(--primary) / 0.7)" }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-display uppercase tracking-wider text-primary">
              <TrendingUp className="w-3 h-3" /> {scoreLabel}
            </span>
            {delta !== 0 && (
              <span className={`text-[10px] font-mono ${delta > 0 ? "text-primary" : "text-destructive"}`}>
                {delta > 0 ? "+" : ""}{delta.toFixed(2)} hoje
              </span>
            )}
          </div>
          {lastReward !== null && !loading && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30 text-xs font-display text-accent flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> +{lastReward} GRV recebidos
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
            <Brain className="w-3 h-3 text-accent" /> IA Insights
          </div>
          {data?.latest?.ai_profile && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-[10px] font-display uppercase tracking-wider text-accent">
              <Sparkles className="w-3 h-3" /> {data.latest.ai_profile}
            </div>
          )}
          <p className="font-display text-sm md:text-base leading-relaxed text-foreground/90">
            {data?.latest?.ai_insight ?? "Clique em Sync Oracle para gerar sua primeira análise de IA."}
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

        {/* History */}
        <div className="md:col-span-3 rounded-xl border border-border/40 bg-background/40 backdrop-blur p-4 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Cpu className="w-3 h-3 text-primary" /> Últimas sincronizações
            </div>
            <span className="text-[10px] text-muted-foreground">
              Last sync: {data?.latest?.created_at ? new Date(data.latest.created_at).toLocaleTimeString("pt-BR") : "—"}
            </span>
          </div>
          {!data?.history?.length ? (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhuma execução ainda.</p>
          ) : (
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {data.history.map((h) => {
                const reward = Math.max(40, Math.round(h.score * 15));
                return (
                  <div key={h.id} className="flex items-center gap-3 text-[11px] font-mono p-2 rounded-md hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all">
                    <span className="text-muted-foreground/70 w-12">
                      {new Date(h.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-primary font-bold">Score {h.score.toFixed(2)}</span>
                    <span className="text-accent">+{reward} GRV</span>
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
