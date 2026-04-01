import { hexToRgb, rgbToHsl } from './colourMath';

/**
 * Infers a brand personality archetype from the dominant colour's hue and saturation.
 * Based on the brand psychology research (Munsell studies, semantic differential scales).
 *
 * Returns { trait, desc, example, psychProfile }
 */
export function inferPersonality(hex) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);

  // Desaturated or very dark/light = neutral/luxury
  if (l < 15 && s < 25) {
    return {
      trait:       'Luxury / Power',
      desc:        'Deep, near-black tones signal exclusivity and authority. The absence of colour itself becomes a statement.',
      example:     'Rolex, Chanel, LVMH',
      psychProfile: 'High sophistication, low approachability. Strong aspirational appeal.',
    };
  }
  if (s < 12) {
    return {
      trait:       'Technology / Precision',
      desc:        'Cool, desaturated neutrals project reliability, modernity, and rational thinking.',
      example:     'Intel, Meta, Apple (silver era)',
      psychProfile: 'High trust, low warmth. Appeals to logic-driven decision makers.',
    };
  }

  // Warm reds and oranges — high energy
  if (s > 60 && (h < 20 || h > 340)) {
    return {
      trait:       'Energy / Urgency',
      desc:        'High-saturation reds and red-oranges trigger the highest arousal response. They accelerate decision-making and create a sense of immediacy.',
      example:     'Coca-Cola, Netflix, YouTube',
      psychProfile: 'Maximum attention capture (67% above neutral). Risk: perceived aggressiveness at high saturation.',
    };
  }

  // Oranges
  if (h >= 20 && h < 45 && s > 50) {
    return {
      trait:       'Warmth / Creativity',
      desc:        'Orange sits at the intersection of energy and optimism — approachable and sociable without the aggression of pure red.',
      example:     'Fanta, Harley-Davidson, Amazon',
      psychProfile: 'High approachability. Evokes enthusiasm, adventure, and confidence.',
    };
  }

  // Yellows and yellow-greens
  if (h >= 45 && h < 80 && s > 50) {
    return {
      trait:       'Optimism / Creativity',
      desc:        'Yellows and warm greens are the most visible colours in the spectrum. They signal positivity, innovation, and fresh thinking.',
      example:     'Snapchat, IKEA, National Geographic',
      psychProfile: 'High positive valence. Risk: can feel frivolous in B2B or luxury contexts.',
    };
  }

  // Greens
  if (h >= 80 && h < 165 && s > 30) {
    return {
      trait:       'Health / Growth',
      desc:        'Green is universally associated with nature, sustainability, and forward momentum. Mid-saturation greens feel trustworthy without the coldness of blue.',
      example:     'Whole Foods, Spotify, Animal Planet',
      psychProfile: 'High positive valence. Strong associations with health, environment, and financial growth.',
    };
  }

  // Cyans and blue-greens
  if (h >= 165 && h < 210 && s > 30) {
    return {
      trait:       'Trust / Reliability',
      desc:        'Blue-greens and cyan tones combine the trustworthiness of blue with the freshness of green. Widely used in fintech and healthcare.',
      example:     'PayPal, Chase Bank, NHS',
      psychProfile: 'Very high trust signal. Projects competence and stability.',
    };
  }

  // Blues
  if (h >= 210 && h < 255 && s > 30) {
    return {
      trait:       'Trust / Reliability',
      desc:        'Blue is the most universally trusted colour across cultures. It signals stability, competence, and professionalism — the dominant choice in finance, tech, and healthcare.',
      example:     'Facebook, Samsung, Ford, Visa',
      psychProfile: 'Highest trust signal of any hue. Can feel cold or impersonal at low lightness.',
    };
  }

  // Purples
  if (h >= 255 && h < 295 && s > 30) {
    return {
      trait:       'Luxury / Creative',
      desc:        'Purple historically connoted royalty and exclusivity. In modern branding it signals creativity, wisdom, and premium positioning.',
      example:     'Cadbury, Hallmark, Twitch',
      psychProfile: 'High aspiration and creativity signals. Strong in beauty, entertainment, and education.',
    };
  }

  // Magentas and pinks
  if (h >= 295 && h < 340 && s > 30) {
    return {
      trait:       'Playfulness / Bold',
      desc:        'Magentas and pinks are high-energy and unconventional. They signal confidence, disruption, and an unwillingness to be ignored.',
      example:     'T-Mobile, Lyft, Barbie',
      psychProfile: 'High memorability and attention capture. Strong with younger, female-skewing, or challenger-brand demographics.',
    };
  }

  // Muted mid-tones — fallback
  return {
    trait:       'Balanced / Versatile',
    desc:        'Mid-range hues at moderate saturation are adaptable and non-polarising — they work across many contexts without triggering strong associations.',
    example:     'Various',
    psychProfile: 'Low emotional intensity. High versatility. May lack distinctiveness in crowded markets.',
  };
}
