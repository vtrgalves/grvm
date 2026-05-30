/**
 * Cyberpunk neon heart icon for Groovium Heart.
 * Heart silhouette with a sonic pulse wave running through the middle.
 * Pure SVG — uses currentColor + tailwind drop-shadow for the neon glow.
 */
export const GrooviumHeartIcon = ({
  className = "h-4 w-4",
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="grv-heart-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00D1FF" />
        <stop offset="55%" stopColor="#8A2EFF" />
        <stop offset="100%" stopColor="#FF2E9A" />
      </linearGradient>
      <radialGradient id="grv-heart-core" cx="50%" cy="55%" r="55%">
        <stop offset="0%" stopColor="#FF2E9A" stopOpacity="0.55" />
        <stop offset="60%" stopColor="#8A2EFF" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#00D1FF" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* inner core glow */}
    <path
      d="M16 28s-11-6.7-11-15a6.5 6.5 0 0 1 11-4.6A6.5 6.5 0 0 1 27 13c0 8.3-11 15-11 15z"
      fill="url(#grv-heart-core)"
    />

    {/* heart outline */}
    <path
      d="M16 28s-11-6.7-11-15a6.5 6.5 0 0 1 11-4.6A6.5 6.5 0 0 1 27 13c0 8.3-11 15-11 15z"
      stroke="url(#grv-heart-grad)"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className={animated ? "[filter:drop-shadow(0_0_3px_#00D1FF)]" : ""}
    />

    {/* sonic pulse waveform crossing the heart */}
    <path
      d="M5 16 H9.5 L11 12.5 L13 19.5 L15 11 L17 21 L19 13.5 L20.5 16 H27"
      stroke="url(#grv-heart-grad)"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className={animated ? "animate-pulse [filter:drop-shadow(0_0_2px_#FF2E9A)]" : ""}
    />
  </svg>
);

export default GrooviumHeartIcon;
