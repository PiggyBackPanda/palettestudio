import { useState } from 'react';
import { FONT_PAIRS } from '../constants';

// ─── Role-to-semantic mapping ────────────────────────────────────────────────
const SEMANTIC_MAP = {
  Hero:       'hero',
  Accent:     'accent',
  Neutral:    'neutral',
  Background: 'background',
  Text:       'text',
};

const FORMATS = [
  { key: 'css',     label: 'CSS Custom Properties' },
  { key: 'tailwind', label: 'Tailwind Config' },
  { key: 'json',    label: 'JSON Tokens' },
  { key: 'figma',   label: 'Figma Tokens' },
];

// ─── Token generators ────────────────────────────────────────────────────────

function getFontPair(selectedFont) {
  if (selectedFont) return selectedFont;
  return FONT_PAIRS[0];
}

function buildPrimitives(colors, roles) {
  const entries = [];
  colors.forEach((hex, i) => {
    const role = roles[hex];
    const name = role ? SEMANTIC_MAP[role] || role.toLowerCase() : `color-${i + 1}`;
    entries.push({ name: `brand-${name}`, value: hex.toLowerCase() });
  });
  return entries;
}

function buildSemanticTokens(roles) {
  const tokens = [];
  const roleHex = {};
  Object.entries(roles).forEach(([hex, role]) => {
    roleHex[role] = hex;
  });

  if (roleHex.Accent) {
    tokens.push({ name: 'color-action-primary', ref: 'brand-accent' });
  }
  if (roleHex.Background) {
    tokens.push({ name: 'color-surface', ref: 'brand-background' });
  }
  if (roleHex.Text) {
    tokens.push({ name: 'color-text-primary', ref: 'brand-text' });
  }
  if (roleHex.Neutral) {
    tokens.push({ name: 'color-border', ref: 'brand-neutral' });
  }
  if (roleHex.Hero) {
    tokens.push({ name: 'color-hero', ref: 'brand-hero' });
  }
  return tokens;
}

function buildComponentTokens(semanticTokens) {
  const map = {};
  semanticTokens.forEach(t => { map[t.name] = true; });
  const tokens = [];
  if (map['color-action-primary']) {
    tokens.push({ name: 'button-primary-bg', ref: 'color-action-primary' });
    tokens.push({ name: 'button-primary-text', ref: 'color-surface' });
  }
  if (map['color-surface']) {
    tokens.push({ name: 'card-bg', ref: 'color-surface' });
  }
  if (map['color-text-primary']) {
    tokens.push({ name: 'card-text', ref: 'color-text-primary' });
  }
  if (map['color-border']) {
    tokens.push({ name: 'card-border', ref: 'color-border' });
    tokens.push({ name: 'input-border', ref: 'color-border' });
  }
  if (map['color-hero']) {
    tokens.push({ name: 'header-bg', ref: 'color-hero' });
  }
  return tokens;
}

// ─── CSS format ──────────────────────────────────────────────────────────────

function generateCSS(colors, roles, fontPair) {
  const primitives = buildPrimitives(colors, roles);
  const semantic   = buildSemanticTokens(roles);
  const component  = buildComponentTokens(semantic);

  const lines = [];
  lines.push('/* ── Primitive Tokens ── */');
  lines.push(':root {');
  primitives.forEach(t => {
    lines.push(`  --${t.name}: ${t.value};`);
  });
  lines.push('');
  lines.push('  /* Typography */');
  lines.push(`  --font-heading: ${fontPair.heading};`);
  lines.push(`  --font-body: ${fontPair.body};`);
  lines.push('}');
  lines.push('');

  if (semantic.length > 0) {
    lines.push('/* ── Semantic Tokens ── */');
    lines.push(':root {');
    semantic.forEach(t => {
      lines.push(`  --${t.name}: var(--${t.ref});`);
    });
    lines.push('}');
    lines.push('');
  }

  if (component.length > 0) {
    lines.push('/* ── Component Tokens ── */');
    lines.push(':root {');
    component.forEach(t => {
      lines.push(`  --${t.name}: var(--${t.ref});`);
    });
    lines.push('}');
  }

  return lines.join('\n');
}

// ─── Tailwind format ─────────────────────────────────────────────────────────

function generateTailwind(colors, roles, fontPair) {
  const primitives = buildPrimitives(colors, roles);
  const semantic   = buildSemanticTokens(roles);

  const lines = [];
  lines.push('// Palette Studio — Tailwind Config Tokens');
  lines.push('module.exports = {');
  lines.push('  theme: {');
  lines.push('    extend: {');
  lines.push('      colors: {');
  lines.push('        // Primitive tokens');
  primitives.forEach(t => {
    lines.push(`        '${t.name}': '${t.value}',`);
  });
  if (semantic.length > 0) {
    lines.push('        // Semantic tokens');
    semantic.forEach(t => {
      const prim = primitives.find(p => p.name === t.ref);
      const val  = prim ? prim.value : `var(--${t.ref})`;
      lines.push(`        '${t.name}': '${val}',`);
    });
  }
  lines.push('      },');
  lines.push('      fontFamily: {');
  lines.push(`        heading: [${fontPair.heading.split(',').map(s => `'${s.trim().replace(/'/g, '')}'`).join(', ')}],`);
  lines.push(`        body: [${fontPair.body.split(',').map(s => `'${s.trim().replace(/'/g, '')}'`).join(', ')}],`);
  lines.push('      },');
  lines.push('    },');
  lines.push('  },');
  lines.push('};');
  return lines.join('\n');
}

// ─── JSON format ─────────────────────────────────────────────────────────────

function generateJSON(colors, roles, fontPair) {
  const primitives = buildPrimitives(colors, roles);
  const semantic   = buildSemanticTokens(roles);
  const component  = buildComponentTokens(semantic);

  const obj = {
    primitive: {},
    semantic: {},
    component: {},
    typography: {
      'font-heading': fontPair.heading,
      'font-body': fontPair.body,
    },
  };

  primitives.forEach(t => { obj.primitive[t.name] = t.value; });
  semantic.forEach(t  => { obj.semantic[t.name] = `{${t.ref}}`; });
  component.forEach(t => { obj.component[t.name] = `{${t.ref}}`; });

  return JSON.stringify(obj, null, 2);
}

// ─── Figma format ────────────────────────────────────────────────────────────

function generateFigma(colors, roles, fontPair) {
  const primitives = buildPrimitives(colors, roles);
  const semantic   = buildSemanticTokens(roles);
  const component  = buildComponentTokens(semantic);

  const obj = {};

  const primGroup = {};
  primitives.forEach(t => {
    primGroup[t.name] = { value: t.value, type: 'color' };
  });
  primGroup['font-heading'] = { value: fontPair.heading, type: 'fontFamily' };
  primGroup['font-body']    = { value: fontPair.body, type: 'fontFamily' };
  obj.primitive = primGroup;

  if (semantic.length > 0) {
    const semGroup = {};
    semantic.forEach(t => {
      semGroup[t.name] = { value: `{primitive.${t.ref}}`, type: 'color' };
    });
    obj.semantic = semGroup;
  }

  if (component.length > 0) {
    const compGroup = {};
    component.forEach(t => {
      compGroup[t.name] = { value: `{semantic.${t.ref}}`, type: 'color' };
    });
    obj.component = compGroup;
  }

  return JSON.stringify(obj, null, 2);
}

// ─── Syntax highlighting (safe React elements) ──────────────────────────────

function highlightLine(line, idx) {
  const spans = [];
  let remaining = line;
  let key = 0;

  function pushPlain(text) {
    if (text) spans.push(<span key={key++}>{text}</span>);
  }

  // Comment lines
  if (/^\s*(\/\/|\/\*)/.test(remaining)) {
    return (
      <span key={idx} style={{ color: 'var(--ps-text-tertiary)' }}>
        {remaining}
      </span>
    );
  }

  const parts = [];
  // Tokenise the line
  const tokenRe = /(--[\w-]+)|(#[0-9A-Fa-f]{3,8})\b|((?:var|module\.exports|:root)\b)/g;
  let match;
  let lastIndex = 0;

  while ((match = tokenRe.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'plain', text: remaining.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      parts.push({ type: 'varname', text: match[1] });
    } else if (match[2]) {
      parts.push({ type: 'hex', text: match[2] });
    } else if (match[3]) {
      parts.push({ type: 'keyword', text: match[3] });
    }
    lastIndex = tokenRe.lastIndex;
  }

  if (lastIndex < remaining.length) {
    parts.push({ type: 'plain', text: remaining.slice(lastIndex) });
  }

  return (
    <span key={idx}>
      {parts.map((p, i) => {
        switch (p.type) {
          case 'varname':
            return <span key={i} style={{ color: 'var(--ps-accent)' }}>{p.text}</span>;
          case 'hex':
            return <span key={i} style={{ color: '#16A34A' }}>{p.text}</span>;
          case 'keyword':
            return <span key={i} style={{ color: '#4F46E5' }}>{p.text}</span>;
          default:
            return <span key={i}>{p.text}</span>;
        }
      })}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ExportTokensTab({ colors, roles, selectedFont }) {
  const [format, setFormat] = useState('css');
  const [copyLabel, setCopyLabel] = useState('Copy');

  const fontPair   = getFontPair(selectedFont);
  const hasRoles   = roles && Object.keys(roles).length > 0;

  const generators = {
    css:     generateCSS,
    tailwind: generateTailwind,
    json:    generateJSON,
    figma:   generateFigma,
  };

  const code = generators[format](colors, roles || {}, fontPair);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy'), 2000);
    }).catch(() => {
      setCopyLabel('Failed!');
      setTimeout(() => setCopyLabel('Copy'), 2000);
    });
  }

  const codeLines = code.split('\n');

  return (
    <div style={{
      fontFamily: 'var(--ps-font-ui)',
      fontSize: 'var(--ps-text-sm)',
      color: 'var(--ps-text-primary)',
    }}>
      {/* Format selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
      }}>
        {FORMATS.map(f => (
          <button
            key={f.key}
            onClick={() => setFormat(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--ps-radius-md)',
              border: format === f.key ? '2px solid var(--ps-accent)' : '1px solid var(--ps-border)',
              background: format === f.key ? 'var(--ps-accent)' : 'var(--ps-bg-surface)',
              color: format === f.key ? '#fff' : 'var(--ps-text-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--ps-font-ui)',
              fontSize: 'var(--ps-text-sm)',
              fontWeight: format === f.key ? 600 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tip banner when no roles */}
      {!hasRoles && (
        <div style={{
          padding: '10px 14px',
          marginBottom: 16,
          borderRadius: 'var(--ps-radius-md)',
          background: 'var(--ps-bg-surface)',
          border: '1px solid var(--ps-border)',
          color: 'var(--ps-text-secondary)',
          fontSize: 'var(--ps-text-sm)',
        }}>
          Tip: Assign roles to your colours in the Roles tab first for richer semantic and component tokens.
        </div>
      )}

      {/* Code block */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--ps-radius-lg)',
        border: '1px solid var(--ps-border)',
        background: 'var(--ps-bg-surface)',
        overflow: 'hidden',
      }}>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: '4px 12px',
            borderRadius: 'var(--ps-radius-md)',
            border: '1px solid var(--ps-border)',
            background: 'var(--ps-bg-surface)',
            color: 'var(--ps-text-secondary)',
            cursor: 'pointer',
            fontFamily: 'var(--ps-font-ui)',
            fontSize: 'var(--ps-text-sm)',
            zIndex: 1,
          }}
        >
          {copyLabel}
        </button>

        <pre style={{
          margin: 0,
          padding: 16,
          overflowX: 'auto',
          fontFamily: 'var(--ps-font-mono)',
          fontSize: 'var(--ps-text-sm)',
          lineHeight: 1.6,
          color: 'var(--ps-text-primary)',
        }}>
          <code>
            {codeLines.map((line, i) => (
              <span key={i}>
                {highlightLine(line, i)}
                {i < codeLines.length - 1 ? '\n' : ''}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
