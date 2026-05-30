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

export type StepStatus = "idle" | "running" | "success" | "failed" | "simulated";

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
      const hasHash = !!(r.oracleHash || r.txHash);

      setStepStatus(prev => ({
        ...prev,
        read: "success", group: "success", cre: "success",
        ai: aiOk ? "success" : "simulated",
        score: "success",
        hash: r.oracleHash ? "success" : (hasHash ? "simulated" : "failed"),
        solana: solanaOk ? "success" : (hasHash ? "simulated" : "failed"),
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
            status === "success"   ? "border-primary/50 bg-primary/10 text-primary" :
            status === "simulated" ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300" :
            status === "running"   ? "border-accent/50 bg-accent/10 text-accent animate-pulse" :
            status === "failed"    ? "border-destructive/50 bg-destructive/10 text-destructive" :
                                     "border-border/40 text-muted-foreground/40";
          const textColor =
            status === "success" || status === "simulated" || status === "running" ? "text-foreground" :
            status === "failed"  ? "text-destructive" : "text-muted-foreground/50";
          const isSolanaStep = s.key === "solana";
          const tag =
            status === "running"   ? "running" :
            status === "success"   ? "✓ ok" :
            status === "simulated" ? (isSolanaStep ? "✓ simulado em devnet" : "✓ demo") :
            status === "failed"    ? "✗ failed" : "idle";
          const tagColor =
            status === "success"   ? "text-primary" :
            status === "simulated" ? "text-yellow-300" :
            status === "running"   ? "text-accent" :
            status === "failed"    ? "text-destructive" : "text-muted-foreground/40";
          return (
            <div key={s.key} className={`flex items-center gap-3 text-xs transition-colors ${textColor}`}>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${color}`}>
                {status === "success" || status === "simulated" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
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
  const checklist = [
    { label: "Ações verificáveis capturadas", ok: result.actionsAnalyzed > 0 },
    { label: "Pontuação de reputação calculada", ok: result.grooveScore > 0 },
    { label: "IA processou seu perfil musical", ok: !!result.archetype },
    { label: "Hash SHA-256 gerado", ok: !!result.oracleHash },
    { label: "Registro público na Solana Devnet", ok: result.chain === "solana-devnet" },
    { label: "Disponível no Explorer público", ok: !!result.explorerUrl },
  ];
  return (
    <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-background/40 to-accent/10 p-4 md:p-5 space-y-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0 animate-pulse">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-primary font-display">Sincronização concluída</div>
          <h3 className="font-display text-base md:text-lg font-bold gradient-neon-text">
            Suas ações viraram reputação verificável
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
            Lemos suas ações verificáveis, a IA analisou seu perfil de apoiador e geramos uma prova criptográfica
            registrada como registro público na Solana Devnet.
          </p>
        </div>
      </div>

      {/* Hero: score anterior → novo */}
      <div className="rounded-xl border border-primary/30 bg-background/60 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-end gap-3">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Antes</div>
              <div className="font-display text-2xl font-bold text-muted-foreground tabular-nums">{result.previousScore}</div>
            </div>
            <div className="text-2xl text-primary pb-1">→</div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-primary">Agora</div>
              <div className="font-display text-3xl md:text-4xl font-black gradient-neon-text tabular-nums">{result.grooveScore}</div>
            </div>
            <div className="text-[10px] text-muted-foreground pb-2">/ 1000</div>
            {delta !== 0 && (
              <div className={`text-xs font-mono font-bold pb-2 ${deltaColor}`}>
                {delta > 0 ? "+" : ""}{delta} pts
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2.5 py-1 rounded-full border text-[11px] font-display uppercase tracking-wider ${RANK_STYLES[result.rank]}`}>
              {result.rank}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Rank atual</span>
          </div>
        </div>
      </div>

      {/* Grid de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Tile label="Ações verificáveis" value={String(result.actionsAnalyzed)} />
        <Tile label="Perfil IA" value={result.archetype} valueClass="text-accent text-xs md:text-sm" />
        <Tile label="GRVM recebido" value={`+${result.bonusGrvm}`} valueClass="text-primary" hint="Bônus Oracle" hintClass="text-primary/70" />
        <Tile label="Prova on-chain" value={shortHash(result.oracleHash || result.txHash)} valueClass="text-xs md:text-sm font-mono" hint={result.chain} />
      </div>

      {result.reason && (
        <div className="rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="text-primary font-display uppercase tracking-wider text-[10px] mr-2">Por que essa pontuação</span>
          {result.reason}
        </div>
      )}
      {result.nextAction && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-foreground">
          <span className="text-accent font-display uppercase tracking-wider text-[10px] mr-2">Próxima ação sugerida</span>
          {result.nextAction}
        </div>
      )}

      {/* Checklist técnico discreto */}
      <details className="group rounded-lg border border-border/40 bg-background/40">
        <summary className="cursor-pointer select-none px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-display flex items-center justify-between">
          <span>Checklist técnico da sincronização</span>
          <span className="text-primary group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <ul className="px-3 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono">
          {checklist.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              {c.ok ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span className={c.ok ? "text-foreground" : "text-muted-foreground/60"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </details>

      {/* CTA verificação pública */}
      <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-border/30">
        <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 min-w-0">
          <Hash className="w-3 h-3 shrink-0" />
          <span className="truncate">{shortHash(result.oracleHash || result.txHash)}</span>
        </div>
        {result.explorerUrl ? (
          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-background text-xs font-display font-bold hover:bg-primary/90 transition-colors"
          >
            Ver no Explorer <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{result.chain}</span>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, hint, hintClass, valueClass }: { label: string; value: string; hint?: string; hintClass?: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/50 px-3 py-2 min-w-0">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground truncate">{label}</div>
      <div className={`font-display font-bold text-foreground tabular-nums truncate ${valueClass ?? "text-base"}`}>{value}</div>
      {hint && <div className={`text-[10px] font-mono truncate ${hintClass ?? "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}

/** Standalone card used on /app/oracle */
export function OracleSyncCard({ onSynced, headerExtra }: { onSynced?: (r: OracleSyncResult) => void; headerExtra?: React.ReactNode }) {
  const { running, stepStatus, progress, result, sync } = useOracleSync();
  return (
    <div className="glass-card rounded-2xl border border-primary/30 p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Radio className="w-4 h-4 text-primary" />
          <h2 className="font-display text-lg font-bold gradient-neon-text">Sync Oracle</h2>
          <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
            Chainlink CRE · IA · Solana Devnet
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {headerExtra}
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
      </div>
      <CreStepper stepStatus={stepStatus} progress={progress} running={running} />
      {result && <OracleResultPanel result={result} />}
    </div>
  );
}
