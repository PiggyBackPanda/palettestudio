import { autoAssignRoles } from '../utils/autoRoles';

// Raw preset definitions — roles are computed at module load time via autoAssignRoles()
const RAW_PRESETS = [
  // ── Industry themes ────────────────────────────────────────────────────────
  {
    name: 'Tech & SaaS',
    personality: 'Clean, trustworthy, modern',
    colors: ['#1E3A5F', '#2563EB', '#60A5FA', '#F8FAFF', '#111827'],
  },
  {
    name: 'Health & Wellness',
    personality: 'Calm, natural, reassuring',
    colors: ['#F0FDF4', '#16A34A', '#86EFAC', '#1F2937', '#6B7280'],
  },
  {
    name: 'Legal & Finance',
    personality: 'Authoritative, trustworthy, established',
    colors: ['#F9F7F4', '#1E3A5F', '#D4AF37', '#1C1917', '#78716C'],
  },
  {
    name: 'Hospitality & Food',
    personality: 'Warm, inviting, appetising',
    colors: ['#FFF8F0', '#C2410C', '#F97316', '#1C1917', '#A8A29E'],
  },
  {
    name: 'Creative & Agency',
    personality: 'Bold, distinctive, energetic',
    colors: ['#FAFAFA', '#7C3AED', '#EC4899', '#111111', '#6B7280'],
  },
  {
    name: 'Retail & Fashion',
    personality: 'Elegant, aspirational, refined',
    colors: ['#FAFAF8', '#1C1C1E', '#C9A96E', '#374151', '#D1D5DB'],
  },
  {
    name: 'Education',
    personality: 'Approachable, trustworthy, optimistic',
    colors: ['#F0F9FF', '#0369A1', '#FCD34D', '#1E293B', '#94A3B8'],
  },
  {
    name: 'Sustainability & Eco',
    personality: 'Natural, honest, grounded',
    colors: ['#F7F3EE', '#2D6A4F', '#95D5B2', '#2D3436', '#B7B7A4'],
  },
  {
    name: 'Luxury & Premium',
    personality: 'Exclusive, refined, timeless',
    colors: ['#FDFCFB', '#1A1A1A', '#C5A028', '#4A4A4A', '#E8E0D5'],
  },
  {
    name: 'Startup & Innovation',
    personality: 'Fresh, confident, disruptive',
    colors: ['#F8FAFC', '#6366F1', '#06B6D4', '#0F172A', '#94A3B8'],
  },

  // ── Iconic brand-inspired palettes ─────────────────────────────────────────
  {
    name: 'Coca-Cola Vibes',
    personality: 'Bold red energy, classic Americana',
    colors: ['#FFFFFF', '#D12421', '#1A1A1A', '#F4D03F', '#B0B0B0'],
  },
  {
    name: 'Spotify Feel',
    personality: 'Dark, vibrant green, music-forward',
    colors: ['#121212', '#1DB954', '#FFFFFF', '#535353', '#B3B3B3'],
  },
  {
    name: 'Tiffany & Co. Style',
    personality: 'Iconic robin-egg blue, luxury minimalism',
    colors: ['#FAFAFA', '#0ABAB5', '#1A1A1A', '#E8E8E8', '#7B7B7B'],
  },
  {
    name: 'Netflix Mood',
    personality: 'Cinematic dark with signature red',
    colors: ['#141414', '#E50914', '#FFFFFF', '#564D4D', '#B81D24'],
  },
  {
    name: 'Airbnb Warmth',
    personality: 'Friendly coral, warm and welcoming',
    colors: ['#FFFFFF', '#FF5A5F', '#00A699', '#484848', '#767676'],
  },
  {
    name: 'Nike Energy',
    personality: 'High-contrast, athletic, fearless',
    colors: ['#FFFFFF', '#111111', '#FF6B35', '#F5F5F5', '#757575'],
  },
  {
    name: 'Slack Playful',
    personality: 'Multi-colour harmony, friendly tech',
    colors: ['#FFFFFF', '#4A154B', '#36C5F0', '#ECB22E', '#2EB67D'],
  },
  {
    name: 'Apple Minimal',
    personality: 'Ultra-clean, confident whitespace',
    colors: ['#FBFBFD', '#1D1D1F', '#0071E3', '#F5F5F7', '#86868B'],
  },
  {
    name: 'Stripe Gradient',
    personality: 'Vivid gradient blues, developer-chic',
    colors: ['#F6F9FC', '#635BFF', '#0A2540', '#00D4AA', '#ADBDCC'],
  },
  {
    name: 'Notion Clean',
    personality: 'Soft, structured, distraction-free',
    colors: ['#FFFFFF', '#2F3437', '#EB5757', '#F7F6F3', '#9B9A97'],
  },
  {
    name: 'Mailchimp Fun',
    personality: 'Quirky yellow energy, approachable',
    colors: ['#FFFFFF', '#FFE01B', '#241C15', '#007C89', '#D5D4D0'],
  },
  {
    name: 'Barbie Pink',
    personality: 'Playful, unapologetic, instantly iconic',
    colors: ['#FDEEF4', '#E0218A', '#FFFFFF', '#1A1A1A', '#F9A8D4'],
  },
];

// Compute roles at module level — not at runtime
export const PRESETS = RAW_PRESETS.map(p => {
  const { roles } = autoAssignRoles(p.colors);
  return { ...p, roles };
});
