import { useState } from 'react';
import { hexToRgb, rgbToHsl, hslToHex, textOn, contrastRatio } from '../utils/colourMath';

const SECTIONS = [
  { key: 'darkmode', label: 'Dark Mode' },
  { key: 'variations', label: 'Variations' },
  { key: 'surprise', label: 'Surprise Me' },
];

/* ── helpers ─────────────────────────────────────────────────────────────────── */

function toHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function findByRole(colors, roles, target) {
  const entry = Object.entries(roles).find(([, v]) => v.toLowerCase() === target);
  return entry ? entry[0] : null;
}

function lightestHex(colors) {
  let best = colors[0];
  let bestL = -1;
  for (const c of colors) {
    const { l } = toHsl(c);
    if (l > bestL) { bestL = l; best = c; }
  }
  return best;
}

function darkestHex(colors) {
  let best = colors[0];
  let bestL = 101;
  for (const c of colors) {
    const { l } = toHsl(c);
    if (l < bestL) { bestL = l; best = c; }
  }
  return best;
}

/* ── Dark Mode algorithm ─────────────────────────────────────────────────────── */

function generateDarkPalette(colors, roles) {
  const bgHex = findByRole(colors, roles, 'background') || lightestHex(colors);
  const textHex = findByRole(colors, roles, 'text') || darkestHex(colors);

  const darkColors = colors.map(hex => {
    const { h, s, l } = toHsl(hex);
    const lowerHex = hex.toLowerCase();

    if (lowerHex === bgHex.toLowerCase()) {
      // Background → dark, tinted to original hue
      return hslToHex(h, clamp(s, 5, 25), clamp(10, 8, 12));
    }
    if (lowerHex === textHex.toLowerCase()) {
      // Text → light, tinted to original hue
      return hslToHex(h, clamp(s, 3, 15), clamp(94, 92, 96));
    }

    const role = roles[hex] || '';
    const rLower = role.toLowerCase();
    if (rLower === 'hero' || rLower === 'accent' || rLower === 'primary') {
      // Hero/Accent → keep hue, reduce sat 10%, bump lightness 8-12%
      return hslToHex(h, clamp(s - 10, 0, 100), clamp(l + 10, 0, 100));
    }
    if (rLower === 'neutral' || rLower === 'secondary') {
      // Neutral → flip lightness, reduce sat
      return hslToHex(h, clamp(s - 15, 0, 100), clamp(100 - l, 0, 100));
    }

    // Default: flip lightness, slight sat reduction
    return hslToHex(h, clamp(s - 8, 0, 100), clamp(100 - l, 0, 100));
  });

  const darkRoles = {};
  colors.forEach((hex, i) => {
    if (roles[hex]) darkRoles[darkColors[i]] = roles[hex];
  });

  return { darkColors, darkRoles };
}

/* ── Variation generators ────────────────────────────────────────────────────── */

function makeWarmer(colors) {
  return colors.map(hex => {
    const { h, s, l } = toHsl(hex);
    return hslToHex((h + 15) % 360, clamp(s + 10, 0, 100), l);
  });
}

function makeCooler(colors) {
  return colors.map(hex => {
    const { h, s, l } = toHsl(hex);
    return hslToHex((h + 345) % 360, clamp(s - 5, 0, 100), l); // +345 = -15 toward blue
  });
}

function makeMuted(colors) {
  return colors.map(hex => {
    const { h, s, l } = toHsl(hex);
    const newL = l + (50 - l) * 0.2; // push toward 50
    return hslToHex(h, clamp(s - 25, 0, 100), clamp(newL, 0, 100));
  });
}

function makeVibrant(colors) {
  return colors.map(hex => {
    const { h, s, l } = toHsl(hex);
    // increase contrast: push light colours lighter, dark colours darker
    const newL = l >= 50 ? clamp(l + 6, 0, 100) : clamp(l - 6, 0, 100);
    return hslToHex(h, clamp(s + 20, 0, 100), newL);
  });
}

function buildVariationRoles(original, variant, roles) {
  const r = {};
  original.forEach((hex, i) => {
    if (roles[hex]) r[variant[i]] = roles[hex];
  });
  return r;
}

/* ── Surprise Me strategies ──────────────────────────────────────────────────── */

function heroHex(colors, roles) {
  const h = findByRole(colors, roles, 'hero') || findByRole(colors, roles, 'accent') || findByRole(colors, roles, 'primary');
  if (h) return h;
  // pick the most saturated colour
  let best = colors[0];
  let bestS = -1;
  for (const c of colors) {
    const { s } = toHsl(c);
    if (s > bestS) { bestS = s; best = c; }
  }
  return best;
}

function surpriseComplementary(colors, roles) {
  const hero = heroHex(colors, roles);
  const { h, s, l } = toHsl(hero);
  const compHue = (h + 180) % 360;
  const result = colors.map((hex, i) => {
    const orig = toHsl(hex);
    if (hex.toLowerCase() === hero.toLowerCase()) return hslToHex(compHue, s, l);
    // shift other colours proportionally
    return hslToHex((orig.h + 180) % 360, orig.s, orig.l);
  });
  return { colors: result, description: 'Complementary shift — the hero hue was rotated 180° and all supporting colours followed.' };
}

function surpriseMonochromatic(colors, roles) {
  const hero = heroHex(colors, roles);
  const { h, s } = toHsl(hero);
  const step = 80 / Math.max(colors.length - 1, 1);
  const result = colors.map((_, i) => {
    const l = 10 + step * i;
    return hslToHex(h, clamp(s - i * 3, 10, 100), clamp(l, 5, 95));
  });
  return { colors: result, description: `Monochromatic — all colours are tints and shades of the hero hue (${Math.round(h)}°).` };
}

function surpriseSeasonal(colors) {
  const seasons = [
    { name: 'Spring pastels', hues: [340, 30, 90, 160, 280], baseSat: 45, baseLight: 78 },
    { name: 'Summer brights', hues: [195, 45, 350, 160, 280], baseSat: 75, baseLight: 55 },
    { name: 'Autumn earth tones', hues: [25, 35, 10, 45, 0], baseSat: 50, baseLight: 42 },
    { name: 'Winter cool darks', hues: [210, 230, 250, 190, 270], baseSat: 35, baseLight: 30 },
  ];
  const season = seasons[Math.floor(Math.random() * seasons.length)];
  const result = colors.map((_, i) => {
    const idx = i % season.hues.length;
    const lOffset = (i % 3) * 12 - 12;
    return hslToHex(season.hues[idx], clamp(season.baseSat + (i % 2 ? 10 : -5), 10, 100), clamp(season.baseLight + lOffset, 8, 95));
  });
  return { colors: result, description: `Seasonal — ${season.name} palette inspired by the feeling of the season.` };
}

function surpriseAnalogous(colors, roles) {
  const hero = heroHex(colors, roles);
  const { h, s } = toHsl(hero);
  const offsets = [-30, -15, 0, 15, 30];
  const result = colors.map((_, i) => {
    const offset = offsets[i % offsets.length];
    const l = 25 + (i / Math.max(colors.length - 1, 1)) * 55;
    return hslToHex((h + offset + 360) % 360, clamp(s + (i % 2 ? 5 : -5), 15, 100), clamp(l, 10, 95));
  });
  return { colors: result, description: `Analogous harmony — colours clustered around the hero hue (${Math.round(h)}° ± 30°).` };
}

function runSurprise(colors, roles) {
  const strategies = [surpriseComplementary, surpriseMonochromatic, surpriseSeasonal, surpriseAnalogous];
  const pick = strategies[Math.floor(Math.random() * strategies.length)];
  return pick(colors, roles);
}

/* ── Reusable sub-components ─────────────────────────────────────────────────── */

function SwatchStrip({ colors: swatches }) {
  return (
    <div style={{ display: 'flex', borderRadius: 'var(--ps-radius-md)', overflow: 'hidden', height: 36 }}>
      {swatches.map((c, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: c,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--ps-font-mono)',
            fontSize: 10,
            color: textOn(c),
          }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

function MiniMockup({ palette, label }) {
  const bg = palette[0] || '#ffffff';
  const text = palette[1] || '#000000';
  const accent = palette[2] || palette[0] || '#666666';
  const secondary = palette[3] || palette[1] || '#999999';

  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-secondary)', marginBottom: 4, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ borderRadius: 'var(--ps-radius-md)', overflow: 'hidden', border: '1px solid var(--ps-border)', boxShadow: 'var(--ps-shadow-sm)' }}>
        {/* Nav bar */}
        <div style={{ background: accent, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: textOn(accent), fontFamily: 'var(--ps-font-ui)', fontWeight: 700, fontSize: 12 }}>Logo</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Home', 'About', 'Contact'].map(t => (
              <span key={t} style={{ color: textOn(accent), fontFamily: 'var(--ps-font-ui)', fontSize: 10, opacity: 0.85 }}>{t}</span>
            ))}
          </div>
        </div>
        {/* Hero section */}
        <div style={{ background: bg, padding: '20px 12px', textAlign: 'center' }}>
          <div style={{ color: text, fontFamily: 'var(--ps-font-ui)', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            Welcome to Your Brand
          </div>
          <div style={{ color: secondary, fontFamily: 'var(--ps-font-ui)', fontSize: 10, marginBottom: 10 }}>
            A short tagline describing the product.
          </div>
          <span style={{ display: 'inline-block', background: accent, color: textOn(accent), fontFamily: 'var(--ps-font-ui)', fontSize: 10, padding: '4px 14px', borderRadius: 'var(--ps-radius-full)', fontWeight: 600 }}>
            Get Started
          </span>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ onClick, children, secondary }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--ps-font-ui)',
        fontSize: 'var(--ps-text-sm)',
        fontWeight: 600,
        padding: secondary ? '8px 20px' : '12px 28px',
        borderRadius: 'var(--ps-radius-full)',
        border: secondary ? '1px solid var(--ps-border)' : 'none',
        background: secondary ? 'var(--ps-bg-surface)' : 'var(--ps-accent)',
        color: secondary ? 'var(--ps-text-primary)' : 'var(--ps-accent-text)',
        cursor: 'pointer',
        transition: 'all .15s',
        boxShadow: secondary ? 'none' : 'var(--ps-shadow-sm)',
      }}
    >
      {children}
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */

export default function VariationsTab({ colors, roles, onApplyPalette }) {
  const [section, setSection] = useState('overview');
  const [darkResult, setDarkResult] = useState(null);
  const [variations, setVariations] = useState(null);
  const [surprise, setSurprise] = useState(null);

  /* ── Dark Mode ── */
  const handleGenerateDark = () => {
    const { darkColors, darkRoles } = generateDarkPalette(colors, roles);
    setDarkResult({ darkColors, darkRoles });
  };

  const handleApplyDark = () => {
    if (darkResult) onApplyPalette(darkResult.darkColors, darkResult.darkRoles);
  };

  /* ── Variations ── */
  const handleShowVariations = () => {
    const defs = [
      { name: 'Warmer', desc: 'Hues shifted toward red/orange, saturation boosted.', fn: makeWarmer },
      { name: 'Cooler', desc: 'Hues shifted toward blue, saturation slightly reduced.', fn: makeCooler },
      { name: 'Muted', desc: 'Saturation pulled back, lightness pushed toward the midrange.', fn: makeMuted },
      { name: 'Vibrant', desc: 'Saturation cranked up, contrast between light and dark increased.', fn: makeVibrant },
    ];
    const results = defs.map(d => {
      const variant = d.fn(colors);
      return { ...d, colors: variant, roles: buildVariationRoles(colors, variant, roles) };
    });
    setVariations(results);
  };

  /* ── Surprise Me ── */
  const handleSurprise = () => {
    const result = runSurprise(colors, roles);
    const newRoles = buildVariationRoles(colors, result.colors, roles);
    setSurprise({ ...result, roles: newRoles });
  };

  /* ── Render ── */

  const renderDarkMode = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <ActionButton onClick={handleGenerateDark}>Generate Dark Mode</ActionButton>
      </div>

      {darkResult && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <MiniMockup palette={colors} label="Light Mode" />
            <MiniMockup palette={darkResult.darkColors} label="Dark Mode" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-secondary)', marginBottom: 4, fontWeight: 600 }}>Light palette</div>
            <SwatchStrip colors={colors} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-secondary)', marginBottom: 4, fontWeight: 600 }}>Dark palette</div>
            <SwatchStrip colors={darkResult.darkColors} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <ActionButton onClick={handleApplyDark}>Apply Dark Palette</ActionButton>
          </div>
        </>
      )}
    </div>
  );

  const renderVariations = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <ActionButton onClick={handleShowVariations}>Show Me Options</ActionButton>
      </div>

      {variations && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {variations.map(v => (
            <div key={v.name} className="card" style={{ padding: 14 }}>
              <div style={{ fontFamily: 'var(--ps-font-ui)', fontWeight: 700, fontSize: 'var(--ps-text-sm)', color: 'var(--ps-text-primary)', marginBottom: 2 }}>
                {v.name}
              </div>
              <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-secondary)', marginBottom: 8 }}>
                {v.desc}
              </div>
              <SwatchStrip colors={v.colors} />
              <div style={{ marginTop: 10, textAlign: 'center' }}>
                <ActionButton secondary onClick={() => onApplyPalette(v.colors, v.roles)}>
                  Use this palette
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSurprise = () => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 20 }}>
        <ActionButton onClick={handleSurprise}>Surprise Me</ActionButton>
      </div>

      {surprise && (
        <div>
          <div style={{ maxWidth: 520, margin: '0 auto 12px' }}>
            <SwatchStrip colors={surprise.colors} />
          </div>
          <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', color: 'var(--ps-text-secondary)', marginBottom: 16 }}>
            {surprise.description}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <ActionButton onClick={() => onApplyPalette(surprise.colors, surprise.roles)}>
              Love it — use this
            </ActionButton>
            <ActionButton secondary onClick={handleSurprise}>
              Try another
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Sub-nav pills */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize: 'var(--ps-text-sm)',
              fontWeight: section === s.key ? 600 : 400,
              padding: '6px 14px',
              borderRadius: 'var(--ps-radius-full)',
              border: '1px solid ' + (section === s.key ? 'var(--ps-accent)' : 'var(--ps-border)'),
              background: section === s.key ? 'var(--ps-accent-subtle)' : 'var(--ps-bg-surface)',
              color: section === s.key ? 'var(--ps-accent)' : 'var(--ps-text-secondary)',
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'darkmode' && renderDarkMode()}
      {section === 'variations' && renderVariations()}
      {section === 'surprise' && renderSurprise()}
    </div>
  );
}
