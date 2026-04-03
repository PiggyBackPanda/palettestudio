import { useState } from 'react';
import { hexToRgb, rgbToHsl } from '../utils/colourMath';

// ─── Format helpers ──────────────────────────────────────────────────────────

function roleName(hex, roles) {
  return roles[hex] || 'color';
}

function roleSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function generateFigmaTokens(colors, roles) {
  const brand = {};
  colors.forEach((hex) => {
    const name = roleSlug(roleName(hex, roles));
    brand[name] = { value: hex, type: 'color' };
  });
  return JSON.stringify({ brand }, null, 2);
}

function generateWebflowCSS(colors, roles) {
  const vars = colors
    .map((hex) => `  --brand-${roleSlug(roleName(hex, roles))}: ${hex};`)
    .join('\n');
  return [
    '/* Paste into Webflow → Site Settings → Custom Code → Head */',
    '<style>',
    ':root {',
    vars,
    '}',
    '</style>',
  ].join('\n');
}

function generateCanvaList(colors, roles) {
  const maxLen = Math.max(
    ...colors.map((hex) => roleName(hex, roles).length),
  );
  const lines = colors.map((hex) => {
    const name = roleName(hex, roles);
    return `${name}:${' '.repeat(maxLen - name.length + 1)}${hex}`;
  });
  return [
    'Brand Colours for Canva',
    '\u2500'.repeat(23),
    ...lines,
  ].join('\n');
}

// ─── Card data ───────────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: 'figma',
    icon: '\uD83C\uDFA8',
    name: 'Figma',
    description: 'Import your palette as design tokens via the Tokens Studio plugin.',
    generate: generateFigmaTokens,
    steps: [
      'Install "Tokens Studio" plugin in Figma.',
      'Click "Copy for Figma" below.',
      'In the plugin, go to JSON \u2192 paste.',
      'Apply tokens to your frames.',
    ],
  },
  {
    id: 'webflow',
    icon: '\uD83C\uDF10',
    name: 'Webflow',
    description: 'Add CSS custom properties to your Webflow project\u2019s custom code.',
    generate: generateWebflowCSS,
    steps: [
      'Click "Copy for Webflow".',
      'Go to Site Settings \u2192 Custom Code \u2192 Head Code.',
      'Paste the style block.',
      'Use var(--brand-hero) in your custom CSS.',
    ],
  },
  {
    id: 'canva',
    icon: '\uD83D\uDDBC',
    name: 'Canva',
    description: 'Add each colour to your Canva Brand Kit.',
    generate: generateCanvaList,
    steps: [
      'Click "Copy for Canva".',
      'Open Canva \u2192 Brand Kit \u2192 Brand Colors.',
      'Click "+ Add new color" for each.',
      'Paste the hex code.',
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PlatformExportSection({ colors, roles }) {
  const [copied, setCopied] = useState('');

  function handleCopy(platformId, text) {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(platformId);
        setTimeout(() => setCopied(''), 2000);
      },
    ).catch(() => {
      setCopied(platformId + '-error');
      setTimeout(() => setCopied(''), 2000);
    });
  }

  function buttonLabel(platformId, name) {
    if (copied === platformId) return 'Copied!';
    if (copied === platformId + '-error') return 'Failed!';
    return `Copy for ${name}`;
  }

  return (
    <div style={styles.grid}>
      {PLATFORMS.map((platform) => (
        <div className="card" key={platform.id} style={styles.card}>
          <h3 style={styles.heading}>
            <span style={styles.icon}>{platform.icon}</span> {platform.name}
          </h3>

          <p style={styles.description}>{platform.description}</p>

          <button
            style={styles.button}
            onClick={() =>
              handleCopy(platform.id, platform.generate(colors, roles))
            }
          >
            {buttonLabel(platform.id, platform.name)}
          </button>

          <ol style={styles.steps}>
            {platform.steps.map((step, i) => (
              <li key={i} style={styles.step}>{step}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

// ─── Inline styles (using CSS custom properties) ─────────────────────────────

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    fontFamily: 'var(--ps-font-ui)',
    background: 'var(--ps-bg-surface)',
    border: '1px solid var(--ps-border)',
    borderRadius: 'var(--ps-radius-lg)',
    boxShadow: 'var(--ps-shadow-sm)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  heading: {
    margin: 0,
    fontSize: '1.15rem',
    fontFamily: 'var(--ps-font-ui)',
  },
  icon: {
    fontSize: '1.25rem',
  },
  description: {
    margin: 0,
    fontSize: '0.9rem',
    opacity: 0.8,
    fontFamily: 'var(--ps-font-ui)',
  },
  button: {
    alignSelf: 'flex-start',
    padding: '0.5rem 1rem',
    background: 'var(--ps-accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--ps-radius-lg)',
    cursor: 'pointer',
    fontFamily: 'var(--ps-font-ui)',
    fontSize: '0.9rem',
  },
  steps: {
    margin: 0,
    paddingLeft: '1.25rem',
    fontSize: '0.85rem',
    fontFamily: 'var(--ps-font-ui)',
  },
  step: {
    marginBottom: '0.3rem',
  },
};
