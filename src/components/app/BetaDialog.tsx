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
          <DialogTitle className="font-display text-2xl gradient-neon-text">Groovium · Modo BETA</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2">
            Todos os créditos <span className="text-primary font-bold">GRVM</span>, recompensas, NFTs, experiências e interações atuais são <span className="text-accent">fictícios</span> e utilizados apenas para testes da plataforma e validação da economia gamificada.
            <br /><br />
            No lançamento oficial da plataforma Web3, os usuários poderão conectar suas wallets e participar da economia real do ecossistema Groovium.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => { localStorage.setItem("grv_beta_seen", "1"); onOpenChange(false); }}
            className="w-full bg-gradient-to-r from-primary to-accent text-background font-display font-bold"
          >
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
