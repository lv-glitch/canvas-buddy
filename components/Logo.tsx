interface LogoProps {
  size?: number;
  className?: string;
}

/** Green circle with three equalizer bars inside. */
export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <circle cx="20" cy="20" r="20" fill="#1ED760" />
      {/* Equalizer bars: short, tall, medium */}
      <rect x="12.5" y="14.5" width="3.5" height="11" rx="1" fill="#121212" />
      <rect x="18.25" y="10" width="3.5" height="20" rx="1" fill="#121212" />
      <rect x="24" y="16.5" width="3.5" height="7" rx="1" fill="#121212" />
    </svg>
  );
}
