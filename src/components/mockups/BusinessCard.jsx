import { textOn } from '../../utils/colourMath';

/**
 * Business card mockup — 504×288px (3.5×2in at 2×).
 * All colours sourced exclusively from the pre-computed `palette` object.
 */
export default function BusinessCard({ palette, brandInfo = {} }) {
  const { hero, accent, neutral, background, text } = palette;
  const { companyName = 'Your Brand', personName = 'Your Name', personTitle = 'Brand Designer', email = 'hello@yourbrand.com', phone = '+00 000 000 000' } = brandInfo;

  const heroText  = textOn(hero);
  const logoText  = textOn(accent);

  return (
    <div
      style={{
        width:      504,
        height:     288,
        display:    'flex',
        borderRadius: 8,
        overflow:   'hidden',
        boxShadow:  '0 4px 24px rgba(0,0,0,0.12)',
        fontFamily: "'DM Mono','Courier New',monospace",
        flexShrink: 0,
      }}
    >
      {/* ── Left panel (40%) ──────────────────────────────────────────── */}
      <div
        style={{
          width:           '40%',
          background:      hero,
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          padding:         '24px 20px',
          borderRight:     `2px solid ${heroText}26`, // textOn(hero) at 15% opacity
          flexShrink:      0,
          boxSizing:       'border-box',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width:          36,
            height:         36,
            borderRadius:   8,
            background:     accent,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       12,
            fontWeight:     700,
            color:          logoText,
            letterSpacing:  '.04em',
            flexShrink:     0,
          }}
        >
          {companyName.slice(0, 2).toUpperCase()}
        </div>

        {/* Brand name */}
        <div
          style={{
            fontFamily:  "'Playfair Display',serif",
            fontSize:    13,
            color:       heroText,
            marginTop:   10,
            textAlign:   'center',
            lineHeight:  1.2,
          }}
        >
          {companyName}
        </div>
      </div>

      {/* ── Right panel (60%) ─────────────────────────────────────────── */}
      <div
        style={{
          flex:       1,
          background: background,
          padding:    '24px 20px',
          display:    'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing:  'border-box',
        }}
      >
        {/* Person name */}
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize:   15,
            color:      text,
            lineHeight: 1.2,
          }}
        >
          {personName}
        </div>

        {/* Job title */}
        <div
          style={{
            fontSize:    9,
            color:       text + 'a6',  // 65% opacity
            marginTop:   4,
            letterSpacing: '.06em',
          }}
        >
          {personTitle}
        </div>

        {/* Divider */}
        <div
          style={{
            width:      32,
            height:     1,
            background: neutral + '4d',  // 30% opacity
            margin:     '14px 0',
          }}
        />

        {/* Contact lines */}
        <div
          style={{
            fontSize:    8,
            color:       text + 'b3',  // 70% opacity
            lineHeight:  1.9,
            letterSpacing: '.02em',
          }}
        >
          {email}
          <br />
          www.{companyName.toLowerCase().replace(/\s+/g, '')}.com
          <br />
          {phone}
        </div>
      </div>
    </div>
  );
}
