import { hexToRgb, rgbToHsl, luminance, contrastRatio, textOn, simulateCVD } from '../utils/colourMath';
import { FONT_PAIRS } from '../constants';

const GUIDE_ID = 'ps-brand-guide-printable';

const CVD_TYPES = [
  { key: 'protanopia',   label: 'Red-blind' },
  { key: 'deuteranopia', label: 'Green-blind' },
  { key: 'tritanopia',   label: 'Blue-blind' },
];

// Print styles are handled globally in index.css via @media print rules
// targeting #ps-brand-guide-printable

// ─── Derive role colours with fallbacks ─────────────────────────────────────

function deriveRoleColours(colors, roles) {
  const findByRole = (r) => Object.keys(roles).find(k => roles[k] === r);

  const data = colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    return { hex, ...rgbToHsl(r, g, b), lum: luminance(r, g, b) };
  });

  const bg = findByRole('Background') ||
    (data.length ? data.reduce((best, c) => (c.l > best.l ? c : best), data[0]).hex : '#f5f2ed');

  const hero = findByRole('Hero') ||
    (data.length ? data.reduce((best, c) => (c.s > best.s ? c : best), data[0]).hex : '#6b7280');

  let accent = findByRole('Accent');
  if (!accent) {
    const candidates = data.filter(c => c.hex !== hero);
    accent = candidates.length
      ? candidates.reduce((best, c) => (c.s > best.s ? c : best), candidates[0]).hex
      : '#2a7a7a';
  }

  const text = findByRole('Text') ||
    (data.length ? data.reduce((best, c) => (c.l < best.l ? c : best), data[0]).hex : '#1a1a2e');

  let neutral = findByRole('Neutral');
  if (!neutral) {
    const candidates = data.filter(c => c.hex !== bg && c.hex !== hero && c.hex !== text);
    neutral = candidates.length
      ? candidates.reduce((best, c) => {
          const sc = Math.abs(c.l - 50) + (100 - c.s);
          const sb = Math.abs(best.l - 50) + (100 - best.s);
          return sc < sb ? c : best;
        }, candidates[0]).hex
      : '#888888';
  }

  return { Background: bg, Hero: hero, Accent: accent, Text: text, Neutral: neutral };
}

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section className="ps-guide-section" style={{ marginBottom: 40 }}>
      <h2 style={{
        fontFamily: 'var(--ps-font-ui)',
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--ps-text-primary)',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '2px solid var(--ps-border)',
        letterSpacing: '.02em',
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── 1. Brand Colour Palette ────────────────────────────────────────────────

function ColourPaletteSection({ colors, roles }) {
  return (
    <Section title="Brand Colour Palette">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 14,
      }}>
        {colors.map(hex => {
          const { r, g, b } = hexToRgb(hex);
          const { h, s, l } = rgbToHsl(r, g, b);
          const roleName = roles[hex] || '—';
          return (
            <div key={hex} className="ps-guide-colour-card" style={{
              borderRadius: 'var(--ps-radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--ps-border)',
              background: 'var(--ps-bg-surface)',
            }}>
              <div style={{
                background: hex,
                height: 80,
                display: 'flex',
                alignItems: 'flex-end',
                padding: '8px 12px',
              }}>
                <span style={{
                  fontFamily: 'var(--ps-font-ui)',
                  fontSize: 'var(--ps-text-sm)',
                  fontWeight: 600,
                  color: textOn(hex),
                }}>
                  {roleName}
                </span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{
                  fontFamily: 'var(--ps-font-mono)',
                  fontSize: 'var(--ps-text-sm)',
                  color: 'var(--ps-text-primary)',
                  fontWeight: 600,
                  marginBottom: 4,
                }}>
                  {hex.toUpperCase()}
                </div>
                <div style={{
                  fontFamily: 'var(--ps-font-mono)',
                  fontSize: 11,
                  color: 'var(--ps-text-secondary)',
                  lineHeight: 1.7,
                }}>
                  RGB({r}, {g}, {b})<br />
                  HSL({Math.round(h)}°, {Math.round(s)}%, {Math.round(l)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── 2. Colour Usage Rules ──────────────────────────────────────────────────

function ColourUsageSection({ roleColours }) {
  const pairs = [
    { fg: 'Text',   bg: 'Background', purpose: 'body copy' },
    { fg: 'Hero',   bg: 'Background', purpose: 'headings on background' },
    { fg: 'Accent', bg: 'Background', purpose: 'links & buttons on background' },
    { fg: 'Hero',   bg: 'Accent',     purpose: 'Hero on Accent' },
  ];

  const rules = pairs.map(({ fg, bg, purpose }) => {
    const ratio = contrastRatio(roleColours[fg], roleColours[bg]);
    let level, colour, icon;
    if (ratio >= 7) {
      level = 'do';     colour = 'var(--ps-success)'; icon = '✓';
    } else if (ratio >= 4.5) {
      level = 'do';     colour = 'var(--ps-success)'; icon = '✓';
    } else if (ratio >= 3) {
      level = 'caution'; colour = 'var(--ps-warning)'; icon = '⚠';
    } else {
      level = 'dont';   colour = 'var(--ps-danger)';  icon = '✗';
    }

    const advice = level === 'dont'
      ? `Never place ${fg} on ${bg} — ratio ${ratio.toFixed(1)}:1`
      : level === 'caution'
        ? `Use ${fg} on ${bg} only for large text (${ratio.toFixed(1)}:1)`
        : `Use ${fg} on ${bg} for ${purpose} (${ratio.toFixed(1)}:1)`;

    return { advice, colour, icon, level, ratio };
  });

  return (
    <Section title="Colour Usage Rules">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rules.map((rule, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 'var(--ps-radius-md)',
            border: `1px solid var(--ps-border)`,
            background: 'var(--ps-bg-surface)',
          }}>
            <span style={{
              width: 28, height: 28,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
              background: rule.colour,
              color: '#fff',
              flexShrink: 0,
            }}>
              {rule.icon}
            </span>
            <span style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize: 'var(--ps-text-sm)',
              color: 'var(--ps-text-primary)',
            }}>
              {rule.advice}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── 3. Typography ──────────────────────────────────────────────────────────

function TypographySection({ selectedFont }) {
  if (!selectedFont) {
    return (
      <Section title="Typography">
        <p style={{
          fontFamily: 'var(--ps-font-ui)',
          fontSize: 'var(--ps-text-sm)',
          color: 'var(--ps-text-secondary)',
          fontStyle: 'italic',
        }}>
          No font pair selected. Choose one in the Typography tab.
        </p>
      </Section>
    );
  }

  const specimens = [
    { label: 'Heading',    font: selectedFont.heading, size: 36, weight: 700 },
    { label: 'Subheading', font: selectedFont.heading, size: 24, weight: 600 },
    { label: 'Body',       font: selectedFont.body,    size: 16, weight: 400 },
    { label: 'Caption',    font: selectedFont.body,    size: 12, weight: 400 },
  ];

  return (
    <Section title="Typography">
      <div style={{
        fontFamily: 'var(--ps-font-ui)',
        fontSize: 'var(--ps-text-sm)',
        color: 'var(--ps-text-secondary)',
        marginBottom: 16,
      }}>
        <strong style={{ color: 'var(--ps-text-primary)' }}>{selectedFont.name}</strong>
        {' — '}Heading: <span style={{ fontFamily: 'var(--ps-font-mono)' }}>{selectedFont.heading}</span>
        {' · '}Body: <span style={{ fontFamily: 'var(--ps-font-mono)' }}>{selectedFont.body}</span>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        padding: 20,
        borderRadius: 'var(--ps-radius-lg)',
        border: '1px solid var(--ps-border)',
        background: 'var(--ps-bg-surface)',
      }}>
        {specimens.map(({ label, font, size, weight }) => (
          <div key={label}>
            <div style={{
              fontFamily: 'var(--ps-font-mono)',
              fontSize: 10,
              color: 'var(--ps-text-secondary)',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}>
              {label} — {size}px
            </div>
            <div style={{
              fontFamily: font,
              fontSize: size,
              fontWeight: weight,
              color: 'var(--ps-text-primary)',
              lineHeight: 1.3,
            }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── 4. Spacing & Proportion ────────────────────────────────────────────────

function SpacingSection({ roleColours }) {
  const segments = [
    { label: 'Primary (60%)',  pct: 60, colour: roleColours.Background },
    { label: 'Secondary (30%)', pct: 30, colour: roleColours.Hero },
    { label: 'Accent (10%)',   pct: 10, colour: roleColours.Accent },
  ];

  return (
    <Section title="Spacing & Proportion">
      <p style={{
        fontFamily: 'var(--ps-font-ui)',
        fontSize: 'var(--ps-text-sm)',
        color: 'var(--ps-text-secondary)',
        marginBottom: 14,
      }}>
        Apply the 60-30-10 rule to maintain visual balance across layouts.
      </p>
      <div style={{
        display: 'flex',
        height: 48,
        borderRadius: 'var(--ps-radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--ps-border)',
      }}>
        {segments.map(({ pct, colour }) => (
          <div key={pct} style={{
            width: `${pct}%`,
            background: colour,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'var(--ps-font-mono)',
              fontSize: 11,
              fontWeight: 600,
              color: textOn(colour),
            }}>
              {pct}%
            </span>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 10,
      }}>
        {segments.map(({ label, colour }) => (
          <div key={label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{
              width: 12, height: 12,
              borderRadius: 3,
              background: colour,
              border: '1px solid var(--ps-border)',
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize: 11,
              color: 'var(--ps-text-secondary)',
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── 5. Accessibility ───────────────────────────────────────────────────────

function AccessibilitySection({ colors, roles }) {
  // Contrast matrix
  const matrixColours = colors.slice(0, 8); // cap for readability

  return (
    <Section title="Accessibility">
      {/* Contrast matrix */}
      <h3 style={{
        fontFamily: 'var(--ps-font-ui)',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ps-text-primary)',
        marginBottom: 10,
      }}>
        Contrast Matrix
      </h3>
      <div style={{ overflowX: 'auto', marginBottom: 28 }}>
        <table style={{
          borderCollapse: 'collapse',
          fontFamily: 'var(--ps-font-mono)',
          fontSize: 11,
          width: '100%',
        }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--ps-text-secondary)' }} />
              {matrixColours.map(hex => (
                <th key={hex} style={{ padding: '6px 4px', textAlign: 'center' }}>
                  <div style={{
                    width: 22, height: 22,
                    borderRadius: 4,
                    background: hex,
                    border: '1px solid var(--ps-border)',
                    margin: '0 auto',
                  }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixColours.map(rowHex => (
              <tr key={rowHex}>
                <td style={{
                  padding: '4px 8px',
                  color: 'var(--ps-text-secondary)',
                  whiteSpace: 'nowrap',
                }}>
                  {roles[rowHex] || rowHex.toUpperCase()}
                </td>
                {matrixColours.map(colHex => {
                  if (rowHex === colHex) {
                    return (
                      <td key={colHex} style={{
                        padding: '4px 6px',
                        textAlign: 'center',
                        color: 'var(--ps-text-secondary)',
                        opacity: 0.3,
                      }}>
                        —
                      </td>
                    );
                  }
                  const ratio = contrastRatio(rowHex, colHex);
                  let colour;
                  if (ratio >= 7) colour = 'var(--ps-success)';
                  else if (ratio >= 4.5) colour = 'var(--ps-success)';
                  else if (ratio >= 3) colour = 'var(--ps-warning)';
                  else colour = 'var(--ps-danger)';

                  return (
                    <td key={colHex} style={{
                      padding: '4px 6px',
                      textAlign: 'center',
                      color: colour,
                      fontWeight: 600,
                    }}>
                      {ratio.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CVD simulation thumbnails */}
      <h3 style={{
        fontFamily: 'var(--ps-font-ui)',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ps-text-primary)',
        marginBottom: 10,
      }}>
        Colour Vision Deficiency Simulation
      </h3>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Normal vision */}
        <div>
          <div style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize: 11,
            color: 'var(--ps-text-secondary)',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}>
            Normal
          </div>
          <div style={{ display: 'flex', borderRadius: 'var(--ps-radius-md)', overflow: 'hidden' }}>
            {colors.map(hex => (
              <div key={hex} style={{ width: 32, height: 32, background: hex }} />
            ))}
          </div>
        </div>

        {CVD_TYPES.map(cvd => (
          <div key={cvd.key}>
            <div style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize: 11,
              color: 'var(--ps-text-secondary)',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}>
              {cvd.label}
            </div>
            <div style={{ display: 'flex', borderRadius: 'var(--ps-radius-md)', overflow: 'hidden' }}>
              {colors.map(hex => {
                const { r, g, b } = hexToRgb(hex);
                const simHex = simulateCVD(r, g, b, cvd.key);
                return (
                  <div key={hex} style={{ width: 32, height: 32, background: simHex }} />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function BrandGuideTab({ colors, roles, selectedFont }) {
  const roleColours = deriveRoleColours(colors, roles);

  return (
    <div className="card" id={GUIDE_ID}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ps-text-primary)',
            margin: 0,
          }}>
            Brand Guidelines
          </h1>
          <p style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize: 'var(--ps-text-sm)',
            color: 'var(--ps-text-secondary)',
            margin: '4px 0 0',
          }}>
            Auto-generated from your palette &amp; settings
          </p>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            background: 'var(--ps-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--ps-radius-md)',
            padding: '8px 18px',
            fontFamily: 'var(--ps-font-ui)',
            fontSize: 'var(--ps-text-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '.02em',
          }}
        >
          Print / Save as PDF
        </button>
      </div>

      <ColourPaletteSection colors={colors} roles={roles} />
      <ColourUsageSection roleColours={roleColours} />
      <TypographySection selectedFont={selectedFont} />
      <SpacingSection roleColours={roleColours} />
      <AccessibilitySection colors={colors} roles={roles} />
    </div>
  );
}
