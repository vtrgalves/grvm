import { useEffect, useRef, useCallback } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ChevronLeft, ChevronRight } from "lucide-react";

import agentesAtlantis from "@/assets/artists/agentes-atlantis.webp";
import baby808 from "@/assets/artists/baby808.webp";
import babycommando3000 from "@/assets/artists/babycommando3000.webp";
import babycommando6000 from "@/assets/artists/babycommando6000.gif";
import bazuros from "@/assets/artists/bazuros.webp";
import gasolines from "@/assets/artists/gasolines.webp";
import giulianoRodrigues from "@/assets/artists/giuliano-rodrigues.webp";
import neuroniosMimas from "@/assets/artists/neuronios-mimas.webp";
import nihilDreamz from "@/assets/artists/nihil-dreamz.webp";
import osEspectros from "@/assets/artists/os-espectros.webp";
import primoBastardo from "@/assets/artists/primo-bastardo.webp";
import reverendoFrankenstein from "@/assets/artists/reverendo-frankenstein.webp";
import sentimentoCarpete from "@/assets/artists/sentimento-carpete.webp";
import strikinglyAffect from "@/assets/artists/strikingly-affect.webp";
import theElectricCandles from "@/assets/artists/the-electric-candles.webp";
import theParkingLots from "@/assets/artists/the-parking-lots.webp";

const artists = [
  { name: "Gasolines", location: "São Paulo, BR", image: gasolines },
  { name: "Reverendo Frankenstein", location: "São Paulo, BR", image: reverendoFrankenstein },
  { name: "babycommando3000", location: "São Paulo, BR", image: babycommando3000 },
  { name: "babycommando6000", location: "São Paulo, BR", image: babycommando6000 },
  { name: "Bazuros", location: "São Paulo, BR", image: bazuros },
  { name: "Sentimento Carpete", location: "São Paulo, BR", image: sentimentoCarpete },
  { name: "NIHIL DREAMZ", location: "São Paulo, BR", image: nihilDreamz },
  { name: "Agentes Atlantis", location: "São Paulo, BR", image: agentesAtlantis },
  { name: "The Parking Lots", location: "São Paulo, BR", image: theParkingLots },
  { name: "Strikingly Affect", location: "São Paulo, BR", image: strikinglyAffect },
  { name: "primo bastardo", location: "Minas Gerais, BR", image: primoBastardo },
  { name: "The Electric Candles", location: "Paraná, BR", image: theElectricCandles },
  { name: "baby808", location: "São Paulo, BR", image: baby808 },
  { name: "neurônios mimas", location: "Minas Gerais, BR", image: neuroniosMimas },
  { name: "Os Espectros", location: "São Paulo, BR", image: osEspectros },
  { name: "Giuliano Rodrigues", location: "Rio de Janeiro, BR", image: giulianoRodrigues },
];

const allArtists = [...artists, ...artists];

const ITEM_WIDTH_MD = 176; // 40*4 + gap
const ITEM_WIDTH_SM = 152; // 32*4 + gap
const SCROLL_JUMP = 3;

const ArtistsCarousel = () => {
  const ref = useScrollReveal();
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const scrollPos = useRef(0);
  const isPaused = useRef(false);

  const getItemWidth = useCallback(() => {
    return window.innerWidth >= 768 ? ITEM_WIDTH_MD : ITEM_WIDTH_SM;
  }, []);

  const scrollBy = useCallback((direction: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const jump = getItemWidth() * SCROLL_JUMP;
    scrollPos.current += jump * direction;
    const halfWidth = container.scrollWidth / 2;
    if (scrollPos.current >= halfWidth) scrollPos.current -= halfWidth;
    if (scrollPos.current < 0) scrollPos.current += halfWidth;
  }, [getItemWidth]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const speed = 0.8;

    const animate = () => {
      if (!isPaused.current && container) {
        scrollPos.current += speed;
        const halfWidth = container.scrollWidth / 2;
        if (scrollPos.current >= halfWidth) {
          scrollPos.current = 0;
        }
        container.scrollLeft = scrollPos.current;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="section-reveal py-16 md:py-24 relative overflow-hidden noise-bg"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background" />

      <div className="relative z-10 container mx-auto px-4 mb-10 flex items-center justify-between">
        <h2 className="font-display text-2xl md:text-4xl font-bold">
          Discover <span className="gradient-neon-text text-glow-blue">Artists</span>
        </h2>

        <div className="flex gap-3">
          <button
            onClick={() => scrollBy(-1)}
            className="group relative w-10 h-10 md:w-12 md:h-12 rounded-full border border-primary/30 bg-card/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] active:scale-95"
            aria-label="Previous artists"
          >
            <ChevronLeft className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="group relative w-10 h-10 md:w-12 md:h-12 rounded-full border border-[hsl(330_100%_60%)]/30 bg-card/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:border-[hsl(330_100%_60%)]/70 hover:shadow-[0_0_20px_hsl(330_100%_60%/0.3)] active:scale-95"
            aria-label="Next artists"
          >
            <ChevronRight className="w-5 h-5 text-[hsl(330_100%_60%)]/70 group-hover:text-[hsl(330_100%_60%)] transition-colors" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative z-10 flex gap-6 md:gap-8 overflow-hidden px-4 cursor-grab"
        onMouseEnter={() => (isPaused.current = true)}
        onMouseLeave={() => (isPaused.current = false)}
      >
        {allArtists.map((artist, i) => (
          <div
            key={`${artist.name}-${i}`}
            className="flex-shrink-0 flex flex-col items-center gap-3 group"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-[0_0_25px_hsl(191_100%_50%/0.4)]">
              <img
                src={artist.image}
                alt={artist.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="text-center">
              <p className="font-display text-sm md:text-base font-semibold text-foreground">
                {artist.name}
              </p>
              <p className="text-xs text-muted-foreground">{artist.location}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ArtistsCarousel;
