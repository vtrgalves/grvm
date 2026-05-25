import { useEffect, useState } from "react";
import BetaDialog from "./BetaDialog";

export default function BetaBadge({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("grv_beta_seen")) {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent/20 hover:border-accent transition-all animate-pulse-glow ${compact ? "" : ""}`}
        title="Saiba mais sobre o modo BETA"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        BETA*
      </button>
      <BetaDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
