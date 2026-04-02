import { useState } from 'react';
import { hexToRgb, rgbToHsl, hslToHex, rgbToHex, luminance, textOn } from '../utils/colourMath';
import { ROLES, ROLE_COL } from '../utils/autoRoles';
import { FONT_PAIRS } from '../constants';
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

function IncompleteCard({ onNavigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', background: 'var(--ps-bg-subtle)', borderRadius: 'var(--ps-radius-lg)', border: '1.5px dashed var(--ps-border)' }}>
      <div style={{ fontSize: 32, marginBottom: 14 }}>🎨</div>
      <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-lg)', fontWeight: 700, color: 'var(--ps-text-primary)', marginBottom: 10 }}>Assign your colours first</div>
      <p style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', color: 'var(--ps-text-secondary)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 20px' }}>
        Head to the Roles tab and assign at least a <strong>Background</strong>, <strong>Text</strong>, and <strong>Accent</strong> colour to see mockups come to life.
      </p>
      <button onClick={() => onNavigate('roles')} style={{ background: 'var(--ps-accent)', color: 'var(--ps-accent-text)', border: 'none', borderRadius: 'var(--ps-radius-md)', padding: '9px 20px', fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', fontWeight: 500, cursor: 'pointer', letterSpacing: '.02em', transition: 'background .15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--ps-accent-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--ps-accent)'}
      >Go to Roles</button>
    </div>
  );
}

function RoleSummary({ roles, onNavigate }) {
  const byRole = {};
  Object.entries(roles).forEach(([hex, role]) => { byRole[role] = hex; });
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--ps-border)', alignItems: 'flex-end' }}>
      {ROLES.map(role => {
        const hex = byRole[role];
        const assigned = !!hex;
        const pillCol = ROLE_COL[role] || 'var(--ps-text-tertiary)';
        return (
          <div key={role} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--ps-radius-md)', background: assigned ? hex : 'transparent', border: `2px solid ${assigned ? hex : 'var(--ps-border)'}`, flexShrink: 0 }} />
            <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 7, fontWeight: 700, color: assigned ? pillCol : 'var(--ps-text-tertiary)', letterSpacing: '.06em', textAlign: 'center' }}>{role.toUpperCase()}</div>
            {!assigned && (
              <button onClick={() => onNavigate('roles')} style={{ background: 'none', border: 'none', color: 'var(--ps-accent)', fontFamily: 'var(--ps-font-ui)', fontSize: 7, cursor: 'pointer', padding: 0, letterSpacing: '.04em', textDecoration: 'underline' }}>→ Assign</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmailSignature({ palette, headingFont, bodyFont }) {
  const { hero, accent, background: bg, text } = palette;
  return (
    <div style={{ padding: '24px 28px', background: bg, borderRadius: 8, width: '100%', maxWidth: 480, fontFamily: bodyFont }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: hero, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
          <span style={{ fontFamily: headingFont, fontSize: 22, color: textOn(hero), fontWeight: 600 }}>J</span>
        </div>
        <div>
          <div style={{ fontFamily: headingFont, fontSize: 16, color: text, fontWeight: 600, marginBottom: 2 }}>Jane Doe</div>
          <div style={{ fontSize: 10, color: accent, marginBottom: 8 }}>Creative Director at YourBrand</div>
          <div style={{ width: 32, height: 2, background: hero, borderRadius: 1, marginBottom: 8 }} />
          <div style={{ fontSize: 9, color: text, opacity: .6, lineHeight: 1.8 }}>+1 (555) 123-4567 · hello@yourbrand.com</div>
          <div style={{ fontSize: 9, color: text, opacity: .5, marginTop: 2 }}>www.yourbrand.com</div>
        </div>
      </div>
    </div>
  );
}

function InvoiceMockup({ palette, headingFont, bodyFont }) {
  const { hero, accent, background: bg, text, neutral } = palette;
  const items = [['Brand Strategy Workshop', '2', '$950.00', '$1,900.00'], ['Logo Design Package', '1', '$2,400.00', '$2,400.00'], ['Brand Guidelines Document', '1', '$800.00', '$800.00']];
  return (
    <div style={{ background: bg, padding: '24px 28px', borderRadius: 8, width: '100%', maxWidth: 480, fontFamily: bodyFont }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: headingFont, fontSize: 18, color: text, fontWeight: 600 }}>INVOICE</div>
          <div style={{ fontSize: 9, color: text, opacity: .5, marginTop: 4 }}>#INV-2024-0042</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: headingFont, fontSize: 12, color: hero, fontWeight: 600 }}>YourBrand</div>
          <div style={{ fontSize: 9, color: text, opacity: .5, lineHeight: 1.6 }}>123 Design Street<br />New York, NY 10001</div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${neutral}40`, marginBottom: 12 }} />
      <div style={{ marginBottom: 12 }}>
        {items.map(([desc, qty, rate, total], idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${neutral}20`, fontSize: 10, color: text }}>
            <span style={{ flex: 2 }}>{desc}</span>
            <span style={{ flex: .5, textAlign: 'center', opacity: .6 }}>{qty}</span>
            <span style={{ flex: 1, textAlign: 'right', opacity: .6 }}>{rate}</span>
            <span style={{ flex: 1, textAlign: 'right', fontWeight: 500 }}>{total}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20, padding: '10px 0' }}>
        <span style={{ fontSize: 11, color: text, opacity: .6 }}>Total Due</span>
        <span style={{ fontFamily: headingFont, fontSize: 20, color: hero, fontWeight: 700 }}>$5,100.00</span>
      </div>
      <div style={{ marginTop: 12, padding: '8px 14px', background: `${accent}15`, borderRadius: 'var(--ps-radius-md)', fontSize: 9, color: accent, textAlign: 'center' }}>Payment due within 30 days · Thank you for your business</div>
    </div>
  );
}

function Letterhead({ palette, headingFont, bodyFont }) {
  const { hero, accent, background: bg, text, neutral } = palette;
  return (
    <div style={{ background: bg, padding: '28px 32px', minHeight: 320, display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: 8, width: '100%', maxWidth: 480, fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 5, background: `linear-gradient(90deg, ${hero}, ${accent})`, borderRadius: '8px 8px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingTop: 8 }}>
        <div style={{ fontFamily: headingFont, fontSize: 16, color: text, fontWeight: 600 }}>YourBrand</div>
        <div style={{ fontSize: 8, color: text, opacity: .5, textAlign: 'right', lineHeight: 1.6 }}>123 Design Street · New York, NY 10001<br />hello@yourbrand.com · (555) 123-4567</div>
      </div>
      <div style={{ fontSize: 10, color: text, opacity: .6, marginBottom: 8 }}>April 1, 2026</div>
      <div style={{ fontSize: 10, color: text, opacity: .6, marginBottom: 16 }}>Dear Valued Client,</div>
      <div style={{ fontSize: 10, color: text, opacity: .7, lineHeight: 1.85, marginBottom: 20, flex: 1 }}>Thank you for choosing YourBrand. We are thrilled to partner with you on this exciting project. Our team is committed to delivering exceptional results that exceed your expectations and elevate your brand presence.</div>
      <div style={{ borderTop: `1px solid ${neutral}30`, paddingTop: 14, marginTop: 'auto' }}>
        <div style={{ fontFamily: headingFont, fontSize: 11, color: hero, fontWeight: 600, marginBottom: 2 }}>Jane Doe</div>
        <div style={{ fontSize: 9, color: text, opacity: .5 }}>Creative Director</div>
      </div>
    </div>
  );
}

const MOCKUP_TYPES = [
  { key: 'website',   label: 'Website',       caption: 'Website hero section preview' },
  { key: 'social',    label: 'Social Post',   caption: 'Social media post — 1:1 square format' },
  { key: 'bizcard',   label: 'Business Card', caption: 'Business card — 3.5 × 2 inches (front face)' },
  { key: 'email',     label: 'Email Sig',     caption: 'Email signature block' },
  { key: 'invoice',   label: 'Invoice',       caption: 'Invoice with line items and total' },
  { key: 'letter',    label: 'Letterhead',    caption: 'Formal letterhead with gradient header' },
];

export default function MockupsTab({ roles, colors, onNavigate, selectedFont }) {
  const [activeKey, setActiveKey] = useState('website');
  const palette = buildPalette(colors, roles);
  const ready = hasMinimumRoles(roles);
  const active = MOCKUP_TYPES.find(m => m.key === activeKey);
  const activePair = selectedFont || FONT_PAIRS[0];
  const headingFont = activePair.heading;
  const bodyFont = activePair.body;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-lg)', fontWeight: 700, color: 'var(--ps-text-primary)', marginBottom: 8 }}>See your palette in action</div>
        <p style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', color: 'var(--ps-text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
          These mockups use your assigned colours and selected typography. Change colours, reassign roles, or switch fonts — everything updates live.
          {selectedFont && <span style={{ color: 'var(--ps-accent)' }}>{' '}Using <strong>{selectedFont.name}</strong> font pair.</span>}
        </p>
        <p style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>These are design previews, not production templates. They help you feel confident your colours work in the real world.</p>
      </div>
      <div className="card">
        <div style={{ display: 'inline-flex', background: 'var(--ps-bg-subtle)', borderRadius: 'var(--ps-radius-lg)', padding: 3, gap: 3, marginBottom: 20, flexWrap: 'wrap' }}>
          {MOCKUP_TYPES.map(m => {
            const isActive = m.key === activeKey;
            return (
              <button key={m.key} onClick={() => setActiveKey(m.key)} style={{ background: isActive ? 'var(--ps-accent)' : 'transparent', color: isActive ? 'var(--ps-accent-text)' : 'var(--ps-text-tertiary)', border: 'none', borderRadius: 'var(--ps-radius-md)', padding: '6px 14px', fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', fontWeight: isActive ? 600 : 500, cursor: 'pointer', letterSpacing: '.04em', transition: 'background .15s, color .15s' }}>{m.label}</button>
            );
          })}
        </div>
        <div style={{ background: 'var(--ps-bg-surface)', border: '1px solid var(--ps-border)', borderRadius: 'var(--ps-radius-lg)', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {ready ? (
            <>
              <div style={{ maxWidth: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                {activeKey === 'website' && <WebsiteHero palette={palette} />}
                {activeKey === 'social' && <SocialPost palette={palette} />}
                {activeKey === 'bizcard' && <BusinessCard palette={palette} />}
                {activeKey === 'email' && <EmailSignature palette={palette} headingFont={headingFont} bodyFont={bodyFont} />}
                {activeKey === 'invoice' && <InvoiceMockup palette={palette} headingFont={headingFont} bodyFont={bodyFont} />}
                {activeKey === 'letter' && <Letterhead palette={palette} headingFont={headingFont} bodyFont={bodyFont} />}
              </div>
              <div style={{ fontFamily: 'var(--ps-font-ui)', marginTop: 12, fontSize: 9, color: 'var(--ps-text-tertiary)', letterSpacing: '.06em', textAlign: 'center' }}>{active?.caption}</div>
            </>
          ) : (
            <IncompleteCard onNavigate={onNavigate} />
          )}
        </div>
        <RoleSummary roles={roles} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
