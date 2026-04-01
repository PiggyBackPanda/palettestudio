export const DEFAULTS = ['#2D4A6B', '#E8734A', '#F5E6C8', '#1A1A2E'];

export const TABS = [
  { key: 'issues',      label: 'Issues & Fixes' },
  { key: 'readability', label: 'Readability' },
  { key: 'roles',       label: 'Colour Jobs' },
  { key: 'mockups',     label: 'Mockups' },
  { key: 'export',      label: 'Export' },
  { key: 'addcolours',  label: 'Add Colours' },
  { key: 'colourblind', label: 'Colour Blindness' },
  { key: 'colournames', label: 'Colour Names' },
  { key: 'typography',  label: 'Typography' },
  { key: 'templates',   label: 'Brand Templates' },
];

export const FONT_PAIRS = [
  {
    name: 'Editorial',
    heading: "'Playfair Display', serif",
    body: "'Source Sans 3', sans-serif",
    mood: 'Classic editorial elegance — refined, authoritative, and timeless',
    vibes: ['warm', 'neutral'],
    satRange: [15, 70],
  },
  {
    name: 'Geometric Modern',
    heading: "'DM Sans', sans-serif",
    body: "'IBM Plex Sans', sans-serif",
    mood: 'Clean tech-forward minimalism — precise, trustworthy, and modern',
    vibes: ['cool', 'neutral'],
    satRange: [10, 55],
  },
  {
    name: 'Humanist Warmth',
    heading: "'Nunito', sans-serif",
    body: "'Lora', serif",
    mood: 'Friendly and approachable — warm, inviting, and personal',
    vibes: ['warm', 'neutral'],
    satRange: [20, 65],
  },
  {
    name: 'Bold Statement',
    heading: "'Space Grotesk', sans-serif",
    body: "'JetBrains Mono', monospace",
    mood: 'Technical confidence — bold, structured, and unapologetic',
    vibes: ['cool', 'neutral'],
    satRange: [30, 90],
  },
  {
    name: 'Organic & Natural',
    heading: "'Fraunces', serif",
    body: "'Outfit', sans-serif",
    mood: 'Earthy and artisanal — organic, grounded, and authentic',
    vibes: ['warm'],
    satRange: [10, 50],
  },
  {
    name: 'Quiet Luxury',
    heading: "'Cormorant Garamond', serif",
    body: "'Karla', sans-serif",
    mood: 'Understated sophistication — luxurious, calm, and considered',
    vibes: ['neutral', 'cool'],
    satRange: [5, 40],
  },
];

export const CVD_TYPES = [
  { key: 'protanopia',   label: 'Red-blind',   note: 'Protanopia — ~1% of men' },
  { key: 'deuteranopia', label: 'Green-blind',  note: 'Deuteranopia — ~1% of men' },
  { key: 'tritanopia',   label: 'Blue-blind',   note: 'Tritanopia — rare' },
];
