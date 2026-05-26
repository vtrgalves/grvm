import { useNavigate } from "react-router-dom";
import Web3Badges from "@/components/web3/Web3Badges";

const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <span className="font-display text-xl font-bold gradient-neon-text">GROOVIUM</span>
        <div className="hidden md:flex">
          <Web3Badges />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 rounded-lg font-display text-sm font-semibold text-foreground border border-white/10 hover:border-primary/50 hover:text-primary transition-all"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-5 py-2 rounded-lg font-display text-sm font-semibold bg-primary text-primary-foreground hover:scale-105 transition-transform animate-pulse-glow"
          >
            Criar conta
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
