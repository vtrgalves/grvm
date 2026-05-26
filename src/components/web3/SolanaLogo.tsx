export const SolanaLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="sol-g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14F195" />
        <stop offset="100%" stopColor="#9945FF" />
      </linearGradient>
    </defs>
    <g fill="url(#sol-g)">
      <path d="M6.5 21.5 9 19h17l-2.5 2.5H6.5zM6.5 13 9 10.5h17L23.5 13H6.5zM23.5 17.25 26 14.75H9l2.5 2.5h12z" />
    </g>
  </svg>
);
