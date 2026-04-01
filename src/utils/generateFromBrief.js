const SYSTEM_PROMPT = `You are a professional brand colour designer. When given a brand brief, you output a colour palette as JSON only — no explanation, no markdown, no preamble.

Output format (strict JSON, nothing else):
{
  "colors": ["#hex1","#hex2","#hex3","#hex4","#hex5"],
  "roles": {
    "#hex1": "Background",
    "#hex2": "Hero",
    "#hex3": "Accent",
    "#hex4": "Text",
    "#hex5": "Neutral"
  },
  "rationale": {
    "#hex1": "one sentence explaining this colour choice",
    "#hex2": "...",
    "#hex3": "...",
    "#hex4": "...",
    "#hex5": "..."
  },
  "paletteName": "Short evocative name for this palette"
}

Rules for palette generation:
- Always include exactly 5 colours
- Always include one Background (light, L>85%), one Text (dark, L<20%), one Hero (distinctive brand colour, S>50%), one Accent (complementary to Hero, for CTAs), one Neutral (mid-tone support)
- Background and Text must achieve at least 7:1 contrast ratio
- Hero and Accent should be harmonically related (analogous, complementary, or split-complement)
- Never use pure #000000 or #ffffff
- All colours must be valid 6-digit hex codes`;

export async function generatePaletteFromBrief(brief) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Brand brief: ${brief}` }],
      }),
    });
  } catch {
    throw new Error('NETWORK_ERROR');
  }

  if (!response.ok) {
    throw new Error(`API_ERROR_${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  // Strip any markdown fences if present
  const clean = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('INVALID_JSON');
  }

  if (!parsed.colors || !Array.isArray(parsed.colors) || parsed.colors.length !== 5) {
    throw new Error('INVALID_STRUCTURE');
  }

  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  for (const hex of parsed.colors) {
    if (!hexRegex.test(hex)) {
      throw new Error(`INVALID_HEX: ${hex}`);
    }
  }

  return parsed;
}
