import { hexToRgb, rgbToLab } from './colourMath';

// ─── Named colour list ────────────────────────────────────────────────────────

const NAMED_COLOURS = [
  // Reds / Pinks
  { name: 'Crimson',    hex: '#DC143C' },
  { name: 'Scarlet',    hex: '#FF2400' },
  { name: 'Rose',       hex: '#FF007F' },
  { name: 'Blush',      hex: '#FFB6C1' },
  { name: 'Coral',      hex: '#FF6B6B' },
  { name: 'Salmon',     hex: '#FA8072' },
  { name: 'Hot Pink',   hex: '#FF69B4' },
  { name: 'Dusty Rose', hex: '#DCAE96' },
  { name: 'Brick',      hex: '#9C2B2E' },
  { name: 'Burgundy',   hex: '#800020' },

  // Oranges
  { name: 'Tangerine',    hex: '#F28500' },
  { name: 'Amber',        hex: '#FFBF00' },
  { name: 'Burnt Orange', hex: '#CC5500' },
  { name: 'Copper',       hex: '#B87333' },
  { name: 'Terracotta',   hex: '#E2725B' },
  { name: 'Peach',        hex: '#FFCBA4' },
  { name: 'Rust',         hex: '#B7410E' },
  { name: 'Pumpkin',      hex: '#FF7518' },
  { name: 'Marigold',     hex: '#ECA400' },
  { name: 'Sienna',       hex: '#A0522D' },

  // Yellows
  { name: 'Lemon',      hex: '#FFF44F' },
  { name: 'Gold',       hex: '#FFD700' },
  { name: 'Mustard',    hex: '#FFDB58' },
  { name: 'Butter',     hex: '#FFFAA0' },
  { name: 'Canary',     hex: '#FFFF99' },
  { name: 'Straw',      hex: '#E4D96F' },
  { name: 'Saffron',    hex: '#F4C430' },
  { name: 'Goldenrod',  hex: '#DAA520' },
  { name: 'Cream',      hex: '#FFFDD0' },
  { name: 'Champagne',  hex: '#F7E7CE' },

  // Greens
  { name: 'Emerald',    hex: '#50C878' },
  { name: 'Forest',     hex: '#228B22' },
  { name: 'Sage',       hex: '#BCB88A' },
  { name: 'Mint',       hex: '#98FF98' },
  { name: 'Olive',      hex: '#808000' },
  { name: 'Lime',       hex: '#32CD32' },
  { name: 'Hunter',     hex: '#355E3B' },
  { name: 'Seafoam',    hex: '#71EEB8' },
  { name: 'Moss',       hex: '#8A9A5B' },
  { name: 'Chartreuse', hex: '#7FFF00' },
  { name: 'Eucalyptus', hex: '#44D7A8' },
  { name: 'Jade',       hex: '#00A86B' },
  { name: 'Pistachio',  hex: '#93C572' },
  { name: 'Fern',       hex: '#4F7942' },

  // Blues
  { name: 'Navy',          hex: '#000080' },
  { name: 'Royal Blue',    hex: '#4169E1' },
  { name: 'Sky',           hex: '#87CEEB' },
  { name: 'Cobalt',        hex: '#0047AB' },
  { name: 'Teal',          hex: '#008080' },
  { name: 'Cerulean',      hex: '#2A52BE' },
  { name: 'Baby Blue',     hex: '#89CFF0' },
  { name: 'Denim',         hex: '#1560BD' },
  { name: 'Slate Blue',    hex: '#6A5ACD' },
  { name: 'Electric Blue', hex: '#7DF9FF' },
  { name: 'Cornflower',    hex: '#6495ED' },
  { name: 'Powder Blue',   hex: '#B0E0E6' },
  { name: 'Ice Blue',      hex: '#99C5C4' },
  { name: 'Peacock',       hex: '#005F6A' },

  // Purples
  { name: 'Lavender',   hex: '#E6E6FA' },
  { name: 'Violet',     hex: '#EE82EE' },
  { name: 'Plum',       hex: '#DDA0DD' },
  { name: 'Mauve',      hex: '#E0B0FF' },
  { name: 'Lilac',      hex: '#C8A2C8' },
  { name: 'Indigo',     hex: '#4B0082' },
  { name: 'Periwinkle', hex: '#CCCCFF' },
  { name: 'Amethyst',   hex: '#9966CC' },
  { name: 'Eggplant',   hex: '#614051' },
  { name: 'Mulberry',   hex: '#C54B8C' },

  // Neutrals / Browns
  { name: 'Ivory',      hex: '#FFFFF0' },
  { name: 'Linen',      hex: '#FAF0E6' },
  { name: 'Beige',      hex: '#F5F5DC' },
  { name: 'Sand',       hex: '#C2B280' },
  { name: 'Tan',        hex: '#D2B48C' },
  { name: 'Khaki',      hex: '#F0E68C' },
  { name: 'Taupe',      hex: '#483C32' },
  { name: 'Mocha',      hex: '#967969' },
  { name: 'Espresso',   hex: '#4B3832' },
  { name: 'Charcoal',   hex: '#36454F' },
  { name: 'Graphite',   hex: '#474A51' },
  { name: 'Ash',        hex: '#B2BEB5' },
  { name: 'Stone',      hex: '#928E85' },
  { name: 'Flint',      hex: '#6B6B6B' },
  { name: 'Slate',      hex: '#708090' },
  { name: 'Silver',     hex: '#C0C0C0' },
  { name: 'Smoke',      hex: '#738276' },
  { name: 'Off-White',  hex: '#FAF9F6' },
  { name: 'Pearl',      hex: '#F0EAD6' },
  { name: 'Oyster',     hex: '#F0EBD8' },
  { name: 'Warm White', hex: '#FDF5E6' },
  { name: 'Dusk',       hex: '#B4A7A7' },
];

// Pre-compute Lab values for all named colours once at module load time
const NAMED_LAB = NAMED_COLOURS.map(({ name, hex }) => {
  const { r, g, b } = hexToRgb(hex);
  return { name, lab: rgbToLab(r, g, b) };
});

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the nearest named colour for a given hex string.
 * Uses Euclidean distance in CIE Lab space (Delta E).
 * Results are cached to avoid redundant computation.
 */
export function getColourName(hex) {
  const key = hex.toLowerCase();
  if (cache.has(key)) return cache.get(key);

  const { r, g, b } = hexToRgb(key);
  const input = rgbToLab(r, g, b);

  let bestName = NAMED_LAB[0].name;
  let bestDist = Infinity;

  for (const { name, lab } of NAMED_LAB) {
    const dist = Math.sqrt(
      (input.L - lab.L) ** 2 +
      (input.a - lab.a) ** 2 +
      (input.b - lab.b) ** 2
    );
    if (dist < bestDist) {
      bestDist = dist;
      bestName = name;
    }
  }

  cache.set(key, bestName);
  return bestName;
}

/**
 * Returns an object mapping each hex in the array to its nearest colour name.
 * { '#2d4a6b': 'Navy', '#ff6b6b': 'Coral', ... }
 */
export function getColourNames(hexArray) {
  return Object.fromEntries(hexArray.map(hex => [hex, getColourName(hex)]));
}
