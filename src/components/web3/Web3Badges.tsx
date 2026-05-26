import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChainlinkLogo } from "./ChainlinkLogo";
import { SolanaLogo } from "./SolanaLogo";
import { Web3FutureModal } from "./Web3FutureModal";

type Variant = "header" | "compact" | "inline";

export const Web3Badges = ({ variant = "header" }: { variant?: Variant }) => {
  const [openModal, setOpenModal] = useState(false);

  const base =
    variant === "compact"
      ? "px-2 py-1 text-[10px] gap-1"
      : "px-3 py-1.5 text-xs gap-1.5";

  const ChainlinkBadge = (
    <button
      type="button"
      onClick={() => setOpenModal(true)}
      className={`flex items-center ${base} rounded-full glass-card border border-primary/30 text-primary hover:border-primary/60 hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)] transition-all font-display uppercase tracking-wider`}
    >
      <ChainlinkLogo className={variant === "compact" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>Chainlink CRE</span>
    </button>
  );

  const SolanaBadge = (
    <button
      type="button"
      onClick={() => setOpenModal(true)}
      className={`flex items-center ${base} rounded-full glass-card border border-secondary/30 text-foreground hover:border-secondary/60 hover:shadow-[0_0_12px_hsl(var(--secondary)/0.45)] transition-all font-display uppercase tracking-wider`}
    >
      <SolanaLogo className={variant === "compact" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>Future on Solana</span>
    </button>
  );

  return (
    <>
      <div className={`flex items-center ${variant === "compact" ? "gap-1.5" : "gap-2"}`}>
        <Tooltip>
          <TooltipTrigger asChild>{ChainlinkBadge}</TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-xs">
            Infraestrutura Oracle e automação Web3 do Groovium.
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>{SolanaBadge}</TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-xs">
            Rede escolhida para o futuro token GRVM.
          </TooltipContent>
        </Tooltip>
      </div>
      <Web3FutureModal open={openModal} onOpenChange={setOpenModal} />
    </>
  );
};

export default Web3Badges;
