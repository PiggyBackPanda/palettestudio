import { useState } from 'react';
import { hexToRgb, rgbToHsl, hslToHex, rgbToHex, textOn } from '../utils/colourMath';
import { ROLES, ROLE_COL } from '../utils/autoRoles';
import WebsiteHero  from '../components/mockups/WebsiteHero';
import SocialPost   from '../components/mockups/SocialPost';
import BusinessCard from '../components/mockups/BusinessCard';

// ─── buildPalette ─────────────────────────────────────────────────────────────
function buildPalette(colors, roles) {
  const byRole = {};
  Object.entries(roles).forEach(([hex, role]) => { byRole[role] = hex; });

  const bg   = byRole['Background'] || '#f5f2ed';
  const hero = byRole['Hero']       || '#6b7280';

  let accent = byRole['Accent'];
  if (!accent) {
    const { r: r1, g: g1, b: b1 } = hexToRgb(hero);
    const { r: r2, g: g2, b: b2 } = hexToRgb(bg);
    const R = 0.85;
    accent = rgbToHex(
      Math.round(r1 * R + r2 * (1 - R)),
      Math.round(g1 * R + g2 * (1 - R)),
      Math.round(b1 * R + b2 * (1 - R)),
    );
  }

  const text = byRole['Text'] || '#1a1a2e';

  let neutral = byRole['Neutral'];
  if (!neutral) {
    const { r, g, b } = hexToRgb(bg);
    const { h, s, l } = rgbToHsl(r, g, b);
    neutral = hslToHex(h, s, l * 0.6);
  }

  return { hero, accent, neutral, background: bg, text };
}

function hasMinimumRoles(roles) {
  const assigned = new Set(Object.values(roles));
  return assigned.has('Background') && assigned.has('Text') && assigned.has('Accent');
}

// ─── Incomplete state card ────────────────────────────────────────────────────
function IncompleteCard({ onNavigate }) {
  return (
    <div
      style={{
        textAlign:    'center',
        padding:      '40px 24px',
        background:   'var(--ps-bg-subtle)',
        borderRadius: 'var(--ps-radius-lg)',
        border:       '1.5px dashed var(--ps-border)',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 14 }}>🎨</div>
      <div
        style={{
          fontFamily:   'var(--ps-font-ui)',
          fontSize:     'var(--ps-text-lg)',
          fontWeight:   700,
          color:        'var(--ps-text-primary)',
          marginBottom: 10,
        }}
      >
        Assign your colours first
      </div>
      <p
        style={{
          fontFamily:  'var(--ps-font-ui)',
          fontSize:    'var(--ps-text-sm)',
          color:       'var(--ps-text-secondary)',
          lineHeight:  1.6,
          maxWidth:    360,
          margin:      '0 auto 20px',
        }}
      >
        Head to the Colour Jobs tab and assign at least a{' '}
        <strong>Background</strong>, <strong>Text</strong>, and{' '}
        <strong>Accent</strong> colour to see this mockup come to life.
      </p>
      <button
        onClick={() => onNavigate('roles')}
        style={{
          background:    'var(--ps-accent)',
          color:         'var(--ps-accent-text)',
          border:        'none',
          borderRadius:  'var(--ps-radius-md)',
          padding:       '9px 20px',
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
        Go to Colour Jobs
      </button>
    </div>
  );
}

// ─── Role summary pills ───────────────────────────────────────────────────────
function RoleSummary({ roles, onNavigate }) {
  const byRole = {};
  Object.entries(roles).forEach(([hex, role]) => { byRole[role] = hex; });

  return (
    <div
      style={{
        display:    'flex',
        gap:        12,
        flexWrap:   'wrap',
        marginTop:  16,
        paddingTop: 16,
        borderTop:  '1px solid var(--ps-border)',
        alignItems: 'flex-end',
      }}
    >
      {ROLES.map(role => {
        const hex      = byRole[role];
        const assigned = !!hex;
        const pillCol  = ROLE_COL[role] || 'var(--ps-text-tertiary)';

        return (
          <div
            key={role}
            style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              gap:           4,
            }}
          >
            <div
              style={{
                width:        28,
                height:       28,
                borderRadius: 'var(--ps-radius-md)',
                background:   assigned ? hex : 'transparent',
                border:       `2px solid ${assigned ? hex : 'var(--ps-border)'}`,
                flexShrink:   0,
              }}
            />
            <div
              style={{
                fontFamily:    'var(--ps-font-ui)',
                fontSize:      7,
                fontWeight:    700,
                color:         assigned ? pillCol : 'var(--ps-text-tertiary)',
                letterSpacing: '.06em',
                textAlign:     'center',
              }}
            >
              {role.toUpperCase()}
            </div>
            {!assigned && (
              <button
                onClick={() => onNavigate('roles')}
                style={{
                  background:     'none',
                  border:         'none',
                  color:          'var(--ps-accent)',
                  fontFamily:     'var(--ps-font-ui)',
                  fontSize:       7,
                  cursor:         'pointer',
                  padding:        0,
                  letterSpacing:  '.04em',
                  textDecoration: 'underline',
                }}
              >
                → Assign
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Mockup type definitions ──────────────────────────────────────────────────
const MOCKUP_TYPES = [
  { key: 'website', label: 'Website',      caption: 'Website hero section preview' },
  { key: 'social',  label: 'Social Post',  caption: 'Social media post — 1:1 square format' },
  { key: 'bizcard', label: 'Business Card', caption: 'Business card — 3.5 × 2 inches (front face)' },
];

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function MockupsTab({ roles, colors, onNavigate }) {
  const [activeKey, setActiveKey] = useState('website');

  const palette = buildPalette(colors, roles);
  const ready   = hasMinimumRoles(roles);
  const active  = MOCKUP_TYPES.find(m => m.key === activeKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header card ────────────────────────────────────────────────── */}
      <div className="card">
        <div
          style={{
            fontFamily:   'var(--ps-font-ui)',
            fontSize:     'var(--ps-text-lg)',
            fontWeight:   700,
            color:        'var(--ps-text-primary)',
            marginBottom: 8,
          }}
        >
          See your palette in action
        </div>
        <p
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-sm)',
            color:      'var(--ps-text-secondary)',
            lineHeight: 1.6,
            margin:     '0 0 8px',
          }}
        >
          These mockups use only the colours you've assigned in the Colour Jobs tab.
          Every time you change a colour or reassign a role, the mockups update live.
        </p>
        <p
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-xs)',
            color:      'var(--ps-text-tertiary)',
            lineHeight: 1.55,
            margin:     0,
            fontStyle:  'italic',
          }}
        >
          These are design previews, not production templates. They're here to help you
          feel confident your colours work in the real world before you hand them to a designer.
        </p>
      </div>

      {/* ── Switcher + mockup display ───────────────────────────────────── */}
      <div className="card">

        {/* Pill switcher */}
        <div
          style={{
            display:      'inline-flex',
            background:   'var(--ps-bg-subtle)',
            borderRadius: 'var(--ps-radius-lg)',
            padding:      3,
            gap:          3,
            marginBottom: 20,
          }}
        >
          {MOCKUP_TYPES.map(m => {
            const isActive = m.key === activeKey;
            return (
              <button
                key={m.key}
                onClick={() => setActiveKey(m.key)}
                style={{
                  background:    isActive ? 'var(--ps-accent)' : 'transparent',
                  color:         isActive ? 'var(--ps-accent-text)' : 'var(--ps-text-tertiary)',
                  border:        'none',
                  borderRadius:  'var(--ps-radius-md)',
                  padding:       '6px 16px',
                  fontFamily:    'var(--ps-font-ui)',
                  fontSize:      'var(--ps-text-xs)',
                  fontWeight:    isActive ? 600 : 500,
                  cursor:        'pointer',
                  letterSpacing: '.04em',
                  transition:    'background .15s, color .15s',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Mockup display area */}
        <div
          style={{
            background:    'var(--ps-bg-surface)',
            border:        '1px solid var(--ps-border)',
            borderRadius:  'var(--ps-radius-lg)',
            padding:       32,
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
          }}
        >
          {ready ? (
            <>
              <div
                style={{
                  maxWidth:       '100%',
                  overflowX:      'auto',
                  display:        'flex',
                  justifyContent: 'center',
                }}
              >
                {activeKey === 'website' && <WebsiteHero  palette={palette} />}
                {activeKey === 'social'  && <SocialPost   palette={palette} />}
                {activeKey === 'bizcard' && <BusinessCard palette={palette} />}
              </div>

              <div
                style={{
                  fontFamily:    'var(--ps-font-ui)',
                  marginTop:     12,
                  fontSize:      9,
                  color:         'var(--ps-text-tertiary)',
                  letterSpacing: '.06em',
                  textAlign:     'center',
                }}
              >
                {active?.caption}
              </div>
            </>
          ) : (
            <IncompleteCard onNavigate={onNavigate} />
          )}
        </div>

        {/* Role summary */}
        <RoleSummary roles={roles} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
