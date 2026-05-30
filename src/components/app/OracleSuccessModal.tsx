// Phase 2.6 — Premium success popup ("momento uau") after a Sync Oracle run.
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Hash, Sparkles, Activity, Cpu, Brain, ShieldCheck, History, Search } from "lucide-react";
import { RANK_STYLES } from "@/lib/oracle";
import { ChainlinkLogo } from "@/components/web3/ChainlinkLogo";
import { SolanaLogo } from "@/components/web3/SolanaLogo";
import type { OracleSyncResult } from "@/components/app/OracleSyncPanel";
import { Link } from "react-router-dom";

function useCountUp(target: number, duration = 1000) {
  const [v, setV] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    fromRef.current = v;
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return v;
}

function shortHash(h?: string | null) {
  if (!h) return "—";
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

export function OracleSuccessModal({
  open, onOpenChange, result,
}: { open: boolean; onOpenChange: (v: boolean) => void; result: OracleSyncResult | null }) {
  const score = useCountUp(result?.grooveScore ?? 0);
  if (!result) return null;
  const delta = result.grooveScore - result.previousScore;
  const isDemo = result.chain !== "solana-devnet";
  const explorerHref = result.explorerUrl;

  const steps = [
    { label: "Smart Actions capturadas", icon: Activity, ok: result.actionsAnalyzed > 0 },
    { label: "Chainlink CRE orquestrou", icon: Cpu, ok: true },
    { label: "IA analisou seu perfil", icon: Brain, ok: !!result.archetype },
    { label: "SHA-256 Oracle Proof", icon: Hash, ok: !!result.oracleHash },
    { label: isDemo ? "Solana Devnet (demo)" : "Solana Devnet", icon: ShieldCheck, ok: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background/95 border-primary/40 p-0 overflow-hidden">
        {/* Glow background */}
        <div className="relative">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

          <div className="relative p-6 md:p-7 space-y-5">
            {/* Momento UAU */}
            <div className="text-center space-y-1.5">
              <div className="text-3xl">🎵</div>
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="font-display text-xl md:text-2xl font-black gradient-neon-text">
                  Seu apoio virou reputação verificável
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto">
                  Você não apenas consumiu música. Você ajudou a construir valor para a comunidade.
                  Esse é o coração do Groovium.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Score hero */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background/40 to-accent/10 p-5 text-center animate-fade-in">
              <div className="text-[10px] uppercase tracking-widest text-primary font-display mb-1">
                Proof of Support Score
              </div>
              <div className="flex items-end justify-center gap-2">
                <span className="font-display text-2xl text-muted-foreground tabular-nums">{result.previousScore}</span>
                <span className="text-2xl text-primary pb-1">→</span>
                <span className="font-display text-5xl md:text-6xl font-black gradient-neon-text tabular-nums drop-shadow-[0_0_24px_hsl(var(--primary)/0.45)]">
                  {score}
                </span>
                <span className="text-xs text-muted-foreground pb-3">/ 1000</span>
              </div>
              {delta !== 0 && (
                <div className={`mt-1 text-sm font-mono font-bold ${delta > 0 ? "text-primary" : "text-destructive"}`}>
                  {delta > 0 ? "+" : ""}{delta} pts de reputação
                </div>
              )}
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Kpi label="GRVM recebido" value={`+${result.bonusGrvm}`} accent="text-primary" />
              <Kpi label="Rank atual" valueRender={
                <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-display uppercase tracking-wider ${RANK_STYLES[result.rank]}`}>
                  {result.rank}
                </span>
              } />
              <Kpi label="Perfil IA" value={result.archetype} accent="text-accent" small />
              <Kpi label="Ações verificadas" value={String(result.actionsAnalyzed)} />
              <Kpi label="Prova" value={shortHash(result.oracleHash || result.txHash)} mono small />
              <Kpi
                label="Registro"
                valueRender={
                  isDemo ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-[10px] font-display uppercase tracking-wider">
                      ✓ Simulado em Devnet
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-[10px] font-display uppercase tracking-wider">
                      ✓ Solana Devnet
                    </span>
                  )
                }
              />
            </div>

            {/* Workflow checklist */}
            <div className="rounded-xl border border-border/40 bg-background/40 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-2">
                Workflow verificável
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {steps.map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-[11px] font-mono">
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${s.ok ? "text-primary" : "text-muted-foreground/40"}`} />
                    <span className={s.ok ? "text-foreground" : "text-muted-foreground/60"}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Powered by */}
            <div className="flex items-center justify-center gap-4 flex-wrap text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Powered by</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-secondary/40 bg-secondary/5 text-secondary">
                <ChainlinkLogo className="w-3.5 h-3.5" /> Chainlink CRE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/40 bg-primary/5 text-primary">
                <SolanaLogo className="w-3.5 h-3.5" /> Solana Devnet
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <Link to="/app/oracle" className="flex-1" onClick={() => onOpenChange(false)}>
                <Button variant="outline" className="w-full border-accent/40 text-accent hover:bg-accent/10">
                  <History className="w-4 h-4 mr-1.5" /> Ver Oracle History
                </Button>
              </Link>
              <Link to="/app/explorer" className="flex-1" onClick={() => onOpenChange(false)}>
                <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10">
                  <Search className="w-4 h-4 mr-1.5" /> Ver Explorer
                </Button>
              </Link>
              {explorerHref && (
                <a href={explorerHref} target="_blank" rel="noreferrer" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-primary via-accent to-secondary text-background font-display font-bold">
                    Solana <ExternalLink className="w-4 h-4 ml-1.5" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Kpi({ label, value, valueRender, accent, mono, small }: {
  label: string; value?: string; valueRender?: React.ReactNode; accent?: string; mono?: boolean; small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/50 px-3 py-2 min-w-0">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground truncate">{label}</div>
      <div className={`font-display font-bold tabular-nums truncate ${small ? "text-sm" : "text-base"} ${mono ? "font-mono" : ""} ${accent ?? "text-foreground"}`}>
        {valueRender ?? value}
      </div>
    </div>
  );
}

/** Modal for individual Premium Proofs registered on Solana Devnet. */
export type PremiumProofView = {
  label: string;
  icon?: string;
  txHash: string | null;
  explorerUrl: string | null;
  reputationDelta: number;
  chain?: string | null;
  createdAt?: string;
};

export function PremiumProofModal({
  open, onOpenChange, proofs, count,
}: { open: boolean; onOpenChange: (v: boolean) => void; proofs: PremiumProofView[]; count: number }) {
  const main = proofs[0];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background/95 border-accent/40 p-0 overflow-hidden">
        <div className="relative">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

          <div className="relative p-6 md:p-7 space-y-5">
            <div className="text-center space-y-1.5">
              <div className="text-3xl">🏆</div>
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="font-display text-xl md:text-2xl font-black gradient-neon-text">
                  Marco registrado na blockchain
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
                  {count > 1
                    ? `${count} conquistas receberam provas individuais na Solana Devnet e agora fazem parte da sua reputação pública verificável.`
                    : "Esta ação recebeu uma prova individual na Solana Devnet e agora faz parte da sua reputação pública verificável."}
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* On-chain verified seal */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/50 bg-primary/10 text-primary font-display text-xs uppercase tracking-widest shadow-[0_0_24px_hsl(var(--primary)/0.4)] animate-pulse">
                <ShieldCheck className="w-4 h-4" /> On-chain Verified
              </div>
            </div>

            {/* Proofs list */}
            <div className="rounded-xl border border-accent/30 bg-background/50 divide-y divide-border/30 max-h-72 overflow-y-auto">
              {proofs.map((p, i) => {
                const isDemo = p.chain && p.chain !== "solana-devnet";
                return (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="text-2xl shrink-0">{p.icon ?? "✨"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm font-bold truncate">{p.label}</div>
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                        <Hash className="w-3 h-3" /> {shortHash(p.txHash)}
                        {isDemo ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 uppercase tracking-wider">demo devnet</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 uppercase tracking-wider">on-chain</span>
                        )}
                        {p.explorerUrl && (
                          <a href={p.explorerUrl} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">
                            explorer <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="font-display font-bold text-sm text-accent shrink-0">+{p.reputationDelta} REP</div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Powered by</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-secondary/40 bg-secondary/5 text-secondary">
                <ChainlinkLogo className="w-3.5 h-3.5" /> Chainlink CRE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/40 bg-primary/5 text-primary">
                <SolanaLogo className="w-3.5 h-3.5" /> Solana Devnet
              </span>
            </div>

            <div className="flex gap-2">
              {main?.explorerUrl && (
                <a href={main.explorerUrl} target="_blank" rel="noreferrer" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-accent to-primary text-background font-display font-bold">
                    Ver no Solana Explorer <ExternalLink className="w-4 h-4 ml-1.5" />
                  </Button>
                </a>
              )}
              <Button variant="outline" className="flex-1 border-border/50" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
