import { getColourName } from '../utils/colourNames';
import { contrastRatio } from '../utils/colourMath';

const WHITE = '#FFFFFF';
const BLACK = '#000000';

function wcag(ratio) {
  return {
    aa:    ratio >= 4.5,
    aaLg:  ratio >= 3,
    aaa:   ratio >= 7,
    aaaLg: ratio >= 4.5,
  };
}

function Badge({ pass, label }) {
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           3,
        fontFamily:    'var(--ps-font-mono)',
        fontSize:      10,
        fontWeight:    600,
        padding:       '2px 6px',
        borderRadius:  'var(--ps-radius-sm)',
        background:    pass ? 'var(--ps-success-subtle, #f0fdf4)' : 'var(--ps-warning-subtle, #fef3c7)',
        color:         pass ? 'var(--ps-success, #16a34a)'        : 'var(--ps-warning, #b45309)',
        border:        `1px solid ${pass ? 'var(--ps-success, #16a34a)' : 'var(--ps-warning, #b45309)'}`,
        opacity:       0.85,
        whiteSpace:    'nowrap',
      }}
    >
      {pass ? '✓' : '✗'} {label}
    </span>
  );
}

function AccessRow({ against, ratio }) {
  const w = wcag(ratio);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          fontFamily:    'var(--ps-font-ui)',
          fontSize:      'var(--ps-text-xs)',
          color:         'var(--ps-text-tertiary)',
          letterSpacing: '.06em',
          fontWeight:    600,
        }}
      >
        ON {against.toUpperCase()} — {ratio.toFixed(2)}:1
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <Badge pass={w.aa}    label="AA"      />
        <Badge pass={w.aaa}   label="AAA"     />
        <Badge pass={w.aaLg}  label="AA Lg"   />
        <Badge pass={w.aaaLg} label="AAA Lg"  />
      </div>
    </div>
  );
}

export default function ColourNamesTab({ colors }) {
  if (!colors || colors.length === 0) {
    return (
      <div
        className="card"
        style={{
          fontFamily: 'var(--ps-font-ui)',
          color:      'var(--ps-text-tertiary)',
          textAlign:  'center',
          padding:    '40px 0',
        }}
      >
        Add at least one colour to see colour names and accessibility info.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ padding: '14px 18px' }}>
        <p
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-sm)',
            color:      'var(--ps-text-secondary)',
            lineHeight: 1.5,
            margin:     0,
          }}
        >
          Each colour is matched to its nearest named colour and checked against WCAG 2.1 contrast
          requirements on both white and black backgrounds. <strong>AA</strong> requires ≥ 4.5:1 for normal
          text (≥ 3:1 for large text). <strong>AAA</strong> requires ≥ 7:1 (≥ 4.5:1 large).
        </p>
      </div>

      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap:                 12,
        }}
      >
        {colors.map(hex => {
          const name          = getColourName(hex);
          const ratioOnWhite  = contrastRatio(hex, WHITE);
          const ratioOnBlack  = contrastRatio(hex, BLACK);

          return (
            <div
              key={hex}
              className="card"
              style={{ padding: 0, overflow: 'hidden' }}
            >
              {/* Swatch header */}
              <div
                style={{
                  background: hex,
                  height:     72,
                  display:    'flex',
                  alignItems: 'flex-end',
                  padding:    '10px 16px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--ps-font-mono)',
                    fontSize:   'var(--ps-text-sm)',
                    fontWeight: 600,
                    color:      ratioOnWhite >= ratioOnBlack ? WHITE : BLACK,
                    letterSpacing: '.04em',
                  }}
                >
                  {hex.toUpperCase()}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Named colour */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width:        32,
                      height:       32,
                      borderRadius: 'var(--ps-radius-md)',
                      background:   hex,
                      flexShrink:   0,
                      border:       '1px solid var(--ps-border)',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--ps-font-ui)',
                        fontSize:   'var(--ps-text-base)',
                        fontWeight: 600,
                        color:      'var(--ps-text-primary)',
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--ps-font-ui)',
                        fontSize:   'var(--ps-text-xs)',
                        color:      'var(--ps-text-tertiary)',
                        marginTop:  2,
                      }}
                    >
                      Nearest named colour
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--ps-border)' }} />

                {/* WCAG rows */}
                <AccessRow against="white" ratio={ratioOnWhite} />
                <AccessRow against="black" ratio={ratioOnBlack} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
