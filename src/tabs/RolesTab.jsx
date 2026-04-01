import BrandPreview from '../components/BrandPreview';
import RoleRow from '../components/RoleRow';
import { ROLE_DESC } from '../utils/autoRoles';
import { inferPersonality } from '../utils/inferPersonality';
import { hexToRgb, rgbToHsl } from '../utils/colourMath';

function ProportionBar({ colors, roles }) {
  const heroHex = Object.keys(roles).find(k => roles[k] === 'Hero');
  const accHex  = Object.keys(roles).find(k => roles[k] === 'Accent');
  const bgHex   = Object.keys(roles).find(k => roles[k] === 'Background');

  const segments = [
    { label: '60% — Base',   color: bgHex   || 'var(--ps-border)', pct: 60 },
    { label: '30% — Hero',   color: heroHex || 'var(--ps-text-tertiary)', pct: 30 },
    { label: '10% — Accent', color: accHex  || 'var(--ps-accent)', pct: 10 },
  ];

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontFamily:    'var(--ps-font-ui)',
          fontSize:      'var(--ps-text-xs)',
          fontWeight:    700,
          color:         'var(--ps-text-secondary)',
          letterSpacing: '.07em',
          marginBottom:  8,
        }}
      >
        60-30-10 PROPORTION
      </div>
      <div
        style={{
          display:      'flex',
          height:       24,
          borderRadius: 'var(--ps-radius-md)',
          overflow:     'hidden',
          border:       '1px solid var(--ps-border)',
        }}
      >
        {segments.map((s, i) => (
          <div
            key={i}
            title={s.label}
            style={{ flex: s.pct, background: s.color, transition: 'background .3s' }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width:        10,
                height:       10,
                borderRadius: 'var(--ps-radius-sm)',
                background:   s.color,
                border:       '1px solid rgba(0,0,0,.1)',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--ps-font-ui)',
                fontSize:   'var(--ps-text-xs)',
                color:      'var(--ps-text-tertiary)',
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalityPanel({ colors }) {
  if (!colors.length) return null;
  const { r, g, b } = hexToRgb(colors[0]);
  const { s } = rgbToHsl(r, g, b);
  const hi = colors.reduce((m, h) => {
    const { r: rr, g: gg, b: bb } = hexToRgb(h);
    const { s: ss } = rgbToHsl(rr, gg, bb);
    return ss > s ? h : m;
  }, colors[0]);
  const p = inferPersonality(hi);

  return (
    <div
      style={{
        background:   'var(--ps-bg-subtle)',
        border:       '1px solid var(--ps-border)',
        borderRadius: 'var(--ps-radius-lg)',
        padding:      '12px 16px',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width:        22,
            height:       22,
            borderRadius: 'var(--ps-radius-sm)',
            background:   hi,
            border:       '1px solid rgba(0,0,0,.1)',
            flexShrink:   0,
          }}
        />
        <div>
          <div
            style={{
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      'var(--ps-text-sm)',
              fontWeight:    600,
              color:         'var(--ps-text-primary)',
              letterSpacing: '.02em',
            }}
          >
            {p.trait}
          </div>
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-xs)',
              color:      'var(--ps-text-secondary)',
            }}
          >
            {p.psychProfile}
          </div>
        </div>
      </div>
      <p
        style={{
          fontFamily: 'var(--ps-font-ui)',
          fontSize:   'var(--ps-text-xs)',
          color:      'var(--ps-text-secondary)',
          lineHeight: 1.55,
          margin:     '8px 0 4px',
        }}
      >
        {p.desc}
      </p>
      {p.example && (
        <div
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-xs)',
            color:      'var(--ps-accent)',
            fontWeight: 600,
          }}
        >
          Similar to: {p.example}
        </div>
      )}
    </div>
  );
}

export default function RolesTab({ colors, roles, autoReasons, onSetRole, onChooseForMe, onClearRoles }) {
  const rolesByHex    = Object.keys(roles);
  const assignedCount = rolesByHex.length;
  const hasEnough     = Object.values(roles).includes('Background') &&
                        Object.values(roles).includes('Text') &&
                        (Object.values(roles).includes('Hero') || Object.values(roles).includes('Accent'));

  return (
    <div className="card">
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontWeight: 600,
              fontSize:   'var(--ps-text-base)',
              color:      'var(--ps-text-primary)',
            }}
          >
            Assign Colour Jobs
          </div>
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-xs)',
              color:      'var(--ps-text-secondary)',
              marginTop:  2,
            }}
          >
            Each colour should have one job — a reason to exist in your brand system.
          </div>
        </div>

        {/* Primary action — ✨ stays, gradient replaced with flat accent */}
        <button
          onClick={onChooseForMe}
          style={{
            background:    'var(--ps-accent)',
            color:         'var(--ps-accent-text)',
            border:        'none',
            borderRadius:  'var(--ps-radius-md)',
            padding:       '8px 16px',
            fontFamily:    'var(--ps-font-ui)',
            fontSize:      'var(--ps-text-sm)',
            fontWeight:    500,
            cursor:        'pointer',
            letterSpacing: '.02em',
            transition:    'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--ps-accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--ps-accent)'}
        >
          ✨ Choose for me
        </button>

        {assignedCount > 0 && (
          <button
            onClick={onClearRoles}
            style={{
              background:   'var(--ps-bg-surface)',
              border:       '1px solid var(--ps-border)',
              color:        'var(--ps-text-secondary)',
              borderRadius: 'var(--ps-radius-md)',
              padding:      '7px 14px',
              fontFamily:   'var(--ps-font-ui)',
              fontSize:     'var(--ps-text-sm)',
              cursor:       'pointer',
              transition:   'border-color .15s, color .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--ps-border-strong)';
              e.currentTarget.style.color = 'var(--ps-text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--ps-border)';
              e.currentTarget.style.color = 'var(--ps-text-secondary)';
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Role descriptions reference */}
      <div
        style={{
          background:          'var(--ps-bg-subtle)',
          borderRadius:        'var(--ps-radius-lg)',
          padding:             '10px 14px',
          marginBottom:        16,
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap:                 6,
        }}
      >
        {Object.entries(ROLE_DESC).map(([role, desc]) => (
          <div
            key={role}
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-xs)',
              color:      'var(--ps-text-secondary)',
              lineHeight: 1.4,
            }}
          >
            <strong style={{ color: 'var(--ps-text-primary)' }}>{role}:</strong> {desc}
          </div>
        ))}
      </div>

      {/* Personality */}
      <PersonalityPanel colors={colors} />

      {/* Proportion bar */}
      <ProportionBar colors={colors} roles={roles} />

      {/* Role rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {colors.map(hex => (
          <RoleRow
            key={hex}
            hex={hex}
            assignedRole={roles[hex]}
            reason={autoReasons[hex]}
            onSetRole={onSetRole}
          />
        ))}
      </div>

      {/* Brand preview */}
      {hasEnough ? (
        <>
          <div
            style={{
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      'var(--ps-text-xs)',
              fontWeight:    700,
              color:         'var(--ps-text-secondary)',
              letterSpacing: '.07em',
              marginBottom:  10,
            }}
          >
            LIVE BRAND PREVIEW
          </div>
          <BrandPreview roles={roles} />
        </>
      ) : (
        <div
          style={{
            background:  'var(--ps-bg-subtle)',
            border:      '1.5px dashed var(--ps-border)',
            borderRadius: 'var(--ps-radius-lg)',
            padding:     '18px',
            textAlign:   'center',
            fontFamily:  'var(--ps-font-ui)',
            color:       'var(--ps-text-tertiary)',
            fontSize:    'var(--ps-text-sm)',
          }}
        >
          Assign a Background, Text, and Hero (or Accent) colour above to see the live brand preview.
        </div>
      )}
    </div>
  );
}
