// Phase 2 — CRE Stepper ao vivo + bloco "O que aconteceu agora?"
// Reutilizado no Dashboard e na página /app/oracle.
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Brain, CheckCircle2, Cpu, ExternalLink, Hash, Layers, Loader2,
  RefreshCw, ShieldCheck, Sparkles, XCircle, Zap, Radio,
} from "lucide-react";
import { toast } from "sonner";
import { normalizeRank, rankForScore, RANK_STYLES, type OracleRank } from "@/lib/oracle";

export type StepStatus = "idle" | "running" | "success" | "failed";

export type OracleSyncResult = {
  success: boolean;
  grooveScore: number;
  previousScore: number;
  rank: OracleRank;
  archetype: string;
  insight: string;
  reason: string;
  nextAction: string;
  bonusGrvm: number;
  actionsAnalyzed: number;
  oracleHash: string | null;
  txHash: string;
  chain: string;
  explorerUrl: string | null;
  syncId: string | null;
};

const STEPS = [
  { key: "read",     label: "Lendo Smart Actions",                icon: Activity },
  { key: "group",    label: "Agrupando interações",               icon: Layers },
  { key: "cre",      label: "Chainlink CRE orquestrando workflow", icon: Cpu },
  { key: "ai",       label: "IA analisando perfil musical",       icon: Brain },
  { key: "score",    label: "Calculando GRVM Reputation Score",   icon: Zap },
  { key: "hash",     label: "Gerando SHA-256 Oracle Proof",       icon: Hash },
  { key: "solana",   label: "Registrando memo na Solana Devnet",  icon: ShieldCheck },
  { key: "done",     label: "Sincronização concluída",            icon: Sparkles },
] as const;
type StepKey = typeof STEPS[number]["key"];

function shortHash(h?: string | null) {
  if (!h) return "—";
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

export function useOracleSync() {
  const [running, setRunning] = useState(false);
  const [stepStatus, setStepStatus] = useState<Record<StepKey, StepStatus>>(
    () => Object.fromEntries(STEPS.map(s => [s.key, "idle"])) as Record<StepKey, StepStatus>,
  );
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OracleSyncResult | null>(null);

  const reset = () => {
    setStepStatus(Object.fromEntries(STEPS.map(s => [s.key, "idle"])) as Record<StepKey, StepStatus>);
    setProgress(0);
  };

  const sync = async (onSuccess?: (r: OracleSyncResult) => void) => {
    if (running) return;
    setRunning(true);
    reset();

    // Animate first 6 steps sequentially; the last 2 (solana + done) wait for the server.
    const animatedKeys: StepKey[] = ["read", "group", "cre", "ai", "score", "hash"];
    let cancelled = false;
    let stepIdx = 0;
    setStepStatus(prev => ({ ...prev, [animatedKeys[0]]: "running" }));
    setProgress(8);
    const timer = setInterval(() => {
      if (cancelled) return;
      setStepStatus(prev => {
        const next = { ...prev };
        const cur = animatedKeys[stepIdx];
        next[cur] = "success";
        stepIdx += 1;
        if (stepIdx < animatedKeys.length) next[animatedKeys[stepIdx]] = "running";
        return next;
      });
      setProgress(p => Math.min(75, p + 11));
      if (stepIdx >= animatedKeys.length) clearInterval(timer);
    }, 550);

    try {
      setStepStatus(prev => ({ ...prev, solana: "running" }));
      const { data, error } = await supabase.functions.invoke("oracle-analyze", {
        body: { trigger: "manual_sync" },
      });
      cancelled = true;
      clearInterval(timer);
      if (error) throw error;
      const r = data as any;
      if (!r?.success) throw new Error(r?.error || "Falha ao conectar Oracle");

      const solanaOk = r.chain === "solana-devnet";
      const aiOk = r.externalData?.ai_ok !== false;

      setStepStatus(prev => ({
        ...prev,
        read: "success", group: "success", cre: "success",
        ai: aiOk ? "success" : "failed",
        score: "success", hash: r.oracleHash ? "success" : "failed",
        solana: solanaOk ? "success" : "failed",
        done: "success",
      }));
      setProgress(100);

      const out: OracleSyncResult = {
        success: true,
        grooveScore: Number(r.grooveScore ?? 0),
        previousScore: Number(r.previousScore ?? 0),
        rank: normalizeRank(r.rank, Number(r.grooveScore ?? 0)),
        archetype: String(r.archetype ?? "Strategic Observer"),
        insight: String(r.insight ?? ""),
        reason: String(r.reason ?? ""),
        nextAction: String(r.nextAction ?? ""),
        bonusGrvm: Number(r.bonusGrvm ?? 0),
        actionsAnalyzed: Number(r.actionsAnalyzed ?? 0),
        oracleHash: r.oracleHash ?? null,
        txHash: String(r.txHash ?? ""),
        chain: String(r.chain ?? "simulated"),
        explorerUrl: r.explorerUrl ?? null,
        syncId: r.syncId ?? null,
      };
      setResult(out);
      toast.success(
        out.bonusGrvm > 0
          ? `Oracle sincronizado · +${out.bonusGrvm} GRVM`
          : "Oracle sincronizado",
        { description: `${out.archetype} · ${out.rank} · ${out.grooveScore}/1000`, icon: "🎧" },
      );
      onSuccess?.(out);
    } catch (e: any) {
      cancelled = true;
      clearInterval(timer);
      setStepStatus(prev => {
        const next = { ...prev };
        for (const k of Object.keys(next) as StepKey[]) {
          if (next[k] === "running") next[k] = "failed";
        }
        return next;
      });
      toast.error(e?.message ?? "Falha ao conectar Oracle. Tente novamente.");
    } finally {
      setTimeout(() => setRunning(false), 600);
    }
  };

  return { running, stepStatus, progress, result, sync, reset };
}

export function CreStepper({
  stepStatus, progress, running,
}: { stepStatus: Record<StepKey, StepStatus>; progress: number; running: boolean }) {
  return (
    <div className="rounded-xl border border-secondary/30 bg-background/40 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Activity className="w-3 h-3 text-secondary" /> Chainlink CRE · Workflow ao vivo
        </div>
        <span className="text-[10px] font-display text-primary flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full bg-primary ${running ? "animate-pulse" : ""}`} /> LIVE
        </span>
      </div>
      {(running || progress > 0) && (
        <Progress value={progress} className="h-1 mb-3 bg-background/60" />
      )}
      <div className="space-y-1.5">
        {STEPS.map((s) => {
          const status = stepStatus[s.key];
          const Icon = s.icon;
          const color =
            status === "success" ? "border-primary/50 bg-primary/10 text-primary" :
            status === "running" ? "border-accent/50 bg-accent/10 text-accent animate-pulse" :
            status === "failed"  ? "border-destructive/50 bg-destructive/10 text-destructive" :
                                   "border-border/40 text-muted-foreground/40";
          const textColor =
            status === "success" ? "text-foreground" :
            status === "running" ? "text-foreground" :
            status === "failed"  ? "text-destructive" : "text-muted-foreground/50";
          const tag =
            status === "running" ? "running" :
            status === "success" ? "✓ ok" :
            status === "failed"  ? "✗ failed" : "idle";
          const tagColor =
            status === "success" ? "text-primary" :
            status === "running" ? "text-accent" :
            status === "failed"  ? "text-destructive" : "text-muted-foreground/40";
          return (
            <div key={s.key} className={`flex items-center gap-3 text-xs transition-colors ${textColor}`}>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${color}`}>
                {status === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                 status === "running" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                 status === "failed"  ? <XCircle className="w-3.5 h-3.5" /> :
                                        <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className="flex-1 font-mono">{s.label}</span>
              <span className={`text-[10px] font-display uppercase ${tagColor}`}>{tag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OracleResultPanel({ result }: { result: OracleSyncResult }) {
  const delta = result.grooveScore - result.previousScore;
  const deltaColor = delta > 0 ? "text-primary" : delta < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background/40 to-accent/5 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-primary font-display">O que aconteceu agora?</div>
          <p className="text-sm text-foreground mt-1 leading-relaxed">
            Analisamos suas interações no Groovium, calculamos sua reputação musical, geramos uma prova criptográfica
            e registramos um resumo verificável na Solana Devnet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Tile label="Smart Actions" value={String(result.actionsAnalyzed)} />
        <Tile label="Score anterior" value={String(result.previousScore)} hint={`Delta ${delta >= 0 ? "+" : ""}${delta}`} hintClass={deltaColor} />
        <Tile label="Score novo" value={`${result.grooveScore}/1000`} />
        <Tile label="GRVM recebido" value={`+${result.bonusGrvm}`} hintClass="text-accent" hint="Bônus Oracle" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Arquétipo IA</span>
        <span className="px-2 py-0.5 rounded-full border border-accent/50 bg-accent/10 text-accent text-[11px] font-display uppercase tracking-wider">
          {result.archetype}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-2">Rank</span>
        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-display uppercase tracking-wider ${RANK_STYLES[result.rank]}`}>
          {result.rank}
        </span>
      </div>

      {result.reason && (
        <div className="rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="text-primary font-display uppercase tracking-wider text-[10px] mr-2">Por que esse score</span>
          {result.reason}
        </div>
      )}
      {result.nextAction && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-foreground">
          <span className="text-accent font-display uppercase tracking-wider text-[10px] mr-2">Próxima ação</span>
          {result.nextAction}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/30">
        <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {shortHash(result.oracleHash || result.txHash)}</span>
        <span className="uppercase tracking-wider">{result.chain}</span>
        {result.explorerUrl && (
          <a href={result.explorerUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
            Ver no Solana Explorer <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, hint, hintClass }: { label: string; value: string; hint?: string; hintClass?: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/50 px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-base text-foreground tabular-nums">{value}</div>
      {hint && <div className={`text-[10px] font-mono ${hintClass ?? "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}

/** Standalone card used on /app/oracle */
export function OracleSyncCard({ onSynced }: { onSynced?: (r: OracleSyncResult) => void }) {
  const { running, stepStatus, progress, result, sync } = useOracleSync();
  return (
    <div className="glass-card rounded-2xl border border-primary/30 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" />
          <h2 className="font-display text-lg font-bold gradient-neon-text">Sync Oracle</h2>
          <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
            Chainlink CRE · IA · Solana Devnet
          </span>
        </div>
        <Button
          onClick={() => sync(onSynced)}
          disabled={running}
          size="sm"
          className="bg-gradient-to-r from-primary via-accent to-secondary text-background font-display font-bold"
        >
          {running ? (<><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sincronizando…</>)
                   : (<><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync Oracle</>)}
        </Button>
      </div>
      <CreStepper stepStatus={stepStatus} progress={progress} running={running} />
      {result && <OracleResultPanel result={result} />}
    </div>
  );
}
