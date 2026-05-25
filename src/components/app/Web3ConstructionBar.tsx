import { useState } from "react";
import { Construction, Wallet as WalletIcon } from "lucide-react";
import WalletConnectDialog from "./WalletConnectDialog";

export default function Web3ConstructionBar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 glass-card p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-xl pointer-events-none" />
        <div className="relative flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/40">
            <Construction className="w-5 h-5 text-accent animate-pulse" />
          </div>
          <div>
            <div className="font-display font-bold text-sm flex items-center gap-2">
              🚧 WEB3 EM CONSTRUÇÃO
            </div>
            <div className="text-xs text-muted-foreground">Adquira Grooviums em Web3 (Em breve)</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-background font-display font-bold text-sm hover:scale-105 transition-transform"
        >
          <WalletIcon className="w-4 h-4" /> Cadastrar Wallet
        </button>
      </div>
      <WalletConnectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
