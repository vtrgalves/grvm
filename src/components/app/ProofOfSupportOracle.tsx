import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, Brain, Cpu, Link2, RefreshCw, Sparkles, Zap } from "lucide-react";
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
  metrics: {
    missions_completed: number;
    nft_count: number;
    grv_balance: number;
    streak: number;
    boosts_active: number;
    interactions_total: number;
    updated_at: string;
  } | null;
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
  { label: "Fetch engagement metrics", icon: "📊" },
  { label: "External API · CoinGecko", icon: "🌐" },
  { label: "AI analysis · Lovable Gateway", icon: "🧠" },
  { label: "Compute Groove Score", icon: "⚡" },
  { label: "Simulated onchain record", icon: "🔗" },
];

export default function ProofOfSupportOracle({ initialData = null }: { initialData?: OracleData | null }) {
  const [data, setData] = useState<OracleData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [runningStep, setRunningStep] = useState<number | null>(null);

  const load = async () => {
    const { data: res, error } = await supabase.rpc("get_oracle_dashboard");
    if (error) return;
    setData(res as unknown as OracleData);
  };

  useEffect(() => { setData(initialData); }, [initialData]);
  useEffect(() => { if (!initialData) load(); }, [initialData]);

  // Auto pulse for "live oracle" effect
  useEffect(() => {
    const t = setInterval(() => setPulse(p => (p + 1) % 5), 2200);
    return () => clearInterval(t);
  }, []);

  const sync = async () => {
    setLoading(true);
    setRunningStep(0);
    const stepTimer = setInterval(() => {
      setRunningStep(s => (s === null || s >= WORKFLOW_STEPS.length - 1 ? s : s + 1));
    }, 700);
    try {
      const { data: res, error } = await supabase.functions.invoke("oracle-analyze", {
        body: { trigger: "manual_sync" },
      });
      clearInterval(stepTimer);
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).message || (res as any).error);
      setRunningStep(WORKFLOW_STEPS.length - 1);
      toast.success(`Groove Score atualizado: ${(res as any).groove_score}`);
      await load();
    } catch (e: any) {
      console.error("[Groovium Dashboard]", e);
      toast.error(e?.message ?? "Falha ao sincronizar oracle");
    } finally {
      clearInterval(stepTimer);
      setTimeout(() => { setRunningStep(null); setLoading(false); }, 800);
    }
  };

  const score = data?.latest?.groove_score ?? 0;
  const scoreColor = score >= 7 ? "text-primary" : score >= 4 ? "text-accent" : "text-muted-foreground";
  const shortHash = (h?: string) => h ? `${h.slice(0, 10)}...${h.slice(-6)}` : "0x000000";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#0B1B2B]/95 via-background to-background p-5 md:p-6 box-glow-blue">
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary blur-md" />
            </div>
            <span className="text-[10px] font-display uppercase tracking-[0.2em] text-primary">
              Powered by Chainlink CRE
            </span>
          </div>
          <h2 className="font-display text-xl md:text-2xl font-black gradient-neon-text flex items-center gap-2">
            🎧 Proof of Support Oracle
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Workflow CRE · IA · Métricas de engajamento on-chain (simulado)
          </p>
        </div>
        <Button onClick={sync} disabled={loading} size="sm"
          className="bg-gradient-to-r from-primary via-accent to-secondary text-background font-display font-bold">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Sincronizando..." : "Sync Oracle"}
        </Button>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Groove Score */}
        <div className="md:col-span-1 rounded-xl border border-primary/30 bg-background/40 backdrop-blur p-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            <Zap className="w-3 h-3 text-primary" /> Groove Score
          </div>
          <div className={`font-display text-5xl md:text-6xl font-black ${scoreColor} animate-pulse-glow inline-block`}>
            {score.toFixed(2)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">/ 10.00 · Reputação on-chain</div>
          {data?.latest?.ai_profile && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-[10px] font-display uppercase tracking-wider text-accent">
              <Sparkles className="w-3 h-3" /> {data.latest.ai_profile}
            </div>
          )}
        </div>

        {/* Card 2: CRE Activity */}
        <div className="md:col-span-2 rounded-xl border border-secondary/30 bg-background/40 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Activity className="w-3 h-3 text-secondary" /> Chainlink CRE Activity
            </div>
            <span className="text-[10px] font-display text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> LIVE
            </span>
          </div>
          <div className="space-y-1.5">
            {WORKFLOW_STEPS.map((s, i) => {
              const isActive = runningStep !== null && i <= runningStep;
              const isDone = !loading && data?.latest;
              const ok = isActive || isDone;
              return (
                <div key={i} className={`flex items-center gap-2 text-xs transition-all ${
                  ok ? "text-foreground" : "text-muted-foreground/50"
                } ${i === pulse && !loading ? "translate-x-0.5" : ""}`}>
                  <span className="text-sm">{s.icon}</span>
                  <span className="flex-1 font-mono truncate">{s.label}</span>
                  <span className={`text-[10px] font-display uppercase ${ok ? "text-primary" : "text-muted-foreground/40"}`}>
                    {isActive && i === runningStep ? "running" : ok ? "✓ ok" : "idle"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: AI Insight */}
        <div className="md:col-span-2 rounded-xl border border-accent/30 bg-background/40 backdrop-blur p-4 relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-accent/20 blur-3xl" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            <Brain className="w-3 h-3 text-accent" /> IA Insights
          </div>
          <p className="font-display text-sm md:text-base leading-relaxed text-foreground/90">
            {data?.latest?.ai_insight ?? "Clique em Sync Oracle para gerar sua primeira análise de IA."}
          </p>
        </div>

        {/* Card 4: Onchain Proof */}
        <div className="md:col-span-1 rounded-xl border border-primary/30 bg-background/40 backdrop-blur p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            <Link2 className="w-3 h-3 text-primary" /> Onchain Proof
          </div>
          <div className="font-mono text-[11px] text-primary break-all leading-tight">
            {shortHash(data?.latest?.tx_hash)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">
            Block #{data?.latest?.block_number?.toLocaleString() ?? "—"}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70 mt-2">
            Simulated · CRE proof
          </div>
        </div>

        {/* Card 5: History feed */}
        <div className="md:col-span-3 rounded-xl border border-border/40 bg-background/40 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Cpu className="w-3 h-3 text-primary" /> Oracle Sync History
            </div>
            <span className="text-[10px] text-muted-foreground">
              Last sync: {data?.latest?.created_at ? new Date(data.latest.created_at).toLocaleTimeString("pt-BR") : "—"}
            </span>
          </div>
          {!data?.history?.length ? (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhuma execução ainda.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {data.history.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-[11px] font-mono p-1.5 rounded hover:bg-muted/20">
                  <span className="text-primary">{h.score.toFixed(2)}</span>
                  <span className="text-muted-foreground truncate flex-1">{shortHash(h.tx_hash)}</span>
                  <span className="text-accent/80 text-[10px] uppercase">{h.trigger_event}</span>
                  <span className="text-muted-foreground/60 text-[10px]">
                    {new Date(h.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
