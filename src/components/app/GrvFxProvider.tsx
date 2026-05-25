import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Coins } from "lucide-react";
import { toast } from "sonner";

interface FxContext {
  notifyGain: (points: number, reason?: string) => void;
}

const Ctx = createContext<FxContext>({ notifyGain: () => {} });
export const useGrvFx = () => useContext(Ctx);

interface Pop { id: number; points: number; }

export function GrvFxProvider({ children }: { children: ReactNode }) {
  const [pops, setPops] = useState<Pop[]>([]);

  const notifyGain = useCallback((points: number, reason?: string) => {
    if (!points) return;
    const sign = points > 0 ? "+" : "";
    toast(
      <span className="flex items-center gap-2 font-display font-bold">
        <Coins className={`w-4 h-4 ${points > 0 ? "text-primary" : "text-accent"}`} />
        <span className={points > 0 ? "text-primary" : "text-accent"}>{sign}{points} GRV</span>
        {reason && <span className="text-xs text-muted-foreground font-normal">· {reason}</span>}
      </span>,
      { duration: 2500 }
    );
    const id = Date.now() + Math.random();
    setPops((p) => [...p, { id, points }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1200);
  }, []);

  return (
    <Ctx.Provider value={{ notifyGain }}>
      {children}
      <div className="fixed top-20 right-6 z-[150] pointer-events-none flex flex-col items-end gap-1">
        {pops.map((p) => (
          <div
            key={p.id}
            className={`font-display font-black text-2xl animate-grv-float ${p.points > 0 ? "text-primary" : "text-accent"}`}
            style={{ textShadow: "0 0 20px currentColor" }}
          >
            {p.points > 0 ? "+" : ""}{p.points} GRV
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
