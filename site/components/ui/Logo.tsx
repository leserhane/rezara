interface LogoProps {
  className?: string;
  title?: string;
}

/** The Optimum Optic mark: two interlocked rings, exactly as in the
 * official artwork — not redrawn or reinterpreted. */
export function Logo({ className, title = "Optimum Optic" }: LogoProps) {
  return (
    <svg viewBox="0 0 200 140" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="logoRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f2e2c6" />
          <stop offset="55%" stopColor="#d9c3a6" />
          <stop offset="100%" stopColor="#b7997a" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#logoRingGradient)" strokeWidth="11">
        <circle cx="75" cy="70" r="52" />
        <circle cx="122" cy="70" r="52" />
      </g>
    </svg>
  );
}
