/**
 * Sound Aroma Loom — interpretive sensory diagram.
 * Drawn only from the written description on portfolio pp.13–16 (flower-like chimneys, linen curtains,
 * rainwater strategy, sound and aroma at Whitechapel Market). It is a concept visualisation, not a
 * drawing by Tala, and is labelled as such wherever it appears.
 */
export function SensoryDiagram({ className, title = "Interpretive sensory diagram of the Sound Aroma Loom" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 640 400" role="img" aria-labelledby="sal-title sal-desc" className={className} style={{ background: "var(--color-sheet)" }}>
      <title id="sal-title">{title}</title>
      <desc id="sal-desc">
        A schematic diagram: three flower-like chimneys rise above a light pavilion frame; dashed lines show air and scent drawn up through the
        chimneys, wavy lines show sound passing through linen curtains, and arrows show rainwater collected from the chimney heads into a tank.
      </desc>
      <g stroke="var(--color-ink)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* ground and market line */}
        <line x1="40" y1="330" x2="600" y2="330" />
        <line x1="60" y1="340" x2="140" y2="340" strokeDasharray="2 6" />
        <line x1="500" y1="340" x2="580" y2="340" strokeDasharray="2 6" />
        {/* pavilion frame */}
        <rect x="150" y="190" width="340" height="140" />
        <line x1="150" y1="190" x2="320" y2="150" />
        <line x1="490" y1="190" x2="320" y2="150" />
        <line x1="320" y1="150" x2="320" y2="190" strokeDasharray="3 4" />
        {/* linen curtains: three hanging panels with gentle waves */}
        {[200, 300, 400].map((x) => (
          <path key={x} d={`M${x} 200 q 6 20 0 40 t 0 40 t 0 40`} stroke="var(--color-copper)" strokeWidth="1.4" />
        ))}
        {/* flower-like chimneys */}
        {[
          [220, 80],
          [320, 60],
          [420, 84],
        ].map(([cx, cy]) => (
          <g key={cx}>
            <line x1={cx} y1={cy + 28} x2={cx} y2={190} />
            <path d={`M${cx - 26} ${cy + 20} q 26 -40 52 0`} />
            <path d={`M${cx - 18} ${cy + 24} q 18 -22 36 0`} />
            <path d={`M${cx - 30} ${cy + 26} q 30 14 60 0`} />
            {/* air and scent rising */}
            <path d={`M${cx} 250 q -8 -30 0 -60 t 0 -60`} strokeDasharray="4 5" stroke="var(--color-ink-2)" />
            {/* rain collected */}
            <path d={`M${cx + 40} ${cy - 10} l -10 24`} stroke="var(--color-ink-2)" />
            <path d={`M${cx + 48} ${cy - 2} l -10 24`} stroke="var(--color-ink-2)" />
          </g>
        ))}
        {/* rainwater route to tank */}
        <path d="M320 190 q 0 40 60 40 l 140 0 q 20 0 20 20 l 0 80" strokeDasharray="6 4" stroke="var(--color-ink-2)" />
        <rect x="520" y="290" width="40" height="40" stroke="var(--color-ink-2)" />
        {/* sound waves through the curtains */}
        <path d="M60 260 q 15 -10 30 0 t 30 0 t 30 0" stroke="var(--color-pencil)" />
        <path d="M60 280 q 15 -10 30 0 t 30 0 t 30 0" stroke="var(--color-pencil)" />
        <path d="M60 300 q 15 -10 30 0 t 30 0 t 30 0" stroke="var(--color-pencil)" />
      </g>
      <g fontFamily="var(--font-mono)" fontSize="10" fill="var(--color-ink-2)">
        <text x="60" y="248">market sound</text>
        <text x="198" y="196">linen curtains</text>
        <text x="236" y="52">flower chimneys</text>
        <text x="300" y="268">air and scent</text>
        <text x="470" y="284">rainwater</text>
        <text x="40" y="372">Interpretive diagram from the written description (portfolio pp.13–16). Not an original drawing.</text>
      </g>
    </svg>
  );
}
