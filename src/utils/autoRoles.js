import { hexToRgb, rgbToHsl, luminance, contrastRatio } from './colourMath';

export const ROLES = ['Hero', 'Accent', 'Neutral', 'Background', 'Text'];

export const ROLE_COL = {
  Hero:       '#0369a1',
  Accent:     '#2a7a7a',
  Neutral:    '#777',
  Background: '#8a7a6a',
  Text:       '#3a3a5a',
};

export const ROLE_DESC = {
  Hero:       'Your main brand colour — used in the logo and key moments',
  Accent:     'Used sparingly (10%) for buttons and calls-to-action',
  Neutral:    'Borders, dividers, secondary text',
  Background: 'Light base for large surface areas and page backgrounds',
  Text:       'Dark, readable — must contrast well against Background',
};

/**
 * Scores each colour for each role and picks the best non-conflicting assignment.
 * Returns { roles: { hex: roleName }, reasons: { hex: string } }
 */
export function autoAssignRoles(colors) {
  if (colors.length < 2) return { roles: {}, reasons: {} };

  const data = colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    const hsl = rgbToHsl(r, g, b);
    const lum = luminance(r, g, b);
    return { hex, ...hsl, lum };
  });

  const assigned  = {};
  const reasons   = {};
  const usedRoles = new Set();

  const scoreBackground = c =>
    (c.l > 80 ? 40 : c.l > 65 ? 20 : 0) +
    (c.s < 15 ? 30 : c.s < 30 ? 15 : 0) +
    (c.lum > 0.4 ? 20 : 0);

  const scoreText = c =>
    (c.l < 25 ? 40 : c.l < 40 ? 20 : 0) +
    (c.lum < 0.15 ? 30 : c.lum < 0.3 ? 15 : 0) +
    (c.s < 30 ? 20 : 0);

  const scoreHero = c =>
    (c.s > 50 ? 35 : c.s > 30 ? 18 : 0) +
    (c.l > 25 && c.l < 75 ? 30 : 0) +
    (c.s > 70 ? 15 : 0);

  const scoreAccent = c =>
    (c.s > 55 ? 30 : c.s > 35 ? 15 : 0) +
    (c.l > 30 && c.l < 80 ? 25 : 0) +
    (c.lum > 0.05 && c.lum < 0.55 ? 20 : 0);

  const scoreNeutral = c =>
    (c.s >= 8 && c.s < 40 ? 35 : 0) +
    (c.l >= 20 && c.l < 80 ? 25 : 0) +
    (c.s < 55 ? 20 : 0);

  const scoreFns = {
    Background: scoreBackground,
    Text:       scoreText,
    Hero:       scoreHero,
    Accent:     scoreAccent,
    Neutral:    scoreNeutral,
  };

  const roleOrder = ['Background', 'Text', 'Hero', 'Accent', 'Neutral'];

  for (const role of roleOrder) {
    if (colors.length <= Object.keys(assigned).length) break;

    const candidates = data
      .filter(c => !assigned[c.hex])
      .map(c => ({ ...c, score: scoreFns[role](c) }))
      .sort((a, b) => b.score - a.score);

    if (!candidates.length || candidates[0].score < 5) continue;

    // Background + Text must contrast well with each other
    if (role === 'Text') {
      const bgHex = Object.keys(assigned).find(k => assigned[k] === 'Background');
      if (bgHex) {
        const contrasting = candidates.find(c => contrastRatio(c.hex, bgHex) >= 4.5);
        if (contrasting) {
          assigned[contrasting.hex] = role;
          const cr = contrastRatio(contrasting.hex, bgHex).toFixed(1);
          reasons[contrasting.hex] =
            `Darkest colour — ${cr}:1 contrast against your background, which meets the AA readability standard for body text.`;
          usedRoles.add(role);
          continue;
        }
      }
    }

    // Hero and Accent should use different hues
    if (role === 'Accent') {
      const heroHex = Object.keys(assigned).find(k => assigned[k] === 'Hero');
      if (heroHex) {
        const heroHsl = data.find(c => c.hex === heroHex);
        const distinct = candidates.find(c => {
          const hDiff = Math.min(
            Math.abs(c.h - heroHsl.h),
            360 - Math.abs(c.h - heroHsl.h)
          );
          return hDiff > 30;
        });
        if (distinct) {
          assigned[distinct.hex] = role;
          reasons[distinct.hex] =
            'Vivid and distinct from your hero colour — good for buttons and calls-to-action where you need something to stand out.';
          usedRoles.add(role);
          continue;
        }
      }
    }

    const winner = candidates[0];
    assigned[winner.hex] = role;
    usedRoles.add(role);

    if (role === 'Background') {
      reasons[winner.hex] =
        `Lightest colour in your palette (L=${Math.round(winner.l)}%) — ideal as a calm base for page backgrounds and large surface areas.`;
    } else if (role === 'Hero') {
      reasons[winner.hex] =
        `Most vibrant colour (S=${Math.round(winner.s)}%) — this is your signature brand colour. It should appear on your logo and in key brand moments.`;
    } else if (role === 'Neutral') {
      reasons[winner.hex] =
        'Mid-tone, low saturation — a quiet supporting colour for borders, dividers, and secondary text. Keeps things from looking too flat or too loud.';
    } else if (role === 'Text') {
      reasons[winner.hex] =
        'Darkest colour — works as body text when placed on lighter backgrounds. Aim to keep it at 4.5:1 contrast or above for comfortable reading.';
    }
  }

  return { roles: assigned, reasons };
}
