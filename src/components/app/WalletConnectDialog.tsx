import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

const WALLETS = [
  { name: "MetaMask", icon: "🦊", color: "from-orange-500/30 to-yellow-500/20" },
  { name: "Phantom", icon: "👻", color: "from-purple-500/30 to-violet-500/20" },
  { name: "WalletConnect", icon: "🔗", color: "from-blue-500/30 to-cyan-500/20" },
];

export default function WalletConnectDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/40 max-w-md relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <DialogHeader className="relative">
          <DialogTitle className="font-display gradient-neon-text text-xl">Conectar Wallet</DialogTitle>
          <DialogDescription>Em breve no lançamento Web3 do Groovium.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 relative">
          {WALLETS.map((w) => (
            <button
              key={w.name}
              onClick={() => toast("Disponível no lançamento Web3", { description: `${w.name} estará integrado em breve.` })}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-gradient-to-r ${w.color} hover:border-primary/50 transition-all group`}
            >
              <div className="text-3xl">{w.icon}</div>
              <div className="flex-1 text-left">
                <div className="font-display font-bold">{w.name}</div>
                <div className="text-xs text-muted-foreground">Conexão segura via protocolo Web3</div>
              </div>
              <span className="text-[10px] font-display uppercase tracking-widest px-2 py-1 rounded-full bg-muted/40 text-muted-foreground border border-border/40">
                Em construção
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
