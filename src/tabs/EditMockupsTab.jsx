import { useState } from 'react';
import { hexToRgb, rgbToHsl, hslToHex, rgbToHex, luminance, textOn } from '../utils/colourMath';
import { ROLES, ROLE_COL } from '../utils/autoRoles';
import { FONT_PAIRS } from '../constants';

// ─── buildPalette ─────────────────────────────────────────────────────────────
function buildPalette(colors, roles) {
  const byRole = {};
  Object.entries(roles).forEach(([hex, role]) => { byRole[role] = hex; });
  const bg   = byRole['Background'] || '#f5f2ed';
  const hero = byRole['Hero']       || '#6b7280';
  const accent = byRole['Accent']   || hero;
  const text = byRole['Text']       || '#1a1a2e';
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

// ─── IncompleteCard ─────────────────────────────────────────────────────────
function IncompleteCard({ onNavigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', background: 'var(--ps-bg-subtle)', borderRadius: 'var(--ps-radius-lg)', border: '1.5px dashed var(--ps-border)' }}>
      <div style={{ fontSize: 32, marginBottom: 14 }}>🎨</div>
      <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-lg)', fontWeight: 700, color: 'var(--ps-text-primary)', marginBottom: 10 }}>Assign your colours first</div>
      <p style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', color: 'var(--ps-text-secondary)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 20px' }}>
        Head to the Roles tab and assign at least a <strong>Background</strong>, <strong>Text</strong>, and <strong>Accent</strong> colour to see editable mockups.
      </p>
      <button
        onClick={() => onNavigate('roles')}
        style={{ background: 'var(--ps-accent)', color: 'var(--ps-accent-text)', border: 'none', borderRadius: 'var(--ps-radius-md)', padding: '9px 20px', fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', fontWeight: 500, cursor: 'pointer', letterSpacing: '.02em', transition: 'background .15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--ps-accent-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--ps-accent)'}
      >Go to Roles</button>
    </div>
  );
}

// ─── Editable field input ───────────────────────────────────────────────────
function FieldInput({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', fontWeight: 600, color: 'var(--ps-text-secondary)', letterSpacing: '.04em' }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontFamily: 'var(--ps-font-mono)',
          fontSize: 'var(--ps-text-sm)',
          color: 'var(--ps-text-primary)',
          background: 'var(--ps-bg-surface)',
          border: '1px solid var(--ps-border)',
          borderRadius: 'var(--ps-radius-md)',
          padding: '7px 10px',
          outline: 'none',
          transition: 'border-color .15s',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--ps-accent)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--ps-border)'}
      />
    </label>
  );
}

// ─── Template wrapper ───────────────────────────────────────────────────────
function TemplateCard({ title, description, children }) {
  return (
    <div style={{ background: 'var(--ps-bg-surface)', border: '1px solid var(--ps-border)', borderRadius: 'var(--ps-radius-lg)', overflow: 'hidden' }}>
      {children}
      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--ps-border)', fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)', lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--ps-text-secondary)' }}>{title}</strong> — {description}
      </div>
    </div>
  );
}

// ─── Business Card ──────────────────────────────────────────────────────────
function BusinessCardMockup({ palette, headingFont, bodyFont, fields }) {
  const { hero, background: bg, text, neutral } = palette;
  return (
    <div style={{ padding: '28px 32px', background: bg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200, position: 'relative', borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }}>
      <div style={{ width: 36, height: 4, background: hero, borderRadius: 2, marginBottom: 16 }} />
      <div>
        <div style={{ fontFamily: headingFont, fontSize: 20, color: text, marginBottom: 4, fontWeight: 600 }}>{fields.personName}</div>
        <div style={{ fontFamily: bodyFont, fontSize: 11, color: text, opacity: .7, marginBottom: 14 }}>{fields.personTitle}</div>
      </div>
      <div style={{ borderTop: `1px solid ${neutral}40`, paddingTop: 12 }}>
        <div style={{ fontFamily: bodyFont, fontSize: 9, color: text, opacity: .6, lineHeight: 1.8 }}>
          {fields.email}<br />
          {fields.phone}<br />
          www.{fields.companyName.toLowerCase().replace(/\s+/g, '')}.com
        </div>
      </div>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 48, height: '100%', background: hero }} />
    </div>
  );
}

// ─── Social Post ────────────────────────────────────────────────────────────
function SocialPostMockup({ palette, headingFont, bodyFont, fields }) {
  const { hero, accent } = palette;
  return (
    <div style={{ width: '100%', aspectRatio: '1/1', background: hero, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 28px', position: 'relative', maxHeight: 380, borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }}>
      <div style={{ fontFamily: headingFont, fontSize: 28, color: textOn(hero), textAlign: 'center', fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>
        {fields.tagline}
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 12, color: textOn(hero), textAlign: 'center', opacity: .85, marginBottom: 20, lineHeight: 1.6, maxWidth: 260 }}>
        Something exciting is coming. Stay tuned for updates and be the first to know.
      </div>
      <div style={{ background: accent, color: textOn(accent), fontFamily: bodyFont, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 24px', borderRadius: 'var(--ps-radius-md)', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
        Learn More
      </div>
      <div style={{ position: 'absolute', bottom: 16, fontFamily: bodyFont, fontSize: 9, color: textOn(hero), opacity: .5 }}>
        @{fields.companyName.toLowerCase().replace(/\s+/g, '')}
      </div>
    </div>
  );
}

// ─── Website Hero ───────────────────────────────────────────────────────────
function WebsiteHeroMockup({ palette, headingFont, bodyFont, fields }) {
  const { hero, accent, background: bg, text, neutral } = palette;
  return (
    <div style={{ background: bg, minHeight: 280, borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }}>
      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: `1px solid ${neutral}30` }}>
        <div style={{ fontFamily: headingFont, fontSize: 14, color: text, fontWeight: 600 }}>{fields.companyName}</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {['About', 'Services', 'Contact'].map(item => (
            <span key={item} style={{ fontFamily: bodyFont, fontSize: 10, color: text, opacity: .6, cursor: 'default' }}>{item}</span>
          ))}
          <span style={{ fontFamily: bodyFont, fontSize: 9, color: textOn(accent), background: accent, padding: '4px 12px', borderRadius: 'var(--ps-radius-sm)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Get Started
          </span>
        </div>
      </div>
      {/* Hero section */}
      <div style={{ padding: '40px 24px 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: headingFont, fontSize: 28, color: text, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
          {fields.tagline}
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: text, opacity: .65, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 20px' }}>
          We help brands stand out with thoughtful design and strategic thinking. Let us bring your vision to life.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <div style={{ background: hero, color: textOn(hero), fontFamily: bodyFont, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 22px', borderRadius: 'var(--ps-radius-md)', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
            Get Started
          </div>
          <div style={{ background: 'transparent', color: text, fontFamily: bodyFont, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 22px', borderRadius: 'var(--ps-radius-md)', border: `1px solid ${neutral}` }}>
            Learn More
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Email Signature ────────────────────────────────────────────────────────
function EmailSignatureMockup({ palette, headingFont, bodyFont, fields }) {
  const { hero, accent, background: bg, text } = palette;
  const initial = fields.personName.trim().charAt(0).toUpperCase() || 'J';
  return (
    <div style={{ padding: '24px 28px', background: bg, borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: hero, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
          <span style={{ fontFamily: headingFont, fontSize: 22, color: textOn(hero), fontWeight: 600 }}>{initial}</span>
        </div>
        <div>
          <div style={{ fontFamily: headingFont, fontSize: 16, color: text, fontWeight: 600, marginBottom: 2 }}>{fields.personName}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 10, color: accent, marginBottom: 8 }}>{fields.personTitle} at {fields.companyName}</div>
          <div style={{ width: 32, height: 2, background: hero, borderRadius: 1, marginBottom: 8 }} />
          <div style={{ fontFamily: bodyFont, fontSize: 9, color: text, opacity: .6, lineHeight: 1.8 }}>
            {fields.phone} · {fields.email}
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 9, color: text, opacity: .5, marginTop: 2 }}>
            www.{fields.companyName.toLowerCase().replace(/\s+/g, '')}.com
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice ────────────────────────────────────────────────────────────────
function InvoiceMockup({ palette, headingFont, bodyFont, fields }) {
  const { hero, accent, background: bg, text, neutral } = palette;
  const items = [
    ['Brand Strategy Workshop', '2', '$950.00', '$1,900.00'],
    ['Logo Design Package', '1', '$2,400.00', '$2,400.00'],
    ['Brand Guidelines Document', '1', '$800.00', '$800.00'],
  ];
  return (
    <div style={{ background: bg, padding: '24px 28px', borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: headingFont, fontSize: 18, color: text, fontWeight: 600 }}>INVOICE</div>
          <div style={{ fontFamily: bodyFont, fontSize: 9, color: text, opacity: .5, marginTop: 4 }}>#INV-2024-0042</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: headingFont, fontSize: 12, color: hero, fontWeight: 600 }}>{fields.companyName}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 9, color: text, opacity: .5, lineHeight: 1.6 }}>123 Design Street<br />New York, NY 10001</div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${neutral}40`, marginBottom: 12 }} />
      <div style={{ marginBottom: 12 }}>
        {items.map(([desc, qty, rate, total], idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${neutral}20`, fontFamily: bodyFont, fontSize: 10, color: text }}>
            <span style={{ flex: 2 }}>{desc}</span>
            <span style={{ flex: .5, textAlign: 'center', opacity: .6 }}>{qty}</span>
            <span style={{ flex: 1, textAlign: 'right', opacity: .6 }}>{rate}</span>
            <span style={{ flex: 1, textAlign: 'right', fontWeight: 500 }}>{total}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20, padding: '10px 0' }}>
        <span style={{ fontFamily: bodyFont, fontSize: 11, color: text, opacity: .6 }}>Total Due</span>
        <span style={{ fontFamily: headingFont, fontSize: 20, color: hero, fontWeight: 700 }}>$5,100.00</span>
      </div>
      <div style={{ marginTop: 12, padding: '8px 14px', background: `${accent}15`, borderRadius: 'var(--ps-radius-md)', fontFamily: bodyFont, fontSize: 9, color: accent, textAlign: 'center' }}>
        Payment due within 30 days · Thank you for your business
      </div>
    </div>
  );
}

// ─── Letterhead ─────────────────────────────────────────────────────────────
function LetterheadMockup({ palette, headingFont, bodyFont, fields }) {
  const { hero, accent, background: bg, text, neutral } = palette;
  const domain = fields.companyName.toLowerCase().replace(/\s+/g, '');
  return (
    <div style={{ background: bg, padding: '28px 32px', minHeight: 320, display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 5, background: `linear-gradient(90deg, ${hero}, ${accent})`, borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingTop: 8 }}>
        <div style={{ fontFamily: headingFont, fontSize: 16, color: text, fontWeight: 600 }}>{fields.companyName}</div>
        <div style={{ fontFamily: bodyFont, fontSize: 8, color: text, opacity: .5, textAlign: 'right', lineHeight: 1.6 }}>
          123 Design Street · New York, NY 10001<br />{fields.email} · {fields.phone}
        </div>
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 10, color: text, opacity: .6, marginBottom: 8 }}>April 1, 2026</div>
      <div style={{ fontFamily: bodyFont, fontSize: 10, color: text, opacity: .6, marginBottom: 16 }}>Dear Valued Client,</div>
      <div style={{ fontFamily: bodyFont, fontSize: 10, color: text, opacity: .7, lineHeight: 1.85, marginBottom: 20, flex: 1 }}>
        Thank you for choosing {fields.companyName}. We are thrilled to partner with you on this
        exciting project. Our team is committed to delivering exceptional results that
        exceed your expectations and elevate your brand presence.
      </div>
      <div style={{ borderTop: `1px solid ${neutral}30`, paddingTop: 14, marginTop: 'auto' }}>
        <div style={{ fontFamily: headingFont, fontSize: 11, color: hero, fontWeight: 600, marginBottom: 2 }}>{fields.personName}</div>
        <div style={{ fontFamily: bodyFont, fontSize: 9, color: text, opacity: .5 }}>{fields.personTitle}</div>
      </div>
    </div>
  );
}

// ─── Defaults ───────────────────────────────────────────────────────────────
const FIELD_DEFAULTS = {
  companyName: 'YourBrand',
  tagline:     'Build Something Beautiful',
  personName:  'Jane Doe',
  personTitle: 'Creative Director',
  email:       'hello@yourbrand.com',
  phone:       '+1 (555) 123-4567',
};

// ─── Main tab ───────────────────────────────────────────────────────────────
export default function EditMockupsTab({ colors, roles, selectedFont, onNavigate }) {
  const [companyName, setCompanyName] = useState(FIELD_DEFAULTS.companyName);
  const [tagline, setTagline]         = useState(FIELD_DEFAULTS.tagline);
  const [personName, setPersonName]   = useState(FIELD_DEFAULTS.personName);
  const [personTitle, setPersonTitle] = useState(FIELD_DEFAULTS.personTitle);
  const [email, setEmail]             = useState(FIELD_DEFAULTS.email);
  const [phone, setPhone]             = useState(FIELD_DEFAULTS.phone);

  const palette    = buildPalette(colors, roles);
  const ready      = hasMinimumRoles(roles);
  const activePair = selectedFont || FONT_PAIRS[0];
  const headingFont = activePair.heading;
  const bodyFont    = activePair.body;

  const fields = { companyName, tagline, personName, personTitle, email, phone };

  const resetFields = () => {
    setCompanyName(FIELD_DEFAULTS.companyName);
    setTagline(FIELD_DEFAULTS.tagline);
    setPersonName(FIELD_DEFAULTS.personName);
    setPersonTitle(FIELD_DEFAULTS.personTitle);
    setEmail(FIELD_DEFAULTS.email);
    setPhone(FIELD_DEFAULTS.phone);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Intro card */}
      <div className="card">
        <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-lg)', fontWeight: 700, color: 'var(--ps-text-primary)', marginBottom: 8 }}>
          Edit Mockups
        </div>
        <p style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', color: 'var(--ps-text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
          Customise the content in each mockup to see how your palette looks with real brand details. Edit the fields below and every template updates live.
          {selectedFont && (
            <span style={{ color: 'var(--ps-accent)' }}>
              {' '}Using <strong>{selectedFont.name}</strong> font pair.
            </span>
          )}
        </p>
        <p style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
          These are design previews, not production templates. They help you feel confident your colours work with real content.
        </p>
      </div>

      {/* Editable fields card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', fontWeight: 700, color: 'var(--ps-text-primary)' }}>
            Editable Fields
          </div>
          <button
            onClick={resetFields}
            style={{ background: 'none', border: 'none', fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-accent)', cursor: 'pointer', padding: 0, textDecoration: 'underline', letterSpacing: '.02em' }}
          >
            Reset to defaults
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <FieldInput label="Company Name" value={companyName} onChange={setCompanyName} />
          <FieldInput label="Tagline" value={tagline} onChange={setTagline} />
          <FieldInput label="Person Name" value={personName} onChange={setPersonName} />
          <FieldInput label="Title / Role" value={personTitle} onChange={setPersonTitle} />
          <FieldInput label="Email" value={email} onChange={setEmail} />
          <FieldInput label="Phone" value={phone} onChange={setPhone} />
        </div>
      </div>

      {/* Mockup grid or incomplete state */}
      {ready ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
          <TemplateCard
            title="Business Card"
            description="Background uses bg, stripe uses hero, text uses text, divider uses neutral."
          >
            <BusinessCardMockup palette={palette} headingFont={headingFont} bodyFont={bodyFont} fields={fields} />
          </TemplateCard>

          <TemplateCard
            title="Social Post"
            description="Instagram square format. Background uses hero, CTA button uses accent."
          >
            <SocialPostMockup palette={palette} headingFont={headingFont} bodyFont={bodyFont} fields={fields} />
          </TemplateCard>

          <TemplateCard
            title="Website Hero"
            description="Nav bar + hero section. Primary CTA uses hero, secondary uses neutral border, nav CTA uses accent."
          >
            <WebsiteHeroMockup palette={palette} headingFont={headingFont} bodyFont={bodyFont} fields={fields} />
          </TemplateCard>

          <TemplateCard
            title="Email Signature"
            description="Avatar uses hero, title uses accent, text on bg background."
          >
            <EmailSignatureMockup palette={palette} headingFont={headingFont} bodyFont={bodyFont} fields={fields} />
          </TemplateCard>

          <TemplateCard
            title="Invoice"
            description="Header and totals use hero, line dividers use neutral, payment note uses accent."
          >
            <InvoiceMockup palette={palette} headingFont={headingFont} bodyFont={bodyFont} fields={fields} />
          </TemplateCard>

          <TemplateCard
            title="Letterhead"
            description="Top gradient uses hero to accent, body on bg, signature in hero colour."
          >
            <LetterheadMockup palette={palette} headingFont={headingFont} bodyFont={bodyFont} fields={fields} />
          </TemplateCard>
        </div>
      ) : (
        <IncompleteCard onNavigate={onNavigate} />
      )}
    </div>
  );
}
