// Phase 2.5 — Modal "Ver demo guiada" do Proof of Support Oracle.
// Explica em 4 passos curtos como ações viram reputação verificável.
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Activity, Cpu, Brain, ShieldCheck, PlayCircle } from "lucide-react";

const STEPS = [
  {
    icon: Activity,
    title: "Suas ações viram Smart Actions",
    desc: "Curtir, seguir um artista, comprar um NFT ou completar uma missão gera uma ação verificável no Groovium.",
    tone: "text-primary border-primary/40 bg-primary/5",
  },
  {
    icon: Cpu,
    title: "Chainlink CRE orquestra a análise",
    desc: "O CRE coleta suas Smart Actions, executa o workflow e conecta dados, IA e blockchain em um único fluxo confiável.",
    tone: "text-secondary border-secondary/40 bg-secondary/5",
  },
  {
    icon: Brain,
    title: "IA entende seu perfil de apoiador",
    desc: "Um modelo de IA identifica seu arquétipo musical — de Trend Hunter a Genesis Supporter — com base no seu histórico.",
    tone: "text-accent border-accent/40 bg-accent/5",
  },
  {
    icon: ShieldCheck,
    title: "Solana registra a prova verificável",
    desc: "Uma prova criptográfica é publicada como registro público na Solana Devnet — qualquer pessoa pode auditar no Explorer.",
    tone: "text-primary border-primary/40 bg-primary/5",
  },
];

export function OracleDemoModal({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/10 font-display">
            <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Ver demo guiada
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-background/95 border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-display text-xl gradient-neon-text">
            🎧 Como o Oracle transforma você em reputação
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Em 4 passos: do clique até a prova pública na blockchain.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 mt-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={i} className={`flex gap-3 rounded-xl border p-3 ${s.tone}`}>
                <div className="w-9 h-9 shrink-0 rounded-lg bg-background/60 border border-current/30 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-display uppercase tracking-widest opacity-80">Passo {i + 1}</div>
                  <div className="font-display font-bold text-sm text-foreground">{s.title}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/30 text-xs text-muted-foreground">
          💡 Resultado: cada ação musical sua vira uma <strong className="text-primary">pontuação de reputação musical</strong> com prova pública na Solana Devnet.
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OracleDemoModal;
