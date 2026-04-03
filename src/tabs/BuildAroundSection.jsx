import { useState } from 'react';
import { hexToRgb, rgbToHsl, hslToHex, textOn, contrastRatio } from '../utils/colourMath';

/* ── helpers ────────────────────────────────────────────────────────────────── */

function anchorToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function wrap(h) {
  return ((h % 360) + 360) % 360;
}

/* ── palette generators ─────────────────────────────────────────────────────── */

function buildComplementary({ h, s, l }) {
  return {
    name: 'Complementary',
    description: 'Anchor + its opposite on the colour wheel, with tinted neutrals.',
    colors: [
      hslToHex(h, s, l),                       // anchor
      hslToHex(wrap(h + 180), s, Math.min(l + 5, 95)),  // complement
      hslToHex(h, Math.max(s * 0.15, 5), 92),  // light neutral tinted to anchor
      hslToHex(h, Math.max(s * 0.15, 5), 18),  // dark neutral tinted to anchor
      hslToHex(wrap(h + 180), s * 0.35, 55),   // muted midtone
    ],
  };
}

function buildAnalogous({ h, s, l }) {
  return {
    name: 'Analogous',
    description: 'Anchor + two neighbours for a harmonious, low-contrast feel.',
    colors: [
      hslToHex(h, s, l),                       // anchor
      hslToHex(wrap(h - 30), s * 0.9, l),      // neighbour left
      hslToHex(wrap(h + 30), s * 0.9, l),      // neighbour right
      hslToHex(h, Math.max(s * 0.12, 4), 93),  // light neutral
      hslToHex(h, Math.max(s * 0.12, 4), 16),  // dark neutral
    ],
  };
}

function buildTriadic({ h, s, l }) {
  return {
    name: 'Triadic',
    description: 'Anchor + two equidistant hues for a vibrant, balanced palette.',
    colors: [
      hslToHex(h, s, l),                        // anchor
      hslToHex(wrap(h + 120), s * 0.85, l),     // triad point 1
      hslToHex(wrap(h + 240), s * 0.85, l),     // triad point 2
      hslToHex(h, Math.max(s * 0.1, 4), 94),    // light neutral
    ],
  };
}

/* ── contrast scoring ───────────────────────────────────────────────────────── */

function countContrastIssues(palette) {
  let issues = 0;
  for (let i = 0; i < palette.length; i++) {
    for (let j = i + 1; j < palette.length; j++) {
      const ratio = contrastRatio(palette[i], palette[j]);
      if (ratio < 2) issues += 1;          // near-identical pairs
    }
  }
  // Also check that at least one colour is readable on white and on black
  const onWhite = palette.some(c => contrastRatio(c, '#ffffff') >= 4.5);
  const onBlack = palette.some(c => contrastRatio(c, '#111111') >= 4.5);
  if (!onWhite) issues += 1;
  if (!onBlack) issues += 1;
  return issues;
}

/* ── styles ─────────────────────────────────────────────────────────────────── */

const swatch = (hex, isAnchor) => ({
  width: 36,
  height: 36,
  borderRadius: 'var(--ps-radius)',
  background: hex,
  border: isAnchor ? '2px solid var(--ps-accent)' : '1px solid var(--ps-border)',
  cursor: 'default',
  flexShrink: 0,
});

const pickerSwatch = (hex, selected) => ({
  width: 40,
  height: 40,
  borderRadius: 'var(--ps-radius)',
  background: hex,
  border: selected ? '2.5px solid var(--ps-accent)' : '1px solid var(--ps-border)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'var(--ps-text-sm)',
  fontWeight: 700,
  color: textOn(hex),
  transition: 'border .15s',
});

const accentBtn = {
  fontFamily: 'var(--ps-font-ui)',
  fontSize: 'var(--ps-text-sm)',
  fontWeight: 600,
  padding: '8px 18px',
  borderRadius: 'var(--ps-radius)',
  border: 'none',
  background: 'var(--ps-accent)',
  color: 'var(--ps-accent-text)',
  cursor: 'pointer',
  transition: 'opacity .15s',
};

const secondaryBtn = {
  ...accentBtn,
  background: 'var(--ps-bg-surface)',
  color: 'var(--ps-text)',
  border: '1px solid var(--ps-border)',
};

/* ── component ──────────────────────────────────────────────────────────────── */

export default function BuildAroundSection({ colors, onApplyPalette }) {
  const [anchor, setAnchor] = useState(null);
  const [customHex, setCustomHex] = useState('#5588cc');
  const [options, setOptions] = useState(null);

  const handlePickAnchor = (hex) => {
    setAnchor(hex);
    setOptions(null);
  };

  const handleCustomPick = () => {
    const cleaned = customHex.replace(/[^#0-9a-fA-F]/g, '');
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      handlePickAnchor(cleaned);
    }
  };

  const generate = () => {
    if (!anchor) return;
    const hsl = anchorToHsl(anchor);
    setOptions([
      buildComplementary(hsl),
      buildAnalogous(hsl),
      buildTriadic(hsl),
    ]);
  };

  const surpriseMe = () => {
    if (!anchor) return;
    const hsl = anchorToHsl(anchor);
    const candidates = [
      buildComplementary(hsl),
      buildAnalogous(hsl),
      buildTriadic(hsl),
    ];
    let best = candidates[0];
    let bestScore = Infinity;
    for (const c of candidates) {
      const score = countContrastIssues(c.colors);
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
    onApplyPalette(best.colors);
  };

  /* ── empty state ──────────────────────────────────────────────────────────── */

  const anchorPicker = (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontFamily: 'var(--ps-font-ui)',
        fontSize: 'var(--ps-text-sm)',
        color: 'var(--ps-text-secondary)',
        marginBottom: 10,
      }}>
        Pick a colour you want to keep, then we will build palettes around it.
      </p>

      {/* Current palette swatches */}
      {colors.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {colors.map((hex, i) => (
            <button
              key={i}
              onClick={() => handlePickAnchor(hex)}
              style={pickerSwatch(hex, anchor === hex)}
              title={hex}
            >
              {anchor === hex ? '\u2713' : ''}
            </button>
          ))}
        </div>
      )}

      {/* Custom hex input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={customHex}
          onChange={e => setCustomHex(e.target.value)}
          style={{ width: 36, height: 36, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 'var(--ps-radius)' }}
        />
        <input
          type="text"
          value={customHex}
          onChange={e => setCustomHex(e.target.value)}
          placeholder="#5588cc"
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize: 'var(--ps-text-sm)',
            padding: '6px 10px',
            borderRadius: 'var(--ps-radius)',
            border: '1px solid var(--ps-border)',
            background: 'var(--ps-bg-surface)',
            color: 'var(--ps-text)',
            width: 100,
          }}
        />
        <button style={secondaryBtn} onClick={handleCustomPick}>
          Use custom
        </button>
      </div>
    </div>
  );

  /* ── main render ──────────────────────────────────────────────────────────── */

  return (
    <div>
      {anchorPicker}

      {/* Action buttons */}
      {anchor && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button style={accentBtn} onClick={generate}>
            Build 3 palettes for me
          </button>
          <button style={secondaryBtn} onClick={surpriseMe}>
            Surprise me — pick the best
          </button>
        </div>
      )}

      {/* No anchor chosen */}
      {!anchor && (
        <p style={{
          fontFamily: 'var(--ps-font-ui)',
          fontSize: 'var(--ps-text-sm)',
          color: 'var(--ps-text-muted)',
          fontStyle: 'italic',
        }}>
          Choose an anchor colour above to get started.
        </p>
      )}

      {/* Generated palette cards */}
      {options && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {options.map((opt) => (
            <div className="card" key={opt.name} style={{
              flex: '1 1 240px',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div>
                <strong style={{
                  fontFamily: 'var(--ps-font-ui)',
                  fontSize: 'var(--ps-text-base)',
                  color: 'var(--ps-text)',
                }}>
                  {opt.name}
                </strong>
                <p style={{
                  fontFamily: 'var(--ps-font-ui)',
                  fontSize: 'var(--ps-text-sm)',
                  color: 'var(--ps-text-secondary)',
                  margin: '4px 0 0',
                }}>
                  {opt.description}
                </p>
              </div>

              {/* Swatch strip */}
              <div style={{ display: 'flex', gap: 6 }}>
                {opt.colors.map((hex, i) => (
                  <div
                    key={i}
                    style={swatch(hex, hex.toLowerCase() === anchor.toLowerCase())}
                    title={hex}
                  />
                ))}
              </div>

              <button
                style={{ ...accentBtn, alignSelf: 'flex-start', marginTop: 'auto' }}
                onClick={() => onApplyPalette(opt.colors)}
              >
                Use this palette
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
