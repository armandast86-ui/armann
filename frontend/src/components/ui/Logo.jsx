/** Red geometric Automotive mark: a hex nut with an inner hub. */
export default function Logo({ size = 40, className = '' }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-racing shadow-[var(--shadow-glow)] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" width={Math.round(size * 0.64)} height={Math.round(size * 0.64)}>
        <path d="M16 3.2l11 6.35v12.9L16 28.8 5 22.45V9.55z" fill="none" stroke="#fff" strokeWidth="2.1" />
        <circle cx="16" cy="16" r="4" fill="#fff" />
      </svg>
    </span>
  );
}
