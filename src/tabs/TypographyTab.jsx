import { hexToRgb, rgbToHsl, luminance } from '../utils/colourMath';
import { FONT_PAIRS } from '../constants';

// ─── Scoring ─────────────────────────────────────────────────────────────────
function scoreFontPair(pair, colors) {
  if (!colors.length) return 50;
  const data = colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsl(r, g, b);
  });
  const dominant = data.reduce((best, c) => (c.s > best.s ? c : best), data[0]);
  const avgSat = data.reduce((sum, c) => sum + c.s, 0) / data.length;
  const hue = dominant.h;
  const isWarm = hue >= 330 || hue < 90;
  const isCool = hue >= 150 && hue < 330;
  const tempLabel = dominant.s < 10 ? 'neutral' : isWarm ? 'warm' : isCool ? 'cool' : 'neutral';

  let vibeScore = 0;
  if (pair.vibes.includes(tempLabel)) vibeScore = 40;
  else if (pair.vibes.includes('neutral') || tempLabel === 'neutral') vibeScore = 25;
  else vibeScore = 8;

  let satScore = 0;
  if (avgSat >= pair.satRange[0] && avgSat <= pair.satRange[1]) {
    satScore = 40;
  } else {
    const dist = avgSat < pair.satRange[0]
      ? pair.satRange[0] - avgSat
      : avgSat - pair.satRange[1];
    satScore = Math.max(0, 40 - dist * 1.2);
  }

  const baseBonus = 15 + Math.round(Math.sin(hue * 0.0174 + pair.satRange[0]) * 5);
  return Math.round(Math.min(100, vibeScore + satScore + baseBonus));
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function TypographyTab({ colors, roles, selectedFont, onSelectFont }) {
  const ranked = FONT_PAIRS
    .map(p => ({ ...p, score: scoreFontPair(p, colors) }))
    .sort((a, b) => b.score - a.score);

  const activePair = selectedFont || ranked[0];

  // Derive preview colours from roles or palette
  const data = colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    return { hex, ...rgbToHsl(r, g, b), lum: luminance(r, g, b) };
  });

  const bgHex =
    Object.keys(roles).find(k => roles[k] === 'Background') ||
    (data.length ? data.reduce((b, c) => (c.l > b.l ? c : b), data[0]).hex : '#f5f2ed');
  const txtHex =
    Object.keys(roles).find(k => roles[k] === 'Text') ||
    (data.length ? data.reduce((b, c) => (c.l < b.l ? c : b), data[0]).hex : '#1a1a2e');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div className="card">
        <div
          style={{
            fontFamily:   'var(--ps-font-ui)',
            fontSize:     'var(--ps-text-lg)',
            fontWeight:   700,
            color:        'var(--ps-text-primary)',
            marginBottom: 8,
          }}
        >
          Typography Pairing
        </div>
        <p
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-sm)',
            color:      'var(--ps-text-secondary)',
            lineHeight: 1.6,
            margin:     0,
          }}
        >
          Six curated font pairings scored against your palette's colour temperature and
          saturation. Click any pair to select it for your Brand Templates.
        </p>
      </div>

      {/* Font pair cards */}
      {ranked.map((pair, i) => {
        const isSelected = activePair.name === pair.name;
        return (
          <div
            key={pair.name}
            onClick={() => onSelectFont(pair)}
            className="card"
            style={{
              cursor:     'pointer',
              transition: 'all .18s',
              border:     isSelected
                ? '2px solid var(--ps-accent)'
                : '1px solid var(--ps-border)',
              boxShadow: isSelected ? '0 4px 16px rgba(0,0,0,.08)' : 'var(--ps-shadow-sm)',
              padding:   isSelected ? '15px 19px' : undefined,
            }}
          >
            <div
              style={{
                display:        'flex',
                alignItems:     'flex-start',
                justifyContent: 'space-between',
                gap:            16,
                flexWrap:       'wrap',
              }}
            >
              {/* Left — info */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily:    'var(--ps-font-mono)',
                      fontSize:      'var(--ps-text-xs)',
                      color:         'var(--ps-accent)',
                      letterSpacing: '.1em',
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: pair.heading,
                      fontSize:   'var(--ps-text-xl)',
                      color:      'var(--ps-text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {pair.name}
                  </span>
                  <span
                    style={{
                      fontFamily:   'var(--ps-font-mono)',
                      fontSize:     'var(--ps-text-xs)',
                      padding:      '2px 8px',
                      borderRadius: 'var(--ps-radius-full)',
                      background:   pair.score >= 70 ? 'var(--ps-success-bg)' : pair.score >= 45 ? '#fff8e0' : '#fdecea',
                      color:        pair.score >= 70 ? 'var(--ps-success)' : pair.score >= 45 ? '#7a6000' : '#8a2020',
                    }}
                  >
                    {pair.score}%
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        fontSize:      'var(--ps-text-xs)',
                        background:    'var(--ps-accent)',
                        color:         'var(--ps-accent-text)',
                        borderRadius:  'var(--ps-radius-full)',
                        padding:       '2px 8px',
                        letterSpacing: '.08em',
                        fontFamily:    'var(--ps-font-ui)',
                        fontWeight:    600,
                      }}
                    >
                      Selected
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--ps-font-ui)',
                    fontSize:   'var(--ps-text-sm)',
                    color:      'var(--ps-text-tertiary)',
                    marginBottom: 8,
                    lineHeight: 1.6,
                  }}
                >
                  {pair.mood}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  {pair.vibes.map(v => (
                    <span
                      key={v}
                      style={{
                        fontFamily:   'var(--ps-font-ui)',
                        fontSize:     'var(--ps-text-xs)',
                        color:        'var(--ps-text-tertiary)',
                        border:       '1px solid var(--ps-border)',
                        borderRadius: 'var(--ps-radius-full)',
                        padding:      '2px 7px',
                      }}
                    >
                      {v}
                    </span>
                  ))}
                  <span
                    style={{
                      fontFamily:   'var(--ps-font-ui)',
                      fontSize:     'var(--ps-text-xs)',
                      color:        'var(--ps-text-tertiary)',
                      border:       '1px solid var(--ps-border)',
                      borderRadius: 'var(--ps-radius-full)',
                      padding:      '2px 7px',
                    }}
                  >
                    sat {pair.satRange[0]}–{pair.satRange[1]}%
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--ps-font-ui)',
                    fontSize:   'var(--ps-text-xs)',
                    color:      'var(--ps-text-tertiary)',
                  }}
                >
                  Heading:{' '}
                  <span style={{ color: 'var(--ps-text-secondary)' }}>
                    {pair.heading.split(',')[0].replace(/'/g, '')}
                  </span>{' '}
                  · Body:{' '}
                  <span style={{ color: 'var(--ps-text-secondary)' }}>
                    {pair.body.split(',')[0].replace(/'/g, '')}
                  </span>
                </div>
              </div>

              {/* Right — live preview */}
              <div
                style={{
                  background:   bgHex,
                  borderRadius: 'var(--ps-radius-lg)',
                  padding:      '16px 20px',
                  minWidth:     220,
                  flex:         '0 0 auto',
                  border:       `1px solid ${txtHex}15`,
                }}
              >
                <div
                  style={{
                    fontFamily: pair.heading,
                    fontSize:   20,
                    color:      txtHex,
                    marginBottom: 6,
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}
                >
                  The Quick Brown Fox
                </div>
                <div
                  style={{
                    fontFamily: pair.body,
                    fontSize:   12,
                    color:      txtHex,
                    opacity:    0.8,
                    lineHeight: 1.7,
                  }}
                >
                  Jumps over the lazy dog. This is how your body text will look with this
                  pairing on your palette colours.
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
