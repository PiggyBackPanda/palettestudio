import { hexToRgb, simulateCVD, contrastRatio, textOn } from '../utils/colourMath';
import { CVD_TYPES } from '../constants';

export default function ColourBlindTab({ colors, cvdType, setCvdType }) {
  const simulated = colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    return simulateCVD(r, g, b, cvdType);
  });

  const confusions = [];
  for (let i = 0; i < simulated.length; i++) {
    for (let j = i + 1; j < simulated.length; j++) {
      const ratio = contrastRatio(simulated[i], simulated[j]);
      if (ratio < 1.5) confusions.push({ i, j, ratio });
    }
  }

  return (
    <div className="card">
      {/* Type selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {CVD_TYPES.map(t => {
          const isActive = cvdType === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setCvdType(t.key)}
              style={{
                background:    isActive ? 'var(--ps-accent)' : 'var(--ps-bg-surface)',
                color:         isActive ? 'var(--ps-accent-text)' : 'var(--ps-text-secondary)',
                border:        `1px solid ${isActive ? 'var(--ps-accent)' : 'var(--ps-border)'}`,
                borderRadius:  'var(--ps-radius-md)',
                padding:       '6px 14px',
                fontFamily:    'var(--ps-font-ui)',
                fontSize:      'var(--ps-text-sm)',
                fontWeight:    isActive ? 600 : 400,
                cursor:        'pointer',
                letterSpacing: '.02em',
                transition:    'background .15s, color .15s, border-color .15s',
              }}
            >
              {t.label}
              <span
                style={{
                  fontFamily: 'var(--ps-font-ui)',
                  fontSize:   'var(--ps-text-xs)',
                  opacity:    0.7,
                  display:    'block',
                  fontWeight: 400,
                }}
              >
                {t.note}
              </span>
            </button>
          );
        })}
      </div>

      {/* Side-by-side comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
        <div>
          <div
            style={{
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      'var(--ps-text-xs)',
              fontWeight:    700,
              color:         'var(--ps-text-secondary)',
              letterSpacing: '.07em',
              marginBottom:  8,
            }}
          >
            YOUR PALETTE
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {colors.map((h, i) => (
              <div
                key={i}
                style={{
                  width:          52,
                  height:         38,
                  borderRadius:   'var(--ps-radius-md)',
                  background:     h,
                  border:         '1px solid rgba(0,0,0,.08)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontFamily:     'var(--ps-font-mono)',
                  fontSize:       7,
                  color:          textOn(h),
                  fontWeight:     500,
                }}
              >
                {h.toUpperCase().slice(0, 7)}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      'var(--ps-text-xs)',
              fontWeight:    700,
              color:         'var(--ps-text-secondary)',
              letterSpacing: '.07em',
              marginBottom:  8,
            }}
          >
            AS SEEN WITH {cvdType.toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {simulated.map((h, i) => (
              <div
                key={i}
                style={{
                  width:          52,
                  height:         38,
                  borderRadius:   'var(--ps-radius-md)',
                  background:     h,
                  border:         '1px solid rgba(0,0,0,.08)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontFamily:     'var(--ps-font-mono)',
                  fontSize:       7,
                  color:          textOn(h),
                  fontWeight:     500,
                }}
              >
                {h.toUpperCase().slice(0, 7)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confusion warnings */}
      {confusions.length > 0 && (
        <div
          style={{
            background:   'var(--ps-danger-subtle)',
            border:       '1px solid var(--ps-danger)',
            borderRadius: 'var(--ps-radius-md)',
            padding:      '10px 14px',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily:   'var(--ps-font-ui)',
              fontWeight:   600,
              fontSize:     'var(--ps-text-sm)',
              color:        'var(--ps-danger)',
              marginBottom: 4,
            }}
          >
            ⚠ Colour confusion detected
          </div>
          {confusions.map(({ i, j }, idx) => (
            <div
              key={idx}
              style={{
                fontFamily:   'var(--ps-font-ui)',
                fontSize:     'var(--ps-text-sm)',
                color:        'var(--ps-text-secondary)',
                marginBottom: 2,
              }}
            >
              Colours {i + 1} and {j + 1} look nearly identical to someone with {cvdType}.
              Consider increasing their lightness difference (at least 20% L apart).
            </div>
          ))}
        </div>
      )}

      {confusions.length === 0 && (
        <div
          style={{
            background:   'var(--ps-success-subtle)',
            border:       '1px solid var(--ps-success)',
            borderRadius: 'var(--ps-radius-md)',
            padding:      '10px 14px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-sm)',
              color:      'var(--ps-success)',
              fontWeight: 600,
            }}
          >
            ✓ No colour confusions for {cvdType}
          </div>
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-xs)',
              color:      'var(--ps-text-secondary)',
              marginTop:  2,
            }}
          >
            All colours remain distinguishable. Remember to also check the other two types.
          </div>
        </div>
      )}

      {/* Guidance note */}
      <div
        style={{
          fontFamily:  'var(--ps-font-ui)',
          fontSize:    'var(--ps-text-xs)',
          color:       'var(--ps-text-secondary)',
          marginTop:   14,
          lineHeight:  1.6,
          borderTop:   '1px solid var(--ps-border)',
          paddingTop:  12,
        }}
      >
        <strong style={{ color: 'var(--ps-text-primary)' }}>CVD best practices:</strong>{' '}
        Never use colour as the only way to convey meaning — always pair it with an icon, label,
        or pattern. Ensure critical UI elements have a lightness difference of at least 20–30%
        in addition to hue.
      </div>
    </div>
  );
}
