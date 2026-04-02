const SoundwaveBackground = ({ className = "" }: { className?: string }) => {
  const bars = 80;

  return (
    <div className={`absolute inset-0 flex items-end justify-center gap-[2px] opacity-[0.07] overflow-hidden ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-[1.5px] rounded-full"
          style={{
            background: `linear-gradient(to top, hsl(191 100% 50%), hsl(330 100% 55%))`,
            animation: `soundwave ${1 + Math.random() * 1.5}s ease-in-out ${Math.random() * 2}s infinite`,
            height: `${10 + Math.random() * 40}%`,
          }}
        />
      ))}
    </div>
  );
};

export default SoundwaveBackground;
