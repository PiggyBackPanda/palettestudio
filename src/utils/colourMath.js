// ─── Basic conversions ────────────────────────────────────────────────────────

export function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  };
}

export function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map(x =>
        Math.max(0, Math.min(255, Math.round(x)))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hr = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const [r, g, b] =
    s === 0
      ? [l, l, l]
      : [hr(p, q, h + 1 / 3), hr(p, q, h), hr(p, q, h - 1 / 3)];
  return rgbToHex(r * 255, g * 255, b * 255);
}

// ─── Perceptual colour spaces ─────────────────────────────────────────────────

export function luminance(r, g, b) {
  return [r, g, b].reduce((a, c, i) => {
    c /= 255;
    c = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return a + c * [0.2126, 0.7152, 0.0722][i];
  }, 0);
}

export function rgbToLab(r, g, b) {
  const lin = c => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [lr, lg, lb] = [r, g, b].map(lin);
  let X = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
  let Y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750;
  let Z = lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041;
  X /= 0.95047; Y /= 1.0; Z /= 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return { L: 116 * f(Y) - 16, a: 500 * (f(X) - f(Y)), b: 200 * (f(Y) - f(Z)) };
}

/**
 * Convert sRGB (0–255) to OKLCH.
 * Uses Björn Ottosson's OKLab matrices (2020).
 * Returns { L: 0–1, C: 0–~0.37, H: 0–360 }
 */
export function rgbToOklch(r, g, b) {
  const lin = c => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [lr, lg, lb] = [r, g, b].map(lin);

  // Linear sRGB → LMS
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  // LMS → LMS' (cube root)
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS' → OKLab
  const L  =  0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a  =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bv =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  // OKLab → OKLCH
  const C = Math.sqrt(a * a + bv * bv);
  let H = Math.atan2(bv, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return { L, C, H };
}

/**
 * Convert OKLCH back to sRGB (0–255 each), clamped.
 */
export function oklchToRgb(L, C, H) {
  // OKLCH → OKLab
  const hRad = H * (Math.PI / 180);
  const a  = C * Math.cos(hRad);
  const bv = C * Math.sin(hRad);

  // OKLab → LMS'
  const l_ = L + 0.3963377774 * a + 0.2158037573 * bv;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bv;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * bv;

  // LMS' → LMS
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS → linear sRGB
  const lr =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  // Linear → sRGB gamma
  const toSRGB = c => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255)));
  };
  return { r: toSRGB(lr), g: toSRGB(lg), b: toSRGB(lb) };
}

// ─── Contrast & accessibility ─────────────────────────────────────────────────

export function contrastRatio(h1, h2) {
  const { r: r1, g: g1, b: b1 } = hexToRgb(h1);
  const { r: r2, g: g2, b: b2 } = hexToRgb(h2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Returns the best readable text colour (near-black or near-white) for a given bg. */
export function textOn(hex) {
  const { r, g, b } = hexToRgb(hex);
  return luminance(r, g, b) > 0.35 ? '#1a1a1a' : '#f5f0e8';
}

// ─── Perceptual difference ────────────────────────────────────────────────────

export function deltaE(h1, h2) {
  const { r: r1, g: g1, b: b1 } = hexToRgb(h1);
  const { r: r2, g: g2, b: b2 } = hexToRgb(h2);
  const l1 = rgbToLab(r1, g1, b1);
  const l2 = rgbToLab(r2, g2, b2);
  return Math.sqrt(
    (l1.L - l2.L) ** 2 + (l1.a - l2.a) ** 2 + (l1.b - l2.b) ** 2
  );
}

// ─── Colour temperature ───────────────────────────────────────────────────────

export function tempCategory(h, s) {
  if (s < 10) return { label: 'neutral', col: '#888' };
  if (h >= 330 || h < 60)  return { label: 'warm',        col: '#c05020' };
  if (h >= 60  && h < 90)  return { label: 'warm-green',  col: '#a07020' };
  if (h >= 90  && h < 150) return { label: 'natural',     col: '#608040' };
  if (h >= 150 && h < 270) return { label: 'cool',        col: '#205080' };
  return { label: 'cool-purple', col: '#506090' };
}

// ─── CVD simulation (Vienot et al. LMS matrices) ─────────────────────────────

export function simulateCVD(r, g, b, type) {
  const matrices = {
    protanopia:   [[0.56667, 0.43333, 0],      [0.55833, 0.44167, 0],      [0, 0.24167, 0.75833]],
    deuteranopia: [[0.625,   0.375,   0],      [0.7,     0.3,     0],      [0, 0.3,     0.7]],
    tritanopia:   [[0.95,    0.05,    0],      [0,       0.43333, 0.56667], [0, 0.475,   0.525]],
  };
  const mx = matrices[type];
  return rgbToHex(
    mx[0][0] * r + mx[0][1] * g + mx[0][2] * b,
    mx[1][0] * r + mx[1][1] * g + mx[1][2] * b,
    mx[2][0] * r + mx[2][1] * g + mx[2][2] * b
  );
}
