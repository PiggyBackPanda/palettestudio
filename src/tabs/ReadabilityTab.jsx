import { contrastRatio, textOn } from '../utils/colourMath';
import AccessibilityReport from '../components/AccessibilityReport';

function badge(ratio) {
  if (ratio >= 7)   return { label: 'AAA',      bg: 'var(--ps-success-subtle)', col: 'var(--ps-success)'  };
  if (ratio >= 4.5) return { label: 'AA',       bg: '#f0fdf4',                  col: '#15803D'             };
  if (ratio >= 3)   return { label: 'AA Large', bg: 'var(--ps-warning-subtle)', col: 'var(--ps-warning)'  };
  return              { label: 'Fail',     bg: 'var(--ps-danger-subtle)',  col: 'var(--ps-danger)'   };
}

export default function ReadabilityTab({ colors }) {
  if (colors.length < 2) {
    return (
      <div
        className="card"
        style={{
          fontFamily: 'var(--ps-font-ui)',
          color:      'var(--ps-text-tertiary)',
          textAlign:  'center',
          padding:    '30px 0',
        }}
      >
        Add at least 2 colours to see readability combinations.
      </div>
    );
  }

  const pairs = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = 0; j < colors.length; j++) {
      if (i === j) continue;
      const ratio = contrastRatio(colors[i], colors[j]);
      pairs.push({ bg: colors[j], fg: colors[i], ratio });
    }
  }
  pairs.sort((a, b) => b.ratio - a.ratio);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AccessibilityReport colors={colors} />

      <div className="card">
      <div
        style={{
          fontFamily:   'var(--ps-font-ui)',
          fontSize:     'var(--ps-text-sm)',
          color:        'var(--ps-text-secondary)',
          marginBottom: 14,
          lineHeight:   1.5,
        }}
      >
        WCAG 2.1 contrast ratios for every colour combination.{' '}
        <strong>AA (4.5:1)</strong> is required for body text.{' '}
        <strong>AA Large (3:1)</strong> applies to large headings and bold UI.{' '}
        <strong>AAA (7:1)</strong> is the highest standard.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {pairs.map(({ bg, fg, ratio }, i) => {
          const b = badge(ratio);
          return (
            <div
              key={i}
              style={{
                background:   bg,
                borderRadius: 'var(--ps-radius-lg)',
                padding:      '12px 14px',
                border:       `1px solid ${ratio < 4.5 ? 'var(--ps-danger)' : 'var(--ps-border)'}`,
                position:     'relative',
              }}
            >
              {/* WCAG badge */}
              <span
                style={{
                  position:      'absolute',
                  top:           8,
                  right:         8,
                  background:    b.bg,
                  color:         b.col,
                  fontFamily:    'var(--ps-font-ui)',
                  fontSize:      8,
                  fontWeight:    700,
                  padding:       '2px 6px',
                  borderRadius:  'var(--ps-radius-sm)',
                  letterSpacing: '.06em',
                  border:        `1px solid ${b.col}`,
                }}
              >
                {b.label}
              </span>

              <div
                style={{
                  fontFamily:   'var(--ps-font-ui)',
                  color:        fg,
                  fontSize:     14,
                  fontWeight:   700,
                  marginBottom: 2,
                }}
              >
                Heading Text
              </div>
              <div
                style={{
                  fontFamily:  'var(--ps-font-ui)',
                  color:       fg,
                  fontSize:    11,
                  lineHeight:  1.5,
                  marginBottom: 8,
                }}
              >
                Body copy at this size.
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: fg, border: '1px solid rgba(0,0,0,.15)' }} />
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: bg, border: '1px solid rgba(0,0,0,.15)' }} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--ps-font-mono)',
                    fontSize:   9,
                    color:      fg,
                    opacity:    0.7,
                  }}
                >
                  {ratio.toFixed(1)}:1
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
