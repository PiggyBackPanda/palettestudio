import { hexToRgb, rgbToHsl, hslToHex } from './colourMath';

/**
 * Generates 6 harmony-based colour suggestions from the existing palette.
 * All relationships are derived from the most saturated (hero) colour.
 */
export function makeSuggestions(colors) {
  if (!colors.length) return [];

  const data = colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    return { ...rgbToHsl(r, g, b), hex };
  });

  const hi = data.reduce((m, c, i) => (c.s > data[m].s ? i : m), 0);
  const hh = data[hi];

  return [
    {
      hex:    hslToHex(hh.h, Math.min(hh.s * 0.08, 6), 96),
      label:  'Light Neutral',
      badge:  'Background',
      reason: 'A calm off-white background tinted toward your brand colour. Use for page backgrounds and large sections.',
    },
    {
      hex:    hslToHex(hh.h, Math.min(hh.s * 0.15, 9), 11),
      label:  'Dark Neutral',
      badge:  'Text colour',
      reason: 'A deep, tinted near-black for body text. Softer than pure black but just as readable.',
    },
    {
      hex:    hslToHex((hh.h + 180) % 360, Math.min(hh.s * 0.8, 72), Math.max(hh.l * 0.85, 38)),
      label:  'Complement',
      badge:  'CTA / Button',
      reason: 'The opposite colour on the wheel — creates maximum contrast. Great for buttons and calls-to-action.',
    },
    {
      hex:    hslToHex((hh.h + 30) % 360, hh.s * 0.8, hh.l),
      label:  'Analogous',
      badge:  'Supporting',
      reason: 'A close neighbour on the colour wheel — harmonious and easy to live with alongside your main colour.',
    },
    {
      hex:    hslToHex((hh.h + 150) % 360, hh.s * 0.65, Math.min(hh.l + 8, 80)),
      label:  'Split Complement',
      badge:  'Accent',
      reason: 'A lively, distinct colour that still feels connected to your palette.',
    },
    {
      hex:    hslToHex(hh.h, hh.s * 0.45, Math.min(hh.l + 28, 90)),
      label:  'Soft Tint',
      badge:  'Hover / Card',
      reason: 'A lighter, quieter version of your main colour — useful for card backgrounds and hover states.',
    },
  ];
}
