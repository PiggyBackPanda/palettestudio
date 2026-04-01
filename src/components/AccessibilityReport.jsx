import { useState } from 'react';
import { contrastRatio } from '../utils/colourMath';

// ─── Check icon (CSS circle — not emoji) ─────────────────────────────────────
function CheckIcon({ pass }) {
  return (
    <div
      style={{
        width:          18,
        height:         18,
        borderRadius:   '50%',
        background:     pass ? 'var(--ps-success)' : 'var(--ps-danger)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          '#fff',
        fontSize:       10,
        fontWeight:     700,
        flexShrink:     0,
        lineHeight:     1,
        userSelect:     'none',
      }}
    >
      {pass ? '✓' : '✗'}
    </div>
  );
}

// ─── Individual check row ─────────────────────────────────────────────────────
function CheckRow({ pass, label }) {
  return (
    <div
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         8,
        padding:     '7px 10px',
        background:  pass ? 'var(--ps-success-subtle)' : 'var(--ps-danger-subtle)',
        borderRadius: 'var(--ps-radius-md)',
        border:      `1px solid ${pass ? 'var(--ps-success)' : 'var(--ps-danger)'}`,
        opacity:     0.9,
      }}
    >
      <CheckIcon pass={pass} />
      <span
        style={{
          fontFamily: 'var(--ps-font-ui)',
          fontSize:   'var(--ps-text-sm)',
          color:      pass ? 'var(--ps-success)' : 'var(--ps-danger)',
          fontWeight: 500,
          flex:       1,
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily:    'var(--ps-font-ui)',
          fontSize:      'var(--ps-text-xs)',
          fontWeight:    700,
          color:         pass ? 'var(--ps-success)' : 'var(--ps-danger)',
          background:    '#fff',
          border:        `1px solid ${pass ? 'var(--ps-success)' : 'var(--ps-danger)'}`,
          borderRadius:  'var(--ps-radius-sm)',
          padding:       '1px 7px',
          letterSpacing: '.04em',
          flexShrink:    0,
        }}
      >
        {pass ? 'Pass' : 'Fail'}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AccessibilityReport({ colors }) {
  const [wcagOpen, setWcagOpen] = useState(false);

  if (colors.length < 2) return null;

  // Compute all ordered pairs
  const ratios = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = 0; j < colors.length; j++) {
      if (i === j) continue;
      ratios.push(contrastRatio(colors[i], colors[j]));
    }
  }

  const totalPairs   = ratios.length;
  const bodyTextSafe = ratios.some(r => r >= 4.5);
  const largeTextSafe = ratios.some(r => r >= 3);
  const uiSafe        = ratios.some(r => r >= 3);
  const aaCount       = ratios.filter(r => r >= 4.5).length;
  const aaaCount      = ratios.filter(r => r >= 7).length;

  const checks = [bodyTextSafe, largeTextSafe, uiSafe];
  const failCount = checks.filter(c => !c).length;

  const verdict =
    failCount === 0 ? {
      bg:    'var(--ps-success-subtle)',
      border: 'var(--ps-success)',
      col:   'var(--ps-success)',
      text:  'Accessible palette — all key checks pass',
    } :
    failCount === 1 ? {
      bg:    'var(--ps-warning-subtle)',
      border: 'var(--ps-warning)',
      col:   'var(--ps-warning)',
      text:  'Mostly accessible — one check to address',
    } : {
      bg:    'var(--ps-danger-subtle)',
      border: 'var(--ps-danger)',
      col:   'var(--ps-danger)',
      text:  'Accessibility issues — see checks below',
    };

  return (
    <div
      style={{
        background:    'var(--ps-bg-surface)',
        border:        '1px solid var(--ps-border)',
        borderRadius:  'var(--ps-radius-xl)',
        overflow:      'hidden',
        boxShadow:     'var(--ps-shadow-sm)',
      }}
    >
      {/* ── Verdict banner ──────────────────────────────────────────────── */}
      <div
        style={{
          background:   verdict.bg,
          borderBottom: `1px solid ${verdict.border}`,
          padding:      '10px 18px',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          gap:          12,
        }}
      >
        <span
          style={{
            fontFamily:  'var(--ps-font-ui)',
            fontSize:    'var(--ps-text-sm)',
            fontWeight:  700,
            color:       verdict.col,
            letterSpacing: '.01em',
          }}
        >
          {verdict.text}
        </span>

        {/* What is WCAG? toggle */}
        <button
          onClick={() => setWcagOpen(o => !o)}
          style={{
            background:    'none',
            border:        `1px solid ${verdict.border}`,
            borderRadius:  'var(--ps-radius-sm)',
            padding:       '2px 8px',
            fontFamily:    'var(--ps-font-ui)',
            fontSize:      'var(--ps-text-xs)',
            color:         verdict.col,
            cursor:        'pointer',
            flexShrink:    0,
            letterSpacing: '.02em',
            opacity:       0.8,
          }}
        >
          {wcagOpen ? 'Close' : 'What is WCAG?'}
        </button>
      </div>

      {/* ── WCAG explanation ─────────────────────────────────────────────── */}
      {wcagOpen && (
        <div
          style={{
            padding:    '10px 18px',
            background: 'var(--ps-bg-subtle)',
            borderBottom: '1px solid var(--ps-border)',
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-sm)',
            color:      'var(--ps-text-secondary)',
            lineHeight: 1.6,
          }}
        >
          WCAG (Web Content Accessibility Guidelines) are the international standards
          for digital accessibility. <strong>AA</strong> is the legal minimum in most
          countries. <strong>AAA</strong> is the gold standard.
        </div>
      )}

      {/* ── Checks grid ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding:             '14px 16px',
          display:             'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap:                 8,
        }}
      >
        <CheckRow
          pass={bodyTextSafe}
          label={bodyTextSafe ? '✓ Safe for body text' : '✗ No safe body text combinations'}
        />
        <CheckRow
          pass={largeTextSafe}
          label={largeTextSafe ? '✓ Safe for large text and headings' : '✗ No safe combinations even for headings'}
        />
        <CheckRow
          pass={uiSafe}
          label={uiSafe ? '✓ Safe for buttons and icons' : '✗ Buttons and icons may not be distinguishable'}
        />

        {/* Empty cell to keep grid balanced */}
        <div />

        {/* ── Pair counts ───────────────────────────────────────────── */}
        <div
          style={{
            padding:      '8px 10px',
            background:   'var(--ps-bg-subtle)',
            borderRadius: 'var(--ps-radius-md)',
            border:       '1px solid var(--ps-border)',
            textAlign:    'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-lg)',
              fontWeight: 700,
              color:      aaCount > 0 ? 'var(--ps-success)' : 'var(--ps-text-tertiary)',
              lineHeight: 1.1,
            }}
          >
            {aaCount} <span style={{ fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)', fontWeight: 400 }}>of {totalPairs}</span>
          </div>
          <div
            style={{
              fontFamily:   'var(--ps-font-ui)',
              fontSize:     'var(--ps-text-xs)',
              color:        'var(--ps-text-secondary)',
              marginTop:    3,
              lineHeight:   1.3,
            }}
          >
            colour pairs meet AA standard
          </div>
        </div>

        <div
          style={{
            padding:      '8px 10px',
            background:   'var(--ps-bg-subtle)',
            borderRadius: 'var(--ps-radius-md)',
            border:       '1px solid var(--ps-border)',
            textAlign:    'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-lg)',
              fontWeight: 700,
              color:      aaaCount > 0 ? 'var(--ps-success)' : 'var(--ps-text-tertiary)',
              lineHeight: 1.1,
            }}
          >
            {aaaCount} <span style={{ fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)', fontWeight: 400 }}>of {totalPairs}</span>
          </div>
          <div
            style={{
              fontFamily:   'var(--ps-font-ui)',
              fontSize:     'var(--ps-text-xs)',
              color:        'var(--ps-text-secondary)',
              marginTop:    3,
              lineHeight:   1.3,
            }}
          >
            colour pairs meet AAA standard
          </div>
        </div>
      </div>
    </div>
  );
}
