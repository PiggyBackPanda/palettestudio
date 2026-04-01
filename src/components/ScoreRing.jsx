export default function ScoreRing({ score }) {
  const r    = 20;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - score / 100);
  const col  = score >= 80 ? 'var(--ps-success)' : score >= 55 ? 'var(--ps-warning)' : 'var(--ps-danger)';

  return (
    <div title={`Palette health: ${score}/100`} style={{ userSelect: 'none', flexShrink: 0 }}>
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--ps-border)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r}
          fill="none"
          stroke={col}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={fill}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
          style={{ transition: 'stroke-dashoffset .5s ease, stroke .4s' }}
        />
        <text
          x="24" y="28"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fontFamily="var(--ps-font-ui)"
          fill={col}
        >
          {score}
        </text>
      </svg>
    </div>
  );
}
