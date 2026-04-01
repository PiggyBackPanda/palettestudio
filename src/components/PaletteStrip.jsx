import { useState } from 'react';
import ColourSwatch from './ColourSwatch';
import { textOn } from '../utils/colourMath';

// ─── Scale panel ──────────────────────────────────────────────────────────────

function ScalePanel({ hex, scale, role, index }) {
  const [copiedStep, setCopiedStep] = useState(null);
  const [copiedAll,  setCopiedAll]  = useState(false);

  const varBase = role
    ? `--color-${role.toLowerCase()}`
    : `--color-${index + 1}`;

  const handleCopyChip = async (stepHex, step) => {
    try {
      await navigator.clipboard.writeText(stepHex);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = stepHex;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 1400);
  };

  const handleCopyAll = async () => {
    const css = scale
      .map(s => `  ${varBase}-${s.step}: ${s.hex.toLowerCase()};`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(css);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = css;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div
      style={{
        background:   'var(--ps-bg-overlay)',
        border:       '1px solid var(--ps-border)',
        borderTop:    '2px solid var(--ps-accent)',
        borderRadius: '0 0 var(--ps-radius-lg) var(--ps-radius-lg)',
        padding:      '12px 14px 14px',
        marginTop:    0,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          8,
          marginBottom: 12,
          flexWrap:     'wrap',
        }}
      >
        <div
          style={{
            width:        14,
            height:       14,
            borderRadius: 'var(--ps-radius-sm)',
            background:   hex,
            border:       '1px solid rgba(0,0,0,.1)',
            flexShrink:   0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-xs)',
            fontWeight: 600,
            color:      'var(--ps-text-primary)',
          }}
        >
          Tint &amp; shade scale — {hex.toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: 'var(--ps-font-mono)',
            fontSize:   9,
            color:      'var(--ps-text-tertiary)',
            marginLeft: 'auto',
          }}
        >
          {varBase}-100 → {varBase}-900
        </span>
      </div>

      {/* Step chips row */}
      <div
        style={{
          display:       'flex',
          gap:           8,
          alignItems:    'flex-start',
          overflowX:     'auto',
          paddingBottom: 4,
        }}
      >
        {scale.map(s => {
          const chipText = textOn(s.hex);
          const isCopied = copiedStep === s.step;

          return (
            <div
              key={s.step}
              style={{
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                gap:           3,
                flexShrink:    0,
                width:         36,
              }}
            >
              {/* Base indicator dot — marks the step closest to original */}
              <div style={{ height: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.isBase && (
                  <div
                    style={{
                      width:        5,
                      height:       5,
                      borderRadius: '50%',
                      background:   'var(--ps-accent)',
                    }}
                    title="Closest to original colour"
                  />
                )}
              </div>

              {/* Colour chip */}
              <div
                title={`L:${s.l.toFixed(3)}  C:${s.c.toFixed(3)}  H:${s.h.toFixed(1)}°\nClick to copy hex`}
                onClick={() => handleCopyChip(s.hex, s.step)}
                style={{
                  width:         32,
                  height:        32,
                  background:    s.hex,
                  borderRadius:  'var(--ps-radius-sm)',
                  cursor:        'pointer',
                  border:        '1px solid rgba(0,0,0,.08)',
                  outline:       s.isBase ? '2px solid var(--ps-accent)' : 'none',
                  outlineOffset: 2,
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent: 'center',
                  flexShrink:    0,
                  transition:    'transform .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isCopied && (
                  <span style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 10, color: chipText, fontWeight: 700 }}>✓</span>
                )}
              </div>

              {/* Step number — monospace, technical */}
              <div
                style={{
                  fontFamily:    'var(--ps-font-mono)',
                  fontSize:      7,
                  color:         'var(--ps-text-secondary)',
                  letterSpacing: '.03em',
                }}
              >
                {s.step}
              </div>

              {/* Hex value — monospace, technical */}
              <div
                style={{
                  fontFamily:    'var(--ps-font-mono)',
                  fontSize:      7,
                  color:         'var(--ps-text-tertiary)',
                  letterSpacing: '-.01em',
                }}
              >
                {s.hex.toUpperCase().slice(1)}
              </div>
            </div>
          );
        })}

        {/* Copy-all button */}
        <div
          style={{
            flexShrink:  0,
            display:     'flex',
            alignItems:  'center',
            paddingLeft: 6,
            paddingTop:  14,
          }}
        >
          <button
            onClick={handleCopyAll}
            style={{
              background:    copiedAll ? 'var(--ps-success)' : 'var(--ps-bg-surface)',
              color:         copiedAll ? '#fff' : 'var(--ps-accent)',
              border:        `1px solid ${copiedAll ? 'var(--ps-success)' : 'var(--ps-accent)'}`,
              borderRadius:  'var(--ps-radius-md)',
              padding:       '5px 10px',
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      'var(--ps-text-xs)',
              fontWeight:    600,
              cursor:        'pointer',
              letterSpacing: '.04em',
              whiteSpace:    'nowrap',
              transition:    'background .15s, color .15s, border-color .15s',
            }}
          >
            {copiedAll ? '✓ Copied!' : 'Copy CSS'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Surprise me button ───────────────────────────────────────────────────────

function SurpriseBtn({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title="Generate a random harmonious palette"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           6,
        background:    'var(--ps-bg-surface)',
        color:         hovered ? 'var(--ps-accent)' : 'var(--ps-text-secondary)',
        border:        hovered ? '1px solid var(--ps-accent)' : '1px solid var(--ps-border)',
        borderRadius:  'var(--ps-radius-md)',
        padding:       '7px 14px',
        fontFamily:    'var(--ps-font-ui)',
        fontSize:      'var(--ps-text-sm)',
        fontWeight:    500,
        cursor:        'pointer',
        transition:    'border-color .15s, color .15s',
        flexShrink:    0,
      }}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M13.5 2.5A7 7 0 1 0 15 8h-1.5A5.5 5.5 0 1 1 12 4.1V2.5h-2V1h4v4h-1.5V3.2z"/>
      </svg>
      Surprise me
    </button>
  );
}

// ─── Palette strip ────────────────────────────────────────────────────────────

export default function PaletteStrip({
  colors, roles, scales,
  onUpdate, onRemove, onAdd,
  picker, onPickerChange,
  warnCount, onGenerateRandom,
}) {
  const [openScaleIdx, setOpenScaleIdx] = useState(null);

  const handleToggleScale = idx => {
    setOpenScaleIdx(prev => (prev === idx ? null : idx));
  };

  const handleRemove = idx => {
    if (openScaleIdx === idx) setOpenScaleIdx(null);
    else if (openScaleIdx !== null && openScaleIdx > idx) setOpenScaleIdx(openScaleIdx - 1);
    onRemove(idx);
  };

  return (
    <div style={{ marginBottom: 20 }}>

      {/* ── Section label + surprise button ────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-md)', fontWeight: 600, color: 'var(--ps-text-primary)' }}>
            Step 2 — Your Colours
          </div>
          <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-secondary)', marginTop: 2 }}>
            Add, remove, or click any swatch to edit its colour.
          </div>
        </div>
        <SurpriseBtn onClick={onGenerateRandom} />
      </div>

      {/* ── Swatch row ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>

        {colors.map((hex, i) => (
          <ColourSwatch
            key={hex + i}
            hex={hex}
            role={roles[hex]}
            index={i}
            onUpdate={onUpdate}
            onRemove={handleRemove}
            isScaleOpen={openScaleIdx === i}
            onToggleScale={() => handleToggleScale(i)}
          />
        ))}

        {/* Add colour slot */}
        {colors.length < 8 && (
          <div
            className="sw"
            style={{
              background: 'var(--ps-bg-subtle)',
              border:     '1.5px dashed var(--ps-border-strong)',
              cursor:     'default',
            }}
          >
            <input
              type="color"
              value={picker}
              onChange={e => onPickerChange(e.target.value)}
              title="Pick a colour to add"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                opacity: 0, cursor: 'pointer',
              }}
            />
            <div
              style={{
                fontSize:      22,
                color:         'var(--ps-text-tertiary)',
                lineHeight:    1,
                pointerEvents: 'none',
              }}
            >
              +
            </div>
            <button className="addbtn" onClick={() => onAdd(picker)}>
              Add {picker.toUpperCase()}
            </button>
          </div>
        )}
      </div>

      {/* ── Expanded scale panel ─────────────────────────────────────────── */}
      {openScaleIdx !== null && scales && scales[colors[openScaleIdx]] && (
        <ScalePanel
          key={openScaleIdx}
          hex={colors[openScaleIdx]}
          scale={scales[colors[openScaleIdx]]}
          role={roles[colors[openScaleIdx]] || null}
          index={openScaleIdx}
        />
      )}

      {/* ── Summary line ────────────────────────────────────────────────── */}
      <div
        style={{
          fontFamily: 'var(--ps-font-ui)',
          fontSize:   'var(--ps-text-xs)',
          color:      'var(--ps-text-tertiary)',
          marginTop:  8,
        }}
      >
        {colors.length} colour{colors.length !== 1 ? 's' : ''}{' '}
        {warnCount > 0 && (
          <span style={{ color: 'var(--ps-warning)', fontWeight: 600 }}>
            · {warnCount} issue{warnCount !== 1 ? 's' : ''} detected
          </span>
        )}
        {warnCount === 0 && colors.length >= 2 && (
          <span style={{ color: 'var(--ps-success)', fontWeight: 600 }}>· No major issues</span>
        )}
      </div>
    </div>
  );
}
