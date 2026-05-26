import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Music, Heart, Star, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const Welcome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") as "fan" | "musician" | null;
  const isFan = type !== "musician";
  const points = isFan ? 100 : 200;

  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const increment = points / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= points) {
        setAnimatedPoints(points);
        clearInterval(interval);
        setTimeout(() => setShowContent(true), 300);
      } else {
        setAnimatedPoints(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [points]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 noise-bg scanlines relative overflow-hidden">
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] ${isFan ? "bg-primary/15" : "bg-accent/15"}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] ${isFan ? "bg-accent/10" : "bg-primary/10"}`} />

      <div className="w-full max-w-lg relative z-10 text-center">
        {/* Celebration icon */}
        <div className="mb-6 animate-bounce">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isFan ? "bg-primary/20 border-2 border-primary/50" : "bg-accent/20 border-2 border-accent/50"}`}>
            {isFan ? (
              <Heart className="w-10 h-10 text-primary" />
            ) : (
              <Music className="w-10 h-10 text-accent" />
            )}
          </div>
        </div>

        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          {isFan ? "🎉 Parabéns! 🎉" : "🎸 Parabéns! 🎸"}
        </h1>
        <p className="text-muted-foreground mb-6">Você ganhou Groovium!</p>

        {/* Points counter */}
        <div className={`glass-card rounded-2xl p-8 mb-8 border ${isFan ? "border-primary/30" : "border-accent/30"}`}>
          <div className={`text-5xl md:text-6xl font-display font-black mb-2 ${isFan ? "text-primary" : "text-accent"}`}>
            +{animatedPoints}
          </div>
          <div className="text-lg font-display text-muted-foreground">GRVM</div>

          <div className={`mt-6 transition-all duration-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <h2 className="font-display text-lg font-bold mb-4 text-foreground">
              O que é Groovium?
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Moeda do ecossistema para:
            </p>
            <div className="space-y-3 text-left">
              {isFan ? (
                <>
                  <div className="flex items-center gap-3 text-sm">
                    <Star className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Desbloquear conteúdos exclusivos</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Gift className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Participar de sorteios</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Zap className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Ganhar descontos em shows e merch</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-sm">
                    <Sparkles className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-muted-foreground">Impulsionar seu lançamento</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Zap className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-muted-foreground">Anunciar shows para fãs</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Star className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-muted-foreground">Criar enquetes e engajar fãs</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={() => navigate(`/app`)}
          className={`w-full font-display text-base font-semibold py-6 ${
            isFan
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-accent text-accent-foreground hover:bg-accent/90"
          } animate-pulse-glow`}
        >
          Ir para o Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Welcome;
