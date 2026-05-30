import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export default function BetaDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/40 max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-2 animate-pulse-glow">
            <Sparkles className="w-6 h-6 text-background" />
          </div>
          <DialogTitle className="font-display text-2xl gradient-neon-text">Groovium · Beta Público</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2">
            O Groovium já possui infraestrutura ativa de reputação musical verificável.
            <br /><br />
            Suas interações geram Smart Actions, passam pelo Proof of Support Oracle, recebem análise de IA e podem gerar registros públicos na Solana Devnet.
            <br /><br />
            Os créditos GRVM exibidos atualmente possuem caráter experimental e são utilizados para validação da economia, da gamificação e dos mecanismos de reputação do ecossistema.
            <br /><br />
            Nas próximas fases, o GRVM evoluirá para uma camada econômica integrada à infraestrutura Web3 do Groovium.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => { localStorage.setItem("grv_beta_seen", "1"); onOpenChange(false); }}
            className="w-full bg-gradient-to-r from-primary to-accent text-background font-display font-bold"
          >
            Continuar explorando
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
