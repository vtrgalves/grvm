const SoundwaveBackground = ({ className = "" }: { className?: string }) => {
  const bars = 60;

  return (
    <div className={`absolute inset-0 flex items-end justify-center gap-[2px] opacity-10 overflow-hidden ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full"
          style={{
            background: `linear-gradient(to top, hsl(190 100% 50%), hsl(268 100% 59%))`,
            animation: `soundwave ${1 + Math.random() * 1.5}s ease-in-out ${Math.random() * 2}s infinite`,
            height: `${10 + Math.random() * 40}%`,
          }}
        />
      ))}
    </div>
  );
};

export default SoundwaveBackground;
