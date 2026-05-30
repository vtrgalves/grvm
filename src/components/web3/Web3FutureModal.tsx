import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChainlinkLogo } from "./ChainlinkLogo";
import { SolanaLogo } from "./SolanaLogo";
import { Check, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const today = [
  "Missões e interações verificáveis",
  "Proof of Support Oracle",
  "Reputation Score musical",
  "IA de perfil comportamental",
  "Oracle Sync com Chainlink CRE",
  "Provas registradas na Solana Devnet",
  "Explorer de reputação",
  "Smart Actions verificáveis",
];

const future = [
  "Token GRVM na infraestrutura Solana",
  "NFTs descentralizados",
  "Experiências tokenizadas",
  "Recompensas on-chain",
  "Economia musical SocialFi",
  "Integrações com plataformas musicais",
];

export const Web3FutureModal = ({ open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg glass-card border-primary/30">
      <DialogHeader>
          <DialogTitle className="font-display text-2xl gradient-neon-text">
            O caminho para a economia musical verificável
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Veja o que já está funcionando hoje e o que será ativado nas próximas fases do Groovium.
          </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="rounded-lg border border-border/60 p-4 bg-muted/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="font-display text-xs uppercase tracking-widest text-accent">ATIVO AGORA</span>
              </div>
          <ul className="space-y-2">
            {today.map((t) => (
              <li key={t} className="text-xs text-muted-foreground flex gap-2">
                <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-primary/30 p-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-display text-xs uppercase tracking-widest text-primary">PRÓXIMOS PASSOS</span>
              </div>
          <ul className="space-y-2">
            {future.map((t) => (
              <li key={t} className="text-xs text-foreground flex gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/40 mt-2 text-xs text-muted-foreground font-display uppercase tracking-wider">
        <span>Powered by Chainlink CRE</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
        <span>Solana Devnet</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
        <span>Groovium Heart</span>
      </div>
    </DialogContent>
  </Dialog>
);

export default Web3FutureModal;
