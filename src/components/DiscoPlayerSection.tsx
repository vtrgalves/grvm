import moshedGif from "@/assets/moshed11.gif";
import logoPlayer from "@/assets/logoplayer.png";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const DiscoPlayerSection = () => {
  const sectionRef = useScrollReveal();

  return (
    <section ref={sectionRef} className="pt-6 pb-16 relative flex flex-col justify-center items-center reveal-section">
      <h2 className="text-3xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-primary via-[#8A2EFF] to-[#FF2E9A] bg-clip-text text-transparent">
        Música Alternativa para pessoas alternativas!
      </h2>
      <a
        href="https://discoapp.xyz/"
        target="_blank"
        rel="noopener noreferrer"
        className="relative inline-block group cursor-pointer rounded-2xl overflow-hidden border border-primary/30 hover:border-primary/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,209,255,0.3)]"
      >
        <img
          src={moshedGif}
          alt="Groovium Player"
          className="w-[200px] md:w-[260px] h-auto block"
        />
        <img
          src={logoPlayer}
          alt="Disco Player"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 md:w-48 drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] group-hover:scale-110 transition-transform duration-300"
        />
      </a>
    </section>
  );
};

export default DiscoPlayerSection;
