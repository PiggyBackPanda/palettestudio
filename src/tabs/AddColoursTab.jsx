import { useState } from 'react';
import { textOn } from '../utils/colourMath';
import { PRESETS } from '../data/presets';

// Semantic badge colours for suggestion categories — not app tokens
const BADGE_COL = {
  Background:    '#6b7280',
  'Text colour': '#18181B',
  'CTA / Button': '#4F46E5',
  Supporting:    '#2563EB',
  Accent:        '#0891b2',
  'Hover / Card': '#7c3aed',
};

export default function AddColoursTab({ suggestions, colors, onAdd, onLoadPreset }) {
  const [activePreset, setActivePreset] = useState(null);

  const handleLoadPreset = (preset, index) => {
    setActivePreset(index);
    onLoadPreset(preset);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Presets section ──────────────────────────────────────────── */}
      <div className="card">
        <div
          style={{
            fontFamily:   'var(--ps-font-ui)',
            fontSize:     'var(--ps-text-xs)',
            fontWeight:   700,
            color:        'var(--ps-text-tertiary)',
            letterSpacing: '.08em',
            marginBottom:  12,
          }}
        >
          START FROM A PRESET
        </div>

        <div
          style={{
            display:         'flex',
            gap:             10,
            overflowX:       'auto',
            paddingBottom:   6,
            scrollbarWidth:  'thin',
          }}
        >
          {PRESETS.map((preset, i) => {
            const isActive = activePreset === i;
            return (
              <button
                key={i}
                onClick={() => handleLoadPreset(preset, i)}
                title={`Load ${preset.name}`}
                style={{
                  width:         140,
                  minWidth:      140,
                  border:        isActive ? '2px solid var(--ps-accent)' : '1px solid var(--ps-border)',
                  borderRadius:  'var(--ps-radius-lg)',
                  overflow:      'hidden',
                  background:    isActive ? 'var(--ps-accent-subtle)' : 'var(--ps-bg-surface)',
                  cursor:        'pointer',
                  padding:       0,
                  textAlign:     'left',
                  boxShadow:     'var(--ps-shadow-sm)',
                  transition:    'box-shadow .15s, transform .15s',
                  flexShrink:    0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = 'var(--ps-shadow-md)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--ps-shadow-sm)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Mini colour strip */}
                <div style={{ display: 'flex', height: 20 }}>
                  {preset.colors.map((hex, j) => (
                    <div
                      key={j}
                      style={{
                        flex:       1,
                        background: hex,
                      }}
                    />
                  ))}
                </div>

                {/* Card body */}
                <div style={{ padding: '10px 12px' }}>
                  <div
                    style={{
                      fontFamily:   'var(--ps-font-ui)',
                      fontSize:     'var(--ps-text-sm)',
                      fontWeight:   600,
                      color:        'var(--ps-text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {preset.name}
                  </div>
                  <div
                    style={{
                      fontFamily:  'var(--ps-font-ui)',
                      fontSize:    'var(--ps-text-xs)',
                      color:       'var(--ps-text-tertiary)',
                      lineHeight:  1.4,
                      overflow:    'hidden',
                      display:     '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {preset.personality}
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding:    '0 12px 10px',
                    fontFamily: 'var(--ps-font-ui)',
                    fontSize:   'var(--ps-text-xs)',
                    color:      'var(--ps-accent)',
                  }}
                >
                  Use this palette →
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Suggestions section ───────────────────────────────────────── */}
      {suggestions.length === 0 ? (
        <div
          className="card"
          style={{
            fontFamily: 'var(--ps-font-ui)',
            color:      'var(--ps-text-tertiary)',
            textAlign:  'center',
            padding:    '30px 0',
          }}
        >
          Add at least one colour to generate suggestions.
        </div>
      ) : (
        <div className="card">
          <div
            style={{
              fontFamily:   'var(--ps-font-ui)',
              fontSize:     'var(--ps-text-sm)',
              color:        'var(--ps-text-secondary)',
              marginBottom: 16,
              lineHeight:   1.5,
            }}
          >
            Harmony-based suggestions derived from your most saturated colour.
            All relationships use the colour wheel — not just random picks.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {suggestions.map((s, i) => {
              const alreadyAdded = colors.includes(s.hex);
              const txtCol       = textOn(s.hex);
              const badgeCol     = BADGE_COL[s.badge] || 'var(--ps-text-secondary)';

              return (
                <div
                  key={i}
                  style={{
                    border:       '1px solid var(--ps-border)',
                    borderRadius: 'var(--ps-radius-lg)',
                    overflow:     'hidden',
                    background:   'var(--ps-bg-surface)',
                    boxShadow:    'var(--ps-shadow-sm)',
                  }}
                >
                  {/* Colour block */}
                  <div
                    style={{
                      background: s.hex,
                      height:     80,
                      display:    'flex',
                      flexDirection: 'column',
                      alignItems:  'flex-start',
                      justifyContent: 'flex-end',
                      padding:    '8px 10px',
                      position:   'relative',
                    }}
                  >
                    <span
                      style={{
                        background:    badgeCol,
                        color:         '#fff',
                        fontFamily:    'var(--ps-font-ui)',
                        fontSize:      8,
                        fontWeight:    700,
                        letterSpacing: '.07em',
                        padding:       '2px 7px',
                        borderRadius:  'var(--ps-radius-sm)',
                        position:      'absolute',
                        top:           8,
                        left:          8,
                      }}
                    >
                      {s.badge.toUpperCase()}
                    </span>
                    <div
                      style={{
                        fontFamily: 'var(--ps-font-mono)',
                        color:      txtCol,
                        fontSize:   10,
                        fontWeight: 500,
                      }}
                    >
                      {s.hex.toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--ps-font-ui)',
                        color:      txtCol,
                        fontSize:   9,
                        opacity:    0.7,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '10px 12px' }}>
                    <p
                      style={{
                        fontFamily:   'var(--ps-font-ui)',
                        fontSize:     'var(--ps-text-xs)',
                        color:        'var(--ps-text-secondary)',
                        lineHeight:   1.5,
                        margin:       '0 0 10px',
                      }}
                    >
                      {s.reason}
                    </p>
                    <button
                      disabled={alreadyAdded || colors.length >= 8}
                      onClick={() => onAdd(s.hex)}
                      style={{
                        background:    alreadyAdded ? 'var(--ps-border)' : 'var(--ps-accent)',
                        color:         alreadyAdded ? 'var(--ps-text-tertiary)' : 'var(--ps-accent-text)',
                        border:        'none',
                        borderRadius:  'var(--ps-radius-md)',
                        padding:       '6px 14px',
                        fontFamily:    'var(--ps-font-ui)',
                        fontSize:      'var(--ps-text-xs)',
                        fontWeight:    500,
                        cursor:        alreadyAdded || colors.length >= 8 ? 'default' : 'pointer',
                        letterSpacing: '.02em',
                        width:         '100%',
                        transition:    'background .15s',
                      }}
                      onMouseEnter={e => { if (!alreadyAdded && colors.length < 8) e.currentTarget.style.background = 'var(--ps-accent-hover)'; }}
                      onMouseLeave={e => { if (!alreadyAdded && colors.length < 8) e.currentTarget.style.background = 'var(--ps-accent)'; }}
                    >
                      {alreadyAdded ? 'Already added' : colors.length >= 8 ? 'Palette full' : `+ Add ${s.hex.toUpperCase()}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
