import {
  hexToRgb,
  rgbToHsl,
  hslToHex,
  luminance,
  contrastRatio,
  deltaE,
} from './colourMath';

function buildIssue(type, code, title, plain, brand, fix) {
  return { type, code, title, plain, brand, fix: fix || null };
}

function buildFixedIssue(type, code, title, plain, brand, i, j, fix) {
  return { type, code, title, plain, brand, i, j, fix: fix || null };
}

export function diagnose(colors) {
  if (colors.length < 2) return [];

  const data = colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    return { ...rgbToHsl(r, g, b), hex, lum: luminance(r, g, b) };
  });

  const issues = [];
  const heroIdx = data.reduce((m, c, i) => (c.s > data[m].s ? i : m), 0);

  // ── 1. Vibration hazard ─────────────────────────────────────────────────────
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const ratio = contrastRatio(data[i].hex, data[j].hex);
      const hDiff = Math.min(
        Math.abs(data[i].h - data[j].h),
        360 - Math.abs(data[i].h - data[j].h)
      );
      if (ratio < 1.5 && data[i].s > 75 && data[j].s > 75 && hDiff > 140) {
        const ji = j;
        issues.push(
          buildFixedIssue(
            'critical', 'VIBRATION',
            'These two colours vibrate when placed next to each other',
            'When these colours touch in a design, their edges appear to glow or shimmer. '
              + 'It is uncomfortable to look at for more than a second. This happens when '
              + 'two opposite colours share almost the same brightness level.',
            'Your audience will find designs using these colours together hard to look at, '
              + 'and it signals inexperience to designers and clients.',
            i, j,
            {
              label: 'Fix the brightness difference',
              fn: cols =>
                cols.map((h, idx) => {
                  if (idx !== ji) return h;
                  const { r, g, b } = hexToRgb(h);
                  const hsl = rgbToHsl(r, g, b);
                  return hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 22, 90));
                }),
            }
          )
        );
      }
    }
  }

  // ── 2. No neutral ───────────────────────────────────────────────────────────
  if (!data.some(c => c.s < 15)) {
    issues.push(
      buildIssue(
        'warning', 'NO_NEUTRAL',
        'You are missing a background colour',
        'Every design needs at least one calm, quiet colour that text can sit on and '
          + 'gives the eye a place to rest. Right now all your colours are bold and '
          + 'saturated, which means every element competes for attention at once.',
        'Without a neutral, your website, flyers and social posts will feel overwhelming '
          + 'and hard to read. Customers will feel stressed rather than welcomed.',
        {
          label: 'Add a background colour',
          fn: cols => {
            const neutral = hslToHex(
              data[heroIdx].h,
              Math.min(data[heroIdx].s * 0.08, 6),
              96
            );
            return cols.length < 8 ? [...cols, neutral] : cols;
          },
        }
      )
    );
  }

  // ── 3. No accent ────────────────────────────────────────────────────────────
  if (Math.max(...data.map(c => c.s)) < 30) {
    issues.push(
      buildIssue(
        'warning', 'NO_ACCENT',
        'Nothing stands out as your main brand colour',
        'A strong brand palette has one colour that does the heavy lifting. It appears '
          + 'on your logo, buttons, and key moments. Right now everything is equally muted, '
          + 'so there is no clear star of the show.',
        'When customers visit your website or see your flyer, nothing will draw their '
          + 'eye to the most important element — your call to action or your logo.',
        {
          label: 'Add a standout colour',
          fn: cols => {
            const accent = hslToHex(
              (data[heroIdx].h + 180) % 360,
              Math.min(data[heroIdx].s * 0.85, 72),
              Math.max(data[heroIdx].l * 0.85, 40)
            );
            return cols.length < 8 ? [...cols, accent] : cols;
          },
        }
      )
    );
  }

  // ── 4. Over-saturation ──────────────────────────────────────────────────────
  const overSat = data.filter(c => c.s > 95);
  if (overSat.length) {
    issues.push(
      buildIssue(
        'warning', 'OVER_SAT',
        overSat.length > 1
          ? 'Some colours are too intense — like a neon sign'
          : 'A colour is too intense — like a neon sign',
        'One or more colours are turned up to maximum intensity. On a screen, this '
          + 'creates a glowing edge effect that makes text hard to read and causes eye '
          + 'strain after a few minutes. It also leaves no room for a hover effect on '
          + 'buttons without the colour looking broken.',
        'Overly saturated colours signal inexperience. Toning them down by just 5-10% '
          + 'makes a huge difference in how premium and professional the palette feels.',
        {
          label: 'Tone them down automatically',
          fn: cols =>
            cols.map(hex => {
              const { r, g, b } = hexToRgb(hex);
              const hsl = rgbToHsl(r, g, b);
              return hsl.s > 95 ? hslToHex(hsl.h, 87, hsl.l) : hex;
            }),
        }
      )
    );
  }

  // ── 5. Too many accents / visual overload ───────────────────────────────────
  const vibrants = data.filter(c => c.s > 60);
  if (vibrants.length > 2) {
    issues.push(
      buildIssue(
        'warning', 'VISUAL_OVERLOAD',
        'Too many bright colours are fighting for attention',
        'You have ' + vibrants.length + ' bold, vibrant colours. The rule of thumb '
          + 'for professional design is that your most vivid colour should make up about '
          + '10% of any design — just enough to catch the eye. When everything is vivid, '
          + 'nothing stands out.',
        'Your designs will feel chaotic and hard to navigate. Users will not know where '
          + 'to look first, and they are more likely to ignore your call to action.',
        {
          label: 'Calm the secondary colours',
          fn: cols =>
            cols.map((h, i) => {
              if (i === heroIdx) return h;
              const { r, g, b } = hexToRgb(h);
              const hsl = rgbToHsl(r, g, b);
              return hsl.s > 60 ? hslToHex(hsl.h, Math.min(hsl.s, 52), hsl.l) : h;
            }),
        }
      )
    );
  }

  // ── 6. Corporate grey syndrome ──────────────────────────────────────────────
  const midZone = data.filter(c => c.l >= 40 && c.l <= 60).length;
  if (midZone / data.length >= 0.7 && data.length >= 3) {
    issues.push(
      buildIssue(
        'warning', 'CORPORATE_GREY',
        'Everything is a similar brightness — the palette looks flat',
        'A good palette needs some light colours for backgrounds and cards and some dark '
          + 'colours for text and depth. Right now all your colours sit in the middle — '
          + 'not light enough to be a background, not dark enough for text. The result is '
          + 'a palette that feels lifeless.',
        'Designs made with this palette will look like generic stock templates. Adding '
          + 'proper light and dark tones instantly makes everything feel more considered '
          + 'and professional.',
        {
          label: 'Add light and dark tones',
          fn: cols => {
            const next = [...cols];
            if (next.length < 8) next.push(hslToHex(data[heroIdx].h, 6, 95));
            if (next.length < 8) next.push(hslToHex(data[heroIdx].h, 10, 9));
            return next;
          },
        }
      )
    );
  }

  // ── 7. Dissonant neutrals ───────────────────────────────────────────────────
  const neutrals = data.filter(c => c.s < 10);
  if (neutrals.length >= 2) {
    const maxDiff = neutrals.reduce(
      (mx, n1) =>
        Math.max(
          mx,
          neutrals.reduce(
            (m, n2) =>
              Math.max(
                m,
                Math.min(Math.abs(n1.h - n2.h), 360 - Math.abs(n1.h - n2.h))
              ),
            0
          )
        ),
      0
    );
    if (maxDiff > 90) {
      issues.push(
        buildIssue(
          'warning', 'DISSONANT_NEUTRAL',
          'Your neutral/grey colours do not belong to the same family',
          'Some of your neutral colours feel warm (like cream or warm grey) while others '
            + 'feel cool (like blue-grey or silver). Mixing them makes designs feel slightly '
            + 'off — even people who cannot explain why will sense that something does not '
            + 'look right.',
          'Your brand will feel inconsistent and unpolished, as though different designers '
            + 'made different parts of it. Harmonising your neutrals gives everything a '
            + 'unified feel.',
          {
            label: 'Harmonise all neutrals',
            fn: cols =>
              cols.map(hex => {
                const { r, g, b } = hexToRgb(hex);
                const hsl = rgbToHsl(r, g, b);
                if (hsl.s >= 10) return hex;
                return hslToHex(data[heroIdx].h, Math.min(hsl.s, 8), hsl.l);
              }),
          }
        )
      );
    }
  }

  // ── 8. Delta E duplicates ───────────────────────────────────────────────────
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const dE = deltaE(colors[i], colors[j]);
      const ji = j;
      if (dE < 2) {
        issues.push(
          buildFixedIssue(
            'warning', 'DUPLICATE',
            'Colours ' + (i + 1) + ' and ' + (j + 1) + ' are virtually identical',
            'These two colours are so close that the human eye cannot reliably tell them '
              + 'apart. One of them is taking up space in your palette without adding '
              + 'anything new — it is invisible duplication.',
            'Having duplicate colours makes your brand system confusing to use and harder '
              + 'to maintain consistently across different materials.',
            i, j,
            {
              label: 'Remove colour ' + (j + 1),
              fn: cols => cols.filter((_, idx) => idx !== ji),
            }
          )
        );
      } else if (dE < 5) {
        issues.push(
          buildFixedIssue(
            'info', 'TOO_SIMILAR',
            'Colours ' + (i + 1) + ' and ' + (j + 1) + ' are very similar',
            'These colours are different enough to tell apart side by side, but close '
              + 'enough that they could be confused on smaller screens, in print, or by '
              + 'people with slightly reduced colour vision.',
            'Using these as separate brand colours may not give you the variety you '
              + 'are hoping for.',
            i, j,
            null
          )
        );
      }
    }
  }

  // ── 9. Narrow lightness range ───────────────────────────────────────────────
  const lVals = data.map(c => c.l);
  if (Math.max(...lVals) - Math.min(...lVals) < 22) {
    issues.push(
      buildIssue(
        'warning', 'NARROW_L',
        'No light or dark tones — text will be hard to read',
        'For text to be comfortably readable, there needs to be a clear difference in '
          + 'brightness between the text and what is behind it. Right now your colours are '
          + 'all similar in brightness, which means nothing will be clearly legible when '
          + 'combined.',
        'Any design made with this palette will struggle with readability, especially on '
          + 'websites and printed materials. Customers will squint, give up, or miss your '
          + 'message entirely.',
        {
          label: 'Add light and dark tones',
          fn: cols => {
            const next = [...cols];
            if (next.length < 8) next.push(hslToHex(data[heroIdx].h, 6, 94));
            if (next.length < 8) next.push(hslToHex(data[heroIdx].h, 10, 9));
            return next;
          },
        }
      )
    );
  }

  // ── 10. Too many colours ────────────────────────────────────────────────────
  if (colors.length > 6) {
    issues.push(
      buildIssue(
        'info', 'TOO_MANY',
        'Your palette has more colours than most brands use',
        'Most successful brand palettes use 3 to 5 colours. More than that makes it '
          + 'harder to apply consistently — different materials end up looking like they '
          + 'belong to different brands.',
        'Streamline your palette and your brand will feel more intentional, more '
          + 'memorable, and easier to apply across everything from social media to '
          + 'business cards.',
        null
      )
    );
  }

  // ── 11. Pure black / white ──────────────────────────────────────────────────
  if (colors.some(h => ['#000000', '#ffffff'].includes(h.toLowerCase()))) {
    issues.push(
      buildIssue(
        'info', 'PURE_BW',
        'Pure black or white can cause eye strain',
        'Reading pure black text on a pure white background for extended periods is '
          + 'tiring for the eyes — there is too much contrast. A very dark grey and a '
          + 'soft off-white look almost identical but are noticeably more comfortable.',
        'Slightly tinting your neutrals also makes the palette feel warmer and more '
          + 'considered — a detail that separates amateur palettes from professional ones.',
        {
          label: 'Soften the extremes',
          fn: cols =>
            cols.map(h => {
              if (h.toLowerCase() === '#000000') return '#1a1a2e';
              if (h.toLowerCase() === '#ffffff') return '#f8f6f2';
              return h;
            }),
        }
      )
    );
  }

  // ── 12. Red + green CVD conflict ────────────────────────────────────────────
  const reds   = data.filter(c => (c.h < 20 || c.h > 340) && c.s > 40);
  const greens = data.filter(c => c.h > 80 && c.h < 160 && c.s > 40);
  if (reds.length && greens.length) {
    const lDiff = Math.abs(reds[0].l - greens[0].l);
    const ri = data.indexOf(reds[0]);
    const gi = data.indexOf(greens[0]);
    if (lDiff < 20) {
      issues.push(
        buildFixedIssue(
          'warning', 'CVD_RG',
          'People with colour blindness cannot tell your red and green apart',
          'About 1 in 12 men have difficulty distinguishing red from green. Your red '
            + 'and green are only ' + Math.round(lDiff) + '% different in brightness — '
            + 'not enough for someone with colour blindness to tell them apart as '
            + 'different shades.',
          'If you use these colours to signal yes/no or available/unavailable, a '
            + 'significant portion of your audience will miss it entirely.',
          ri, gi,
          {
            label: 'Adjust brightness to help',
            fn: cols => {
              const heroL = data[ri].l;
              return cols.map((h, idx) => {
                if (idx !== gi) return h;
                const { r, g, b } = hexToRgb(h);
                const hsl = rgbToHsl(r, g, b);
                const newL =
                  heroL > 50
                    ? Math.max(hsl.l - 25, 15)
                    : Math.min(hsl.l + 25, 85);
                return hslToHex(hsl.h, hsl.s, newL);
              });
            },
          }
        )
      );
    } else {
      issues.push(
        buildFixedIssue(
          'info', 'CVD_RG_OK',
          'Red and green present — partially accessible',
          'Your red and green are ' + Math.round(lDiff) + '% different in brightness, '
            + 'which helps. But always remember: never use colour as the only way to '
            + 'convey meaning. Add an icon, label, or pattern alongside the colour.',
          'This is good practice for inclusive design — your brand communicates clearly '
            + 'to everyone.',
          ri, gi,
          null
        )
      );
    }
  }

  // ── 13. No accessible pair ──────────────────────────────────────────────────
  const hasPair = colors.some((h1, i) =>
    colors.slice(i + 1).some(h2 => contrastRatio(h1, h2) >= 4.5)
  );
  if (!hasPair && colors.length >= 2) {
    issues.push(
      buildIssue(
        'warning', 'NO_ACCESS',
        'No colour combination is readable as body text',
        'For text to be comfortable to read on a screen and meet web accessibility '
          + 'standards, the text must contrast sufficiently against its background. '
          + 'Right now, no combination of your colours meets this minimum standard.',
        'A website built with this palette will likely fail accessibility requirements. '
          + 'Beyond legal risk, it simply means some customers genuinely cannot read '
          + 'your content.',
        {
          label: 'Add a readable dark colour',
          fn: cols => {
            const dark = hslToHex(
              data[heroIdx].h,
              data[heroIdx].s * 0.25,
              8
            );
            return cols.length < 8 ? [...cols, dark] : cols;
          },
        }
      )
    );
  }

  return issues;
}

export function healthScore(issues) {
  let score = 100;
  for (const i of issues) {
    if (i.type === 'critical')     score -= 20;
    else if (i.type === 'warning') score -= 12;
    else if (i.type === 'info')    score -= 3;
  }
  return Math.max(0, score);
}
