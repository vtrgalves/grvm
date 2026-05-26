import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChainlinkLogo } from "./ChainlinkLogo";
import { SolanaLogo } from "./SolanaLogo";
import { Check, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const today = [
  "Sistema gamificado Web2.5",
  "Reputação musical simulada",
  "GRVM experimental (off-chain)",
];

const future = [
  "Token GRVM real na Solana",
  "NFTs descentralizadas on-chain",
  "Reputação Oracle Chainlink",
  "Economia musical SocialFi",
];

export const Web3FutureModal = ({ open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg glass-card border-primary/30">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl gradient-neon-text">
          O Futuro Web3 do GRVM
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Como o ecossistema Groovium evolui da experiência atual para a infraestrutura on-chain.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="rounded-lg border border-border/60 p-4 bg-muted/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="font-display text-xs uppercase tracking-widest text-accent">Hoje</span>
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
            <span className="font-display text-xs uppercase tracking-widest text-primary">Futuro</span>
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

      <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/40 mt-2">
        <a
          href="https://chain.link/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-primary hover:opacity-80 transition-opacity"
        >
          <ChainlinkLogo className="w-4 h-4" />
          <span className="font-display uppercase tracking-wider">Chainlink CRE</span>
        </a>
        <a
          href="https://solana.com/pt"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
        >
          <SolanaLogo className="w-4 h-4" />
          <span className="font-display uppercase tracking-wider">Solana</span>
        </a>
      </div>
    </DialogContent>
  </Dialog>
);

export default Web3FutureModal;
