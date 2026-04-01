import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ps-welcomed-session';

const STEPS = [
  {
    num:   '1',
    title: 'Build your palette',
    desc:  'Upload a logo to extract colours automatically, or add them manually. Use "Surprise me" to generate a harmonious starting point.',
  },
  {
    num:   '2',
    title: 'Diagnose & fix',
    desc:  'Instantly check for contrast failures, missing colour roles, and how your palette looks to people with colour blindness.',
  },
  {
    num:   '3',
    title: 'Export & use',
    desc:  'Copy your palette as CSS variables, a Tailwind config, or JSON — ready to drop straight into your project.',
  },
];

export default function WelcomeModal({ onClose, onLoadExample }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (!seen) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    onClose?.();
  };

  const loadExample = () => {
    dismiss();
    onLoadExample?.();
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         500,
        background:     'rgba(24,24,27,0.5)',
        backdropFilter: 'blur(3px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '20px 16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        style={{
          background:   'var(--ps-bg-surface)',
          borderRadius: 'var(--ps-radius-xl)',
          boxShadow:    '0 24px 48px rgba(0,0,0,0.18)',
          maxWidth:     540,
          width:        '100%',
          overflow:     'hidden',
        }}
      >
        {/* ── Header band ────────────────────────────────────────────── */}
        <div style={{ background: 'var(--ps-accent)', padding: '28px 32px 24px' }}>
          <div
            style={{
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      'var(--ps-text-xs)',
              fontWeight:    600,
              letterSpacing: '.12em',
              color:         'rgba(255,255,255,0.65)',
              marginBottom:  6,
              textTransform: 'uppercase',
            }}
          >
            Welcome to
          </div>
          <div
            style={{
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      28,
              fontWeight:    800,
              color:         '#fff',
              letterSpacing: '-.02em',
              lineHeight:    1.1,
              marginBottom:  10,
            }}
          >
            Palette Studio
          </div>
          <p
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-md)',
              color:      'rgba(255,255,255,0.8)',
              lineHeight: 1.55,
              margin:     0,
            }}
          >
            Build, test, and export brand colour palettes — with
            built-in accessibility checking at every step.
          </p>
        </div>

        {/* ── 3-step flow ─────────────────────────────────────────────── */}
        <div
          style={{
            display:  'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:      '1px',
            background: 'var(--ps-border)',
            borderTop:  '1px solid var(--ps-border)',
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              style={{
                background: i === 0 ? 'var(--ps-bg-subtle)' : 'var(--ps-bg-surface)',
                padding:    '20px 18px',
              }}
            >
              <div
                style={{
                  width:         28,
                  height:        28,
                  borderRadius:  'var(--ps-radius-full)',
                  background:    'var(--ps-accent)',
                  color:         '#fff',
                  fontFamily:    'var(--ps-font-ui)',
                  fontSize:      'var(--ps-text-sm)',
                  fontWeight:    700,
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent:'center',
                  marginBottom:  10,
                  flexShrink:    0,
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontFamily:   'var(--ps-font-ui)',
                  fontSize:     'var(--ps-text-md)',
                  fontWeight:   600,
                  color:        'var(--ps-text-primary)',
                  marginBottom: 6,
                  lineHeight:   1.2,
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontFamily: 'var(--ps-font-ui)',
                  fontSize:   'var(--ps-text-sm)',
                  color:      'var(--ps-text-secondary)',
                  lineHeight: 1.55,
                }}
              >
                {s.desc}
              </div>
            </div>
          ))}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div
          style={{
            padding:    '20px 24px',
            display:    'flex',
            gap:        10,
            alignItems: 'center',
            flexWrap:   'wrap',
            background: 'var(--ps-bg-subtle)',
            borderTop:  '1px solid var(--ps-border)',
          }}
        >
          <button
            onClick={dismiss}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--ps-accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--ps-accent)'}
            style={{
              background:    'var(--ps-accent)',
              color:         'var(--ps-accent-text)',
              border:        'none',
              borderRadius:  'var(--ps-radius-md)',
              padding:       '9px 22px',
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      'var(--ps-text-md)',
              fontWeight:    600,
              cursor:        'pointer',
              letterSpacing: '.01em',
              transition:    'background .15s',
              flexShrink:    0,
            }}
          >
            Get started
          </button>
          <button
            onClick={loadExample}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--ps-accent)';
              e.currentTarget.style.color = 'var(--ps-accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--ps-border-strong)';
              e.currentTarget.style.color = 'var(--ps-text-secondary)';
            }}
            style={{
              background:   'var(--ps-bg-surface)',
              color:        'var(--ps-text-secondary)',
              border:       '1px solid var(--ps-border-strong)',
              borderRadius: 'var(--ps-radius-md)',
              padding:      '9px 18px',
              fontFamily:   'var(--ps-font-ui)',
              fontSize:     'var(--ps-text-md)',
              fontWeight:   500,
              cursor:       'pointer',
              transition:   'border-color .15s, color .15s',
              flexShrink:   0,
            }}
          >
            Load an example
          </button>
          <span
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-xs)',
              color:      'var(--ps-text-tertiary)',
              marginLeft: 'auto',
            }}
          >
            Won't show again
          </span>
        </div>
      </div>
    </div>
  );
}
