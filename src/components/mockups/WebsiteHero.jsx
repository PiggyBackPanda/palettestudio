import { textOn } from '../../utils/colourMath';

/**
 * Website hero section mockup.
 * All colours sourced exclusively from the pre-computed `palette` object.
 * No hardcoded brand colours — every value flows through buildPalette().
 */
export default function WebsiteHero({ palette }) {
  const { hero, accent, neutral, background, text } = palette;

  const navText   = textOn(hero);
  const btnText   = textOn(accent);
  const logoText  = textOn(accent);

  return (
    <div
      style={{
        width:        '100%',
        borderRadius: 8,
        overflow:     'hidden',
        fontFamily:   "'DM Mono','Courier New',monospace",
      }}
    >
      {/* ── Navigation bar ───────────────────────────────────────────── */}
      <div
        style={{
          background:     hero,
          height:         52,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 24px',
          flexShrink:     0,
        }}
      >
        {/* Logo + brand name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width:          28,
              height:         28,
              borderRadius:   6,
              background:     accent,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       11,
              fontWeight:     700,
              color:          logoText,
              flexShrink:     0,
              letterSpacing:  '.04em',
            }}
          >
            PS
          </div>
          <span
            style={{
              fontFamily:    "'Playfair Display',serif",
              fontSize:      14,
              color:         navText,
              letterSpacing: '.02em',
            }}
          >
            Palette Studio
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {['About', 'Services', 'Contact'].map(link => (
            <span
              key={link}
              style={{ fontSize: 11, color: navText, opacity: 0.8, letterSpacing: '.06em' }}
            >
              {link}
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero section ──────────────────────────────────────────────── */}
      <div
        style={{
          background: background,
          padding:    '48px 40px 40px',
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize:      8,
            color:         accent,
            letterSpacing: '0.2em',
            marginBottom:  14,
            fontWeight:    700,
          }}
        >
          BRAND COLOUR PREVIEW
        </div>

        {/* Headline */}
        <div
          style={{
            fontFamily:  "'Playfair Display',serif",
            fontSize:    36,
            lineHeight:  1.15,
            color:       text,
            marginBottom: 0,
          }}
        >
          Your brand, looking
          <br />
          its very best.
        </div>

        {/* Sub-heading */}
        <div
          style={{
            fontSize:    11,
            color:       text + 'b3',
            marginTop:   12,
            lineHeight:  1.6,
            letterSpacing: '.02em',
          }}
        >
          This is how your palette performs in a real layout.
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop:  `1px solid ${neutral}33`,
            margin:     '20px 0',
          }}
        />

        {/* Body text placeholder lines */}
        <div
          style={{
            fontSize:    10,
            color:       text + '99',
            lineHeight:  1.8,
            letterSpacing: '.02em',
          }}
        >
          Consistent colour builds recognition and trust across every touchpoint.
          <br />
          A strong palette guides the eye, communicates your values, and sets you apart.
        </div>

        {/* CTA button */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display:        'inline-block',
              background:     accent,
              color:          btnText,
              fontSize:       10,
              fontWeight:     700,
              letterSpacing:  '.12em',
              padding:        '10px 24px',
              borderRadius:   4,
              cursor:         'default',
              textTransform:  'uppercase',
            }}
          >
            Get Started
          </div>
        </div>
      </div>

      {/* ── Footer strip ──────────────────────────────────────────────── */}
      <div
        style={{
          background:     hero + '26',
          height:         32,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize:    9,
            color:       text + '66',
            letterSpacing: '.08em',
          }}
        >
          yourwebsite.com
        </span>
      </div>
    </div>
  );
}
