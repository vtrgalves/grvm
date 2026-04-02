import { useEffect, useRef } from "react";

const Particles = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createParticle = () => {
      const particle = document.createElement("div");
      const size = Math.random() * 3 + 1;
      const colors = [
        "hsl(191 100% 50%)",
        "hsl(270 80% 55%)",
        "hsl(330 100% 55%)",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        bottom: -10px;
        pointer-events: none;
        box-shadow: 0 0 ${size * 4}px ${color}, 0 0 ${size * 8}px ${color};
        animation: particle-float ${Math.random() * 8 + 6}s linear forwards;
      `;
      container.appendChild(particle);
      setTimeout(() => particle.remove(), 14000);
    };

    const interval = setInterval(createParticle, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    />
  );
};

export default Particles;
