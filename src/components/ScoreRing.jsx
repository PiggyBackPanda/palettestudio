export default function ScoreRing({ score }) {
  const r    = 28;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - score / 100);
  const col  = score >= 80 ? 'var(--ps-success)' : score >= 55 ? 'var(--ps-warning)' : 'var(--ps-danger)';

  return (
    <div style={{ textAlign: 'center', userSelect: 'none' }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--ps-border)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke={col}
          strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={fill}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset .5s ease, stroke .4s' }}
        />
        <text
          x="36" y="40"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fontFamily="var(--ps-font-ui)"
          fill={col}
        >
          {score}
        </text>
      </svg>
      <div
        style={{
          fontFamily:    'var(--ps-font-ui)',
          fontSize:      'var(--ps-text-xs)',
          color:         'var(--ps-text-tertiary)',
          letterSpacing: '.08em',
          marginTop:     -2,
        }}
      >
        HEALTH
      </div>
    </div>
  );
}
