import { useState } from 'react';
import { textOn } from '../utils/colourMath';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function roleName(hex, roles, index) {
  return roles[hex] || `Color ${index + 1}`;
}

function buildCss(colors, roles, scales) {
  const lines = [':root {'];
  colors.forEach((hex, i) => {
    const name = slugify(roleName(hex, roles, i));
    const steps = scales[hex];
    if (!steps) return;
    steps.forEach(s => {
      lines.push(`  --${name}-${s.step}: ${s.hex};`);
    });
  });
  lines.push('}');
  return lines.join('\n');
}

function buildTailwind(colors, roles, scales) {
  const colorsObj = {};
  colors.forEach((hex, i) => {
    const name = slugify(roleName(hex, roles, i));
    const steps = scales[hex];
    if (!steps) return;
    const map = {};
    steps.forEach(s => { map[s.step] = s.hex; });
    colorsObj[name] = map;
  });

  const inner = Object.entries(colorsObj)
    .map(([name, map]) => {
      const entries = Object.entries(map)
        .map(([step, hex]) => `        ${step}: '${hex}'`)
        .join(',\n');
      return `      ${name}: {\n${entries}\n      }`;
    })
    .join(',\n');

  return [
    'module.exports = {',
    '  theme: {',
    '    extend: {',
    '      colors: {',
    inner,
    '      }',
    '    }',
    '  }',
    '}',
  ].join('\n');
}

export default function ColourScalesTab({ colors, roles, scales }) {
  const [copied, setCopied] = useState('');

  function copyText(text, key) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Copy buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => copyText(buildCss(colors, roles, scales), 'css')}
          style={{
            fontFamily:    'var(--ps-font-ui)',
            fontSize:      'var(--ps-text-sm)',
            fontWeight:    600,
            padding:       '8px 16px',
            borderRadius:  'var(--ps-radius-md)',
            border:        '1px solid var(--ps-border)',
            background:    copied === 'css' ? 'var(--ps-accent)' : 'var(--ps-bg-surface)',
            color:         copied === 'css' ? '#fff' : 'var(--ps-text-primary)',
            cursor:        'pointer',
            transition:    'background .2s, color .2s',
          }}
        >
          {copied === 'css' ? 'Copied!' : 'Copy all as CSS'}
        </button>
        <button
          onClick={() => copyText(buildTailwind(colors, roles, scales), 'tw')}
          style={{
            fontFamily:    'var(--ps-font-ui)',
            fontSize:      'var(--ps-text-sm)',
            fontWeight:    600,
            padding:       '8px 16px',
            borderRadius:  'var(--ps-radius-md)',
            border:        '1px solid var(--ps-border)',
            background:    copied === 'tw' ? 'var(--ps-accent)' : 'var(--ps-bg-surface)',
            color:         copied === 'tw' ? '#fff' : 'var(--ps-text-primary)',
            cursor:        'pointer',
            transition:    'background .2s, color .2s',
          }}
        >
          {copied === 'tw' ? 'Copied!' : 'Copy as Tailwind'}
        </button>
      </div>

      {/* Intro card */}
      <div
        style={{
          fontFamily:    'var(--ps-font-ui)',
          fontSize:      'var(--ps-text-sm)',
          color:         'var(--ps-text-secondary)',
          background:    'var(--ps-bg-surface)',
          border:        '1px solid var(--ps-border)',
          borderRadius:  'var(--ps-radius-lg)',
          padding:       '14px 18px',
          boxShadow:     'var(--ps-shadow-sm)',
        }}
      >
        A tint/shade ramp for each colour in your palette.
      </div>

      {/* Scale cards */}
      {colors.map((hex, i) => {
        const steps = scales[hex];
        if (!steps || steps.length === 0) return null;
        const name = roleName(hex, roles, i);

        return (
          <div
            key={hex}
            style={{
              background:    'var(--ps-bg-surface)',
              border:        '1px solid var(--ps-border)',
              borderRadius:  'var(--ps-radius-lg)',
              padding:       18,
              boxShadow:     'var(--ps-shadow-sm)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width:        20,
                  height:       20,
                  borderRadius: 'var(--ps-radius-md)',
                  background:   hex,
                  border:       '1px solid rgba(0,0,0,.1)',
                  flexShrink:   0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--ps-font-ui)',
                  fontSize:   'var(--ps-text-sm)',
                  fontWeight: 700,
                  color:      'var(--ps-text-primary)',
                }}
              >
                {name}
              </span>
              <span
                style={{
                  fontFamily: 'var(--ps-font-mono)',
                  fontSize:   'var(--ps-text-sm)',
                  color:      'var(--ps-text-tertiary)',
                }}
              >
                {hex}
              </span>
            </div>

            {/* Scale strip */}
            <div
              style={{
                display:   'flex',
                gap:       0,
                overflowX: 'auto',
              }}
            >
              {steps.map(s => (
                <div
                  key={s.step}
                  style={{
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    flex:           '1 1 0',
                    minWidth:       52,
                  }}
                >
                  <div
                    style={{
                      width:        '100%',
                      height:       48,
                      background:   s.hex,
                      borderRadius: 'var(--ps-radius-md)',
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent: 'center',
                      outline:      s.isBase ? `2px solid var(--ps-accent)` : 'none',
                      outlineOffset: s.isBase ? 2 : 0,
                      position:     'relative',
                    }}
                  >
                    {s.isBase && (
                      <span
                        style={{
                          position:     'absolute',
                          top:          -8,
                          fontFamily:   'var(--ps-font-ui)',
                          fontSize:     9,
                          fontWeight:   700,
                          color:        'var(--ps-accent)',
                          letterSpacing: '.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        base
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--ps-font-ui)',
                      fontSize:   10,
                      fontWeight: 600,
                      color:      'var(--ps-text-secondary)',
                      marginTop:  4,
                    }}
                  >
                    {s.step}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--ps-font-mono)',
                      fontSize:   9,
                      color:      'var(--ps-text-tertiary)',
                      marginTop:  1,
                    }}
                  >
                    {s.hex}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
