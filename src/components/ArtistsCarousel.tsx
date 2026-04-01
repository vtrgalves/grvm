import { useEffect, useRef } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

import agentesAtlantis from "@/assets/artists/agentes-atlantis.webp";
import baby808 from "@/assets/artists/baby808.webp";
import babycommando3000 from "@/assets/artists/babycommando3000.webp";
import babycommando6000 from "@/assets/artists/babycommando6000.gif";
import bazuros from "@/assets/artists/bazuros.webp";
import gasolines from "@/assets/artists/gasolines.webp";
import giulianoRodrigues from "@/assets/artists/giuliano-rodrigues.webp";

const artists = [
  { name: "Gasolines", location: "São Paulo, BR", image: gasolines },
  { name: "Agentes Atlantis", location: "São Paulo, BR", image: agentesAtlantis },
  { name: "babycommando3000", location: "São Paulo, BR", image: babycommando3000 },
  { name: "babycommando6000", location: "São Paulo, BR", image: babycommando6000 },
  { name: "baby808", location: "São Paulo, BR", image: baby808 },
  { name: "Bazuros", location: "São Paulo, BR", image: bazuros },
  { name: "Giuliano Rodrigues", location: "Rio de Janeiro, BR", image: giulianoRodrigues },
];

// Duplicate for seamless infinite scroll
const allArtists = [...artists, ...artists];

const ArtistsCarousel = () => {
  const ref = useScrollReveal();
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const scrollPos = useRef(0);
  const isPaused = useRef(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const speed = 0.5; // px per frame

    const animate = () => {
      if (!isPaused.current && container) {
        scrollPos.current += speed;
        // Reset when first set is fully scrolled
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
      className="section-reveal py-16 md:py-24 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background" />

      <div className="relative z-10 container mx-auto px-4 mb-10">
        <h2 className="font-display text-2xl md:text-4xl font-bold">
          Discover <span className="gradient-neon-text">Artists</span>
        </h2>
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
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
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
