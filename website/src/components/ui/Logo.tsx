/**
 * HardSecNet mark. Solid shield, negative-space check, drawn on a 48px
 * grid with optical (not geometric) centering. One color: the ink.
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 3.5 C29 6.5 35.5 8.5 42 9 L42 23 C42 34.5 34.8 42.8 24 46.5 C13.2 42.8 6 34.5 6 23 L6 9 C12.5 8.5 19 6.5 24 3.5 Z"
        fill="var(--text)"
      />
      <path
        d="M15.5 24.5 L21.5 30.5 L33 16.5"
        stroke="var(--bg)"
        strokeWidth="4.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function LogoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 select-none">
      <LogoMark size={compact ? 26 : 30} />
      <span
        className={`font-semibold ${compact ? 'text-[16px]' : 'text-[18px]'}`}
        style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
      >
        HardSecNet
      </span>
    </span>
  );
}
