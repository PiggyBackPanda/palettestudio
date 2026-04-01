import { textOn } from '../utils/colourMath';

// NOTE: This component renders a simulated brand preview using the user's palette
// colours (not app tokens). Fonts here represent the rendered brand mock — not app UI.
export default function BrandPreview({ roles }) {
  // roles is { hex: roleName } — invert it to { roleName: hex } for lookup
  const byRole = {};
  Object.entries(roles).forEach(([hex, role]) => { byRole[role] = hex; });

  const bg   = byRole['Background'] || '#f5f2ed';
  const hero = byRole['Hero']       || '#2D4A6B';
  const acc  = byRole['Accent']     || '#E8734A';
  const text = byRole['Text']       || '#1a1510';
  const neut = byRole['Neutral']    || '#9a8878';

  const btnText  = textOn(acc);
  const headText = textOn(hero);

  return (
    <div
      style={{
        background:   bg,
        borderRadius: 'var(--ps-radius-lg)',
        overflow:     'hidden',
        border:       '1px solid var(--ps-border)',
        fontFamily:   'var(--ps-font-ui)',
      }}
    >
      {/* Simulated nav bar */}
      <div
        style={{
          background:     hero,
          padding:        '10px 18px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   15,
            color:      headText,
            fontWeight: 700,
          }}
        >
          Brand Name
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['Home', 'About', 'Work'].map(l => (
            <span
              key={l}
              style={{
                fontFamily: 'var(--ps-font-ui)',
                fontSize:   10,
                color:      headText,
                opacity:    0.8,
              }}
            >
              {l}
            </span>
          ))}
          <span
            style={{
              background:    acc,
              color:         btnText,
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      9,
              fontWeight:    600,
              padding:       '3px 10px',
              borderRadius:  'var(--ps-radius-sm)',
              letterSpacing: '.04em',
            }}
          >
            Contact
          </span>
        </div>
      </div>

      {/* Hero section */}
      <div style={{ padding: '22px 18px' }}>
        <div
          style={{
            fontFamily:   'var(--ps-font-ui)',
            fontSize:     22,
            fontWeight:   700,
            color:        text,
            lineHeight:   1.2,
            marginBottom: 8,
          }}
        >
          Your brand headline<br />goes right here
        </div>
        <p
          style={{
            fontFamily:   'var(--ps-font-ui)',
            fontSize:     11,
            color:        neut,
            lineHeight:   1.6,
            marginBottom: 14,
          }}
        >
          Supporting body copy that explains what you do and why it matters to your audience.
        </p>
        <button
          style={{
            background:    acc,
            color:         btnText,
            border:        'none',
            borderRadius:  'var(--ps-radius-md)',
            padding:       '9px 20px',
            fontFamily:    'var(--ps-font-ui)',
            fontSize:      11,
            fontWeight:    700,
            cursor:        'pointer',
            letterSpacing: '.04em',
          }}
        >
          Get Started
        </button>
      </div>

      {/* Footer strip */}
      <div
        style={{
          background: hero,
          padding:    '8px 18px',
          display:    'flex',
          alignItems: 'center',
          gap:        8,
        }}
      >
        {[hero, acc, neut, bg, text].map((c, i) => (
          <div
            key={i}
            title={c}
            style={{
              width:        14,
              height:       14,
              borderRadius: '50%',
              background:   c,
              border:       '1.5px solid rgba(255,255,255,0.25)',
              flexShrink:   0,
            }}
          />
        ))}
        <span
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   9,
            color:      headText,
            opacity:    0.6,
            marginLeft: 4,
          }}
        >
          Brand Preview
        </span>
      </div>
    </div>
  );
}
