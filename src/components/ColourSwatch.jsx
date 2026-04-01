import { useState } from 'react';
import { hexToRgb, rgbToHsl, textOn } from '../utils/colourMath';
import { ROLE_COL } from '../utils/autoRoles';
import { getColourName } from '../utils/colourNames';

const eyedropperSupported = 'EyeDropper' in window;

function EyedropperIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <circle cx="3" cy="13" r="2" fill="currentColor" />
      <path d="M5.5 10.5L12 4a2 2 0 0 1 2.83 2.83L8.33 13 5.5 10.5z" fill="currentColor" />
      <path d="M5.5 10.5L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ColourSwatch({
  hex, role, onUpdate, onRemove, index,
  isScaleOpen, onToggleScale,
}) {
  const [hovered, setHovered] = useState(false);

  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const textColor   = textOn(hex);

  const tier =
    s > 85 ? 'Vivid Accent' :
    s > 50 ? 'Mid-tone Brand' :
    s > 15 ? 'Muted/Pastel' :
             'Surface Neutral';

  const handleEyedrop = async () => {
    try {
      const dropper = new window.EyeDropper();
      const result  = await dropper.open();
      onUpdate(index, result.sRGBHex);
    } catch {
      // User cancelled — do nothing
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 120 }}>

      {/* ── Main swatch card ──────────────────────────────── */}
      <div
        className="sw"
        style={{
          background:   hex,
          color:        textColor,
          borderBottom: isScaleOpen ? '2.5px solid var(--ps-accent)' : undefined,
          borderRadius: isScaleOpen ? 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' : undefined,
        }}
      >
        {/* Invisible colour picker overlay */}
        <input
          type="color"
          value={hex}
          onChange={e => onUpdate(index, e.target.value)}
          title="Click to edit colour"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer',
            border: 'none', padding: 0,
            zIndex: 1,
          }}
        />

        {/* Remove button */}
        <button
          className="rm"
          onClick={e => { e.stopPropagation(); onRemove(index); }}
          title="Remove colour"
          style={{ zIndex: 3 }}
        >
          ×
        </button>

        {/* EyeDropper button — only in supported browsers, only on hover */}
        {eyedropperSupported && hovered && (
          <button
            onClick={e => { e.stopPropagation(); handleEyedrop(); }}
            title="Pick colour from screen"
            style={{
              position:       'absolute',
              bottom:         6,
              right:          6,
              zIndex:         3,
              background:     'rgba(0,0,0,0.28)',
              border:         'none',
              borderRadius:   'var(--ps-radius-sm)',
              width:          22,
              height:         22,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              cursor:         'pointer',
              color:          '#fff',
              padding:        0,
              transition:     'background .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--ps-accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.28)'; }}
          >
            <EyedropperIcon />
          </button>
        )}

        {/* Hex value — monospace, it's technical data */}
        <div className="hx">{hex.toUpperCase()}</div>

        {/* Colour name — nearest named match */}
        <div
          style={{
            fontFamily:   'var(--ps-font-ui)',
            fontSize:     'var(--ps-text-sm)',
            color:        textColor,
            opacity:      0.65,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            maxWidth:     90,
            lineHeight:   1.2,
            marginBottom: 1,
          }}
        >
          {getColourName(hex)}
        </div>

        {/* HSL values — monospace */}
        <div className="lbl" style={{ opacity: 0.75, fontSize: 10 }}>
          {Math.round(h)}° {Math.round(s)}% {Math.round(l)}%
        </div>

        {/* Role badge */}
        {role && (
          <div
            style={{
              position:      'absolute',
              bottom:        6,
              left:          '50%',
              transform:     'translateX(-50%)',
              background:    ROLE_COL[role] || '#888',
              color:         '#fff',
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      8,
              fontWeight:    700,
              letterSpacing: '.08em',
              padding:       '1px 6px',
              borderRadius:  'var(--ps-radius-sm)',
              whiteSpace:    'nowrap',
            }}
          >
            {role.toUpperCase()}
          </div>
        )}

        {/* Tier badge */}
        <div
          style={{
            position:      'absolute',
            top:           6,
            left:          6,
            background:    'rgba(0,0,0,0.22)',
            color:         '#fff',
            fontFamily:    'var(--ps-font-ui)',
            fontSize:      9,
            padding:       '1px 5px',
            borderRadius:  'var(--ps-radius-sm)',
            letterSpacing: '.05em',
          }}
        >
          {tier}
        </div>
      </div>

      {/* ── Scale toggle button ────────────────────────────── */}
      <button
        onClick={onToggleScale}
        title={isScaleOpen ? 'Hide tint & shade scale' : 'Show tint & shade scale'}
        style={{
          background:    isScaleOpen ? 'var(--ps-accent-subtle)' : 'var(--ps-bg-subtle)',
          border:        '1px solid var(--ps-border)',
          borderTop:     isScaleOpen ? '1px solid var(--ps-accent)' : '1px solid var(--ps-border)',
          borderRadius:  isScaleOpen ? '0 0 var(--ps-radius-md) var(--ps-radius-md)' : 'var(--ps-radius-md)',
          padding:       '5px 0',
          minHeight:     28,
          cursor:        'pointer',
          fontFamily:    'var(--ps-font-ui)',
          fontSize:      10,
          fontWeight:    600,
          color:         isScaleOpen ? 'var(--ps-accent)' : 'var(--ps-text-secondary)',
          letterSpacing: '.04em',
          textAlign:     'center',
          width:         '100%',
          transition:    'background .15s, color .15s',
        }}
      >
        {isScaleOpen ? '▲ Hide scale' : '▾ Tints & shades'}
      </button>
    </div>
  );
}
