import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Music, ExternalLink, Sparkles, Check } from "lucide-react";
import { GROOVIUM_NFT_COLLECTION_URL } from "@/lib/marketplace";

type Ctx = { open: () => void };
const MarketplaceModalCtx = createContext<Ctx>({ open: () => {} });

export const useMarketplaceModal = () => useContext(MarketplaceModalCtx);

const BULLETS = [
  "Resgatar experiências exclusivas",
  "Participar de eventos especiais",
  "Utilizar GRVM em benefícios reais",
  "Colecionar NFTs vinculados à sua jornada musical",
  "Acessar o Marketplace oficial do Groovium",
  "Construir reputação pública verificável através do Groovium Heart",
];

export const MarketplaceModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);

  return (
    <MarketplaceModalCtx.Provider value={{ open }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl glass-card border-primary/40 max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/40 box-glow-cyan flex items-center justify-center">
                <Rocket className="w-7 h-7 text-primary" />
              </div>
            </div>
            <DialogTitle className="font-display text-2xl md:text-3xl gradient-neon-text text-center">
              🚀 Marketplace Groovium em evolução
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Estamos construindo a próxima fase da economia musical baseada em reputação verificável.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              As experiências, benefícios premium, eventos e NFTs exibidos atualmente fazem parte da
              demonstração funcional do MVP do Groovium.
            </p>
            <p>
              O ecossistema já possui o <span className="text-foreground font-semibold">Groovium Heart</span>,
              o <span className="text-foreground font-semibold">Proof of Support Oracle</span>, reputação
              verificável, integração com Chainlink CRE e registro de provas na Solana Devnet.
            </p>
            <p>
              Estamos evoluindo a plataforma para que, em breve, experiências, benefícios e ativos digitais
              possam ser acessados através de uma economia musical real baseada em reputação e participação
              da comunidade.
            </p>

            <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="font-display text-xs uppercase tracking-widest text-accent">
                  Em breve você poderá
                </span>
              </div>
              <ul className="space-y-2">
                {BULLETS.map((b) => (
                  <li key={b} className="flex gap-2 text-xs text-foreground/90">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative rounded-2xl p-5 border border-primary/40 bg-gradient-to-br from-primary/10 via-background to-accent/10 box-glow-cyan overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold text-lg gradient-neon-text">
                    🎵 NFTs Oficiais do Groovium
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Já existe uma coleção oficial do projeto disponível publicamente.
                </p>
                <p className="text-xs text-muted-foreground">
                  Os NFTs representam os primeiros apoiadores da construção da nova economia musical
                  do Groovium.
                </p>
              </div>
            </div>

            <p className="text-xs italic text-foreground/80 border-l-2 border-primary/50 pl-3">
              "A música do futuro será construída por comunidades. O Groovium está transformando apoio em
              reputação verificável e preparando a infraestrutura para uma nova economia musical baseada em
              participação real."
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              asChild
              className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-display font-bold hover:scale-[1.02] transition-transform"
            >
              <a href={GROOVIUM_NFT_COLLECTION_URL} target="_blank" rel="noreferrer">
                🎵 Apoiar o Groovium desde o início
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Continuar explorando
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MarketplaceModalCtx.Provider>
  );
};
