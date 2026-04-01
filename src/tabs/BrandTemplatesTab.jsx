import { hexToRgb, rgbToHsl, luminance, textOn } from '../utils/colourMath';
import { FONT_PAIRS } from '../constants';

// ─── Derive colours from roles or best-guess from palette ────────────────────
function derivePalette(colors, roles) {
  const data = colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    return { hex, ...rgbToHsl(r, g, b), lum: luminance(r, g, b) };
  });

  const byRole = {};
  Object.entries(roles).forEach(([hex, role]) => { byRole[role] = hex; });

  const bg = byRole['Background'] ||
    (data.length ? data.reduce((b, c) => (c.l > b.l ? c : b), data[0]).hex : '#f5f2ed');
  const hero = byRole['Hero'] ||
    (data.length ? data.reduce((b, c) => (c.s > b.s ? c : b), data[0]).hex : '#6b7280');

  let accent = byRole['Accent'];
  if (!accent) {
    const candidates = data.filter(c => c.hex !== hero);
    accent = candidates.length
      ? candidates.reduce((b, c) => (c.s > b.s ? c : b), candidates[0]).hex
      : '#2a7a7a';
  }

  const text = byRole['Text'] ||
    (data.length ? data.reduce((b, c) => (c.l < b.l ? c : b), data[0]).hex : '#1a1a2e');

  let neutral = byRole['Neutral'];
  if (!neutral) {
    const candidates = data.filter(c => c.hex !== bg && c.hex !== hero && c.hex !== text);
    neutral = candidates.length
      ? candidates.reduce((b, c) => {
          const sc = Math.abs(c.l - 50) + (100 - c.s);
          const sb = Math.abs(b.l - 50) + (100 - b.s);
          return sc < sb ? c : b;
        }, candidates[0]).hex
      : '#888888';
  }

  return { bg, hero, accent, text, neutral };
}

// ─── Template sub-components ─────────────────────────────────────────────────
function BusinessCard({ p, headingFont, bodyFont }) {
  return (
    <div
      style={{
        padding:       '28px 32px',
        background:    p.bg,
        display:       'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight:     200,
        position:      'relative',
        borderRadius:  'var(--ps-radius-lg) var(--ps-radius-lg) 0 0',
      }}
    >
      <div style={{ width: 36, height: 4, background: p.hero, borderRadius: 2, marginBottom: 16 }} />
      <div>
        <div style={{ fontFamily: headingFont, fontSize: 20, color: p.text, marginBottom: 4, fontWeight: 600 }}>Jane Doe</div>
        <div style={{ fontFamily: bodyFont, fontSize: 11, color: p.text, opacity: .7, marginBottom: 14 }}>Creative Director</div>
      </div>
      <div style={{ borderTop: `1px solid ${p.neutral}40`, paddingTop: 12 }}>
        <div style={{ fontFamily: bodyFont, fontSize: 9, color: p.text, opacity: .6, lineHeight: 1.8 }}>
          hello@yourbrand.com<br />
          +1 (555) 123-4567<br />
          www.yourbrand.com
        </div>
      </div>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 48, height: '100%', background: p.hero }} />
    </div>
  );
}

function SocialPost({ p, headingFont, bodyFont }) {
  return (
    <div
      style={{
        width:          '100%',
        aspectRatio:    '1/1',
        background:     p.hero,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '32px 28px',
        position:       'relative',
        maxHeight:      380,
        borderRadius:   'var(--ps-radius-lg) var(--ps-radius-lg) 0 0',
      }}
    >
      <div style={{ fontFamily: headingFont, fontSize: 28, color: textOn(p.hero), textAlign: 'center', fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>
        Big Announcement
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 12, color: textOn(p.hero), textAlign: 'center', opacity: .85, marginBottom: 20, lineHeight: 1.6, maxWidth: 260 }}>
        Something exciting is coming. Stay tuned for updates and be the first to know.
      </div>
      <div style={{ background: p.accent, color: textOn(p.accent), fontFamily: bodyFont, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 24px', borderRadius: 'var(--ps-radius-md)', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
        Learn More
      </div>
      <div style={{ position: 'absolute', bottom: 16, fontFamily: bodyFont, fontSize: 9, color: textOn(p.hero), opacity: .5 }}>
        @yourbrand
      </div>
    </div>
  );
}

function WebsiteHero({ p, headingFont, bodyFont }) {
  return (
    <div style={{ background: p.bg, minHeight: 280, borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }}>
      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: `1px solid ${p.neutral}30` }}>
        <div style={{ fontFamily: headingFont, fontSize: 14, color: p.text, fontWeight: 600 }}>YourBrand</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {['About', 'Services', 'Contact'].map(item => (
            <span key={item} style={{ fontFamily: bodyFont, fontSize: 10, color: p.text, opacity: .6, cursor: 'default' }}>{item}</span>
          ))}
          <span style={{ fontFamily: bodyFont, fontSize: 9, color: textOn(p.accent), background: p.accent, padding: '4px 12px', borderRadius: 'var(--ps-radius-sm)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Get Started
          </span>
        </div>
      </div>
      {/* Hero section */}
      <div style={{ padding: '40px 24px 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: headingFont, fontSize: 28, color: p.text, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
          Build Something Beautiful
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: p.text, opacity: .65, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 20px' }}>
          We help brands stand out with thoughtful design and strategic thinking. Let us bring your vision to life.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <div style={{ background: p.hero, color: textOn(p.hero), fontFamily: bodyFont, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 22px', borderRadius: 'var(--ps-radius-md)', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
            Get Started
          </div>
          <div style={{ background: 'transparent', color: p.text, fontFamily: bodyFont, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 22px', borderRadius: 'var(--ps-radius-md)', border: `1px solid ${p.neutral}` }}>
            Learn More
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailSignature({ p, headingFont, bodyFont }) {
  return (
    <div style={{ padding: '24px 28px', background: p.bg, borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: p.hero, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
          <span style={{ fontFamily: headingFont, fontSize: 22, color: textOn(p.hero), fontWeight: 600 }}>J</span>
        </div>
        <div>
          <div style={{ fontFamily: headingFont, fontSize: 16, color: p.text, fontWeight: 600, marginBottom: 2 }}>Jane Doe</div>
          <div style={{ fontFamily: bodyFont, fontSize: 10, color: p.accent, marginBottom: 8 }}>Creative Director at YourBrand</div>
          <div style={{ width: 32, height: 2, background: p.hero, borderRadius: 1, marginBottom: 8 }} />
          <div style={{ fontFamily: bodyFont, fontSize: 9, color: p.text, opacity: .6, lineHeight: 1.8 }}>
            +1 (555) 123-4567 · hello@yourbrand.com
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 9, color: p.text, opacity: .5, marginTop: 2 }}>
            www.yourbrand.com
          </div>
        </div>
      </div>
    </div>
  );
}

function Invoice({ p, headingFont, bodyFont }) {
  const items = [
    ['Brand Strategy Workshop', '2', '$950.00', '$1,900.00'],
    ['Logo Design Package', '1', '$2,400.00', '$2,400.00'],
    ['Brand Guidelines Document', '1', '$800.00', '$800.00'],
  ];
  return (
    <div style={{ background: p.bg, padding: '24px 28px', borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: headingFont, fontSize: 18, color: p.text, fontWeight: 600 }}>INVOICE</div>
          <div style={{ fontFamily: bodyFont, fontSize: 9, color: p.text, opacity: .5, marginTop: 4 }}>#INV-2024-0042</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: headingFont, fontSize: 12, color: p.hero, fontWeight: 600 }}>YourBrand</div>
          <div style={{ fontFamily: bodyFont, fontSize: 9, color: p.text, opacity: .5, lineHeight: 1.6 }}>123 Design Street<br />New York, NY 10001</div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${p.neutral}40`, marginBottom: 12 }} />
      <div style={{ marginBottom: 12 }}>
        {items.map(([desc, qty, rate, total], idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${p.neutral}20`, fontFamily: bodyFont, fontSize: 10, color: p.text }}>
            <span style={{ flex: 2 }}>{desc}</span>
            <span style={{ flex: .5, textAlign: 'center', opacity: .6 }}>{qty}</span>
            <span style={{ flex: 1, textAlign: 'right', opacity: .6 }}>{rate}</span>
            <span style={{ flex: 1, textAlign: 'right', fontWeight: 500 }}>{total}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20, padding: '10px 0' }}>
        <span style={{ fontFamily: bodyFont, fontSize: 11, color: p.text, opacity: .6 }}>Total Due</span>
        <span style={{ fontFamily: headingFont, fontSize: 20, color: p.hero, fontWeight: 700 }}>$5,100.00</span>
      </div>
      <div style={{ marginTop: 12, padding: '8px 14px', background: `${p.accent}15`, borderRadius: 'var(--ps-radius-md)', fontFamily: bodyFont, fontSize: 9, color: p.accent, textAlign: 'center' }}>
        Payment due within 30 days · Thank you for your business
      </div>
    </div>
  );
}

function Letterhead({ p, headingFont, bodyFont }) {
  return (
    <div style={{ background: p.bg, padding: '28px 32px', minHeight: 320, display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 5, background: `linear-gradient(90deg, ${p.hero}, ${p.accent})`, borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingTop: 8 }}>
        <div style={{ fontFamily: headingFont, fontSize: 16, color: p.text, fontWeight: 600 }}>YourBrand</div>
        <div style={{ fontFamily: bodyFont, fontSize: 8, color: p.text, opacity: .5, textAlign: 'right', lineHeight: 1.6 }}>
          123 Design Street · New York, NY 10001<br />hello@yourbrand.com · (555) 123-4567
        </div>
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 10, color: p.text, opacity: .6, marginBottom: 8 }}>April 1, 2026</div>
      <div style={{ fontFamily: bodyFont, fontSize: 10, color: p.text, opacity: .6, marginBottom: 16 }}>Dear Valued Client,</div>
      <div style={{ fontFamily: bodyFont, fontSize: 10, color: p.text, opacity: .7, lineHeight: 1.85, marginBottom: 20, flex: 1 }}>
        Thank you for choosing YourBrand. We are thrilled to partner with you on this
        exciting project. Our team is committed to delivering exceptional results that
        exceed your expectations and elevate your brand presence.
      </div>
      <div style={{ borderTop: `1px solid ${p.neutral}30`, paddingTop: 14, marginTop: 'auto' }}>
        <div style={{ fontFamily: headingFont, fontSize: 11, color: p.hero, fontWeight: 600, marginBottom: 2 }}>Jane Doe</div>
        <div style={{ fontFamily: bodyFont, fontSize: 9, color: p.text, opacity: .5 }}>Creative Director</div>
      </div>
    </div>
  );
}

// ─── Template wrapper ────────────────────────────────────────────────────────
function TemplateCard({ title, description, children }) {
  return (
    <div
      style={{
        background:   'var(--ps-bg-surface)',
        border:       '1px solid var(--ps-border)',
        borderRadius: 'var(--ps-radius-lg)',
        overflow:     'hidden',
      }}
    >
      {children}
      <div
        style={{
          padding:    '14px 18px',
          borderTop:  '1px solid var(--ps-border)',
          fontFamily: 'var(--ps-font-ui)',
          fontSize:   'var(--ps-text-xs)',
          color:      'var(--ps-text-tertiary)',
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: 'var(--ps-text-secondary)' }}>{title}</strong> — {description}
      </div>
    </div>
  );
}

// ─── Main tab ────────────────────────────────────────────────────────────────
export default function BrandTemplatesTab({ colors, roles, selectedFont, onNavigate }) {
  const activePair = selectedFont || FONT_PAIRS[0];
  const headingFont = activePair.heading;
  const bodyFont = activePair.body;
  const rolesAssigned = Object.keys(roles).length >= 2;
  const p = derivePalette(colors, roles);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
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
          Brand Templates
        </div>
        <p
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-sm)',
            color:      'var(--ps-text-secondary)',
            lineHeight: 1.6,
            margin:     0,
          }}
        >
          Live mockups using your palette colours and selected typography.
          Change colours, fix issues, reassign roles, or switch fonts — everything updates instantly.
          {selectedFont && (
            <span style={{ color: 'var(--ps-accent)' }}>
              {' '}Using <strong>{selectedFont.name}</strong> font pair.
            </span>
          )}
        </p>
      </div>

      {/* Tip banner when roles aren't assigned */}
      {!rolesAssigned && (
        <div
          style={{
            padding:      '12px 16px',
            background:   'var(--ps-warning-bg, #fff8e0)',
            border:       '1px solid var(--ps-warning-border, #f0c060)',
            borderRadius: 'var(--ps-radius-lg)',
            fontFamily:   'var(--ps-font-ui)',
            fontSize:     'var(--ps-text-sm)',
            color:        'var(--ps-warning-text, #8a5000)',
            lineHeight:   1.6,
            display:      'flex',
            alignItems:   'center',
            gap:          10,
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <span>
            <strong>Tip:</strong> Assign colour roles in the{' '}
            <strong
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => onNavigate('roles')}
            >
              Colour Jobs
            </strong>{' '}
            tab for best results. We're using our best guess from your palette for now.
          </span>
        </div>
      )}

      {/* Template grid */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap:                 14,
        }}
      >
        <TemplateCard
          title="Business Card"
          description="Background uses bg, stripe uses hero, text uses text, divider uses neutral."
        >
          <BusinessCard p={p} headingFont={headingFont} bodyFont={bodyFont} />
        </TemplateCard>

        <TemplateCard
          title="Social Post"
          description="Instagram square format. Background uses hero, CTA button uses accent."
        >
          <SocialPost p={p} headingFont={headingFont} bodyFont={bodyFont} />
        </TemplateCard>

        <TemplateCard
          title="Website Hero"
          description="Nav bar + hero section. Primary CTA uses hero, secondary uses neutral border, nav CTA uses accent."
        >
          <WebsiteHero p={p} headingFont={headingFont} bodyFont={bodyFont} />
        </TemplateCard>

        <TemplateCard
          title="Email Signature"
          description="Avatar uses hero, title uses accent, text on bg background."
        >
          <EmailSignature p={p} headingFont={headingFont} bodyFont={bodyFont} />
        </TemplateCard>

        <TemplateCard
          title="Invoice"
          description="Header and totals use hero, line dividers use neutral, payment note uses accent."
        >
          <Invoice p={p} headingFont={headingFont} bodyFont={bodyFont} />
        </TemplateCard>

        <TemplateCard
          title="Letterhead"
          description="Top gradient uses hero to accent, body on bg, signature in hero colour."
        >
          <Letterhead p={p} headingFont={headingFont} bodyFont={bodyFont} />
        </TemplateCard>
      </div>
    </div>
  );
}
