/**
 * SpendWise SVG Logo — inline, scalable, theme-aware.
 *
 * Props
 * ─────────────────────────────
 *  size        number | string   overall width/height (default 32)
 *  variant     "icon" | "full"   icon-only or icon+wordmark (default "icon")
 *  showBg      boolean           render the navy rounded-rect background (default true)
 *  className   string            extra classes forwarded to the wrapper
 */
export default function SpendWiseLogo({
  size = 32,
  variant = 'icon',
  showBg = true,
  className = '',
}) {
  const s = typeof size === 'number' ? size : parseInt(size, 10) || 32;

  const icon = (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      aria-label="SpendWise logo"
    >
      {/* Background rounded rect */}
      {showBg && (
        <rect width="40" height="40" rx="10" fill="var(--navy, #0F172A)" />
      )}

      {/* S letterform — elegant serif-inspired */}
      <path
        d="M16.5 13.5C16.5 13.5 18 11 21.5 11C24.5 11 26.5 12.8 26.5 15C26.5 19.5 14 17.5 14 23.5C14 26 16 28.5 20 28.5C23.5 28.5 25.5 26.5 25.5 26.5"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* W accent stroke — small, right-bottom */}
      <path
        d="M26 24L28 30L30.5 25L33 30"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Decorative ledger dot */}
      <circle cx="10" cy="20" r="1.5" fill="white" opacity="0.35" />
    </svg>
  );

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {icon}
        <span className="font-semibold text-[var(--navy)] tracking-tight text-base">
          SpendWise
        </span>
      </div>
    );
  }

  return icon;
}
