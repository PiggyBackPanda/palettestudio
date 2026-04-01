import { hexToRgb, rgbToHex, rgbToOklch, oklchToRgb } from './colourMath';

/**
 * Generates a 9-step perceptually uniform tint/shade scale using OKLCH
 * linear interpolation between two anchors.
 *
 * Anchor strategy:
 *   Step 100 → L=0.97, C = inputC × 0.12  (near-white, still brand-tinted)
 *   Step 900 → L=0.15, C = inputC × 0.72  (deep, not flat black)
 *   Hue stays constant throughout — brand identity preserved across all steps.
 *   Chroma tapers toward the light end to prevent washed-out pastels,
 *   and toward the dark end to prevent muddy deep tones (per research PDF).
 *
 * Step 500 is the midpoint of the interpolation (t=0.5) and is visually
 * close to the original input colour, though not identical since the
 * input may sit anywhere on the L axis.
 *
 * @param {string} hex  — Input colour, e.g. "#2D4A6B"
 * @returns {Array<{ step:number, hex:string, l:number, c:number, h:number, isBase:boolean }>}
 */
export function generateScale(hex) {
  const { r, g, b } = hexToRgb(hex);
  const { L: inputL, C: inputC, H: inputH } = rgbToOklch(r, g, b);

  // Anchor points
  const ANCHOR_100 = { l: 0.97, c: inputC * 0.12 };
  const ANCHOR_900 = { l: 0.15, c: inputC * 0.72 };

  const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

  const scale = STEPS.map((step, i) => {
    const t = i / (STEPS.length - 1); // 0 → 1 linearly

    // Linear interpolation between anchors
    const l = ANCHOR_100.l + (ANCHOR_900.l - ANCHOR_100.l) * t;
    const c = ANCHOR_100.c + (ANCHOR_900.c - ANCHOR_100.c) * t;
    const h = inputH; // hue constant — holds brand identity

    const { r: nr, g: ng, b: nb } = oklchToRgb(l, c, h);

    return { step, hex: rgbToHex(nr, ng, nb), l, c, h };
  });

  // Mark the step whose L is closest to the original input colour
  const baseIdx = scale.reduce(
    (best, s, i) =>
      Math.abs(s.l - inputL) < Math.abs(scale[best].l - inputL) ? i : best,
    0
  );

  return scale.map((s, i) => ({ ...s, isBase: i === baseIdx }));
}
