import { textOn } from '../../utils/colourMath';

/**
 * Social media post mockup — 1:1 square, 360×360px.
 * All colours sourced exclusively from the pre-computed `palette` object.
 */
export default function SocialPost({ palette }) {
  const { hero, accent, neutral, background, text } = palette;

  const dotColor   = textOn(hero);

  return (
    <div
      style={{
        width:          360,
        height:         360,
        background:     background,
        borderRadius:   8,
        overflow:       'hidden',
        position:       'relative',
        fontFamily:     "'DM Mono','Courier New',monospace",
        flexShrink:     0,
      }}
    >
      {/* ── Decorative circle (subtle tint) ─────────────────────────── */}
      <div
        style={{
          position:     'absolute',
          width:        280,
          height:       280,
          borderRadius: '50%',
          background:   hero + '14',   // 8% opacity
          top:          '50%',
          left:         '50%',
          transform:    'translate(-50%, -50%)',
          zIndex:       0,
        }}
      />

      {/* ── Main content (above circle) ──────────────────────────────── */}
      <div
        style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          zIndex:         1,
          padding:        '0 32px',
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width:        40,
            height:       3,
            background:   accent,
            borderRadius: 2,
            marginBottom: 16,
          }}
        />

        {/* Brand name */}
        <div
          style={{
            fontFamily:  "'Playfair Display',serif",
            fontSize:    28,
            color:       text,
            textAlign:   'center',
            lineHeight:  1.15,
          }}
        >
          Your Brand
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize:    10,
            color:       text + 'a6',   // 65% opacity
            textAlign:   'center',
            marginTop:   8,
            maxWidth:    240,
            lineHeight:  1.6,
            letterSpacing: '.04em',
          }}
        >
          A single line that captures what you do.
        </div>

        {/* Thin divider */}
        <div
          style={{
            width:        60,
            height:       1,
            background:   neutral + '40',  // 25% opacity
            margin:       '20px auto',
          }}
        />

        {/* CTA label */}
        <div
          style={{
            fontSize:    9,
            color:       accent,
            letterSpacing: '.1em',
            fontWeight:  700,
          }}
        >
          Learn more →
        </div>
      </div>

      {/* ── Bottom strip ─────────────────────────────────────────────── */}
      <div
        style={{
          position:       'absolute',
          bottom:         0,
          left:           0,
          right:          0,
          height:         40,
          background:     hero,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            8,
          zIndex:         2,
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width:        6,
              height:       6,
              borderRadius: '50%',
              background:   dotColor + '99',  // 60% opacity
            }}
          />
        ))}
      </div>
    </div>
  );
}
