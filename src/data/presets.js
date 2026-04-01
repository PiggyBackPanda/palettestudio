import { autoAssignRoles } from '../utils/autoRoles';

// Raw preset definitions — roles are computed at module load time via autoAssignRoles()
const RAW_PRESETS = [
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
];

// Compute roles at module level — not at runtime
export const PRESETS = RAW_PRESETS.map(p => {
  const { roles } = autoAssignRoles(p.colors);
  return { ...p, roles };
});
