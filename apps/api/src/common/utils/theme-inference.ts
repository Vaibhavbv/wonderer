export type ParticleVariant = 'petals' | 'snow' | 'sun' | 'sand' | 'mist' | 'stars' | 'leaves';

export interface DestinationTheme {
  from: string;
  to: string;
  accent: string;
  particle: ParticleVariant;
}

// One canonical, hand-tuned palette per particle variant — reused so even the
// keyword-less fallback still looks intentional rather than random.
const PALETTES: Record<ParticleVariant, DestinationTheme> = {
  sand: { from: '#3a2718', to: '#1a1209', accent: '#E8A33D', particle: 'sand' },
  leaves: { from: '#14342b', to: '#0a1a16', accent: '#34d399', particle: 'leaves' },
  snow: { from: '#1e3a5f', to: '#0a1626', accent: '#7cc4ff', particle: 'snow' },
  mist: { from: '#243b53', to: '#0d1b29', accent: '#9ad0ec', particle: 'mist' },
  sun: { from: '#5a2e1a', to: '#2a1409', accent: '#ff9e5e', particle: 'sun' },
  petals: { from: '#5a2438', to: '#2a1019', accent: '#ff8fb1', particle: 'petals' },
  stars: { from: '#1a1a2e', to: '#0a0a14', accent: '#c9b8ff', particle: 'stars' },
};

// Ordered keyword groups — first match wins, so put more specific terms first.
const KEYWORD_GROUPS: Array<{ variant: ParticleVariant; keywords: string[] }> = [
  {
    variant: 'petals',
    keywords: ['japan', 'kyoto', 'tokyo', 'sakura', 'cherry blossom', 'korea', 'seoul'],
  },
  {
    variant: 'snow',
    keywords: [
      'alps', 'switzerland', 'glacier', 'himalaya', 'everest', 'snow', 'ladakh', 'leh',
      'spiti', 'antarctica', 'siberia', 'alaska', 'norway', 'finland', 'nepal', 'andes',
      'arctic', 'iceland',
    ],
  },
  {
    variant: 'mist',
    keywords: ['fog', 'mist', 'cloud forest', 'highlands', 'scotland', 'fjord', 'rainy'],
  },
  {
    variant: 'sun',
    keywords: [
      'beach', 'coast', 'island', 'tropical', 'maldives', 'bali', 'hawaii', 'caribbean',
      'goa', 'sea', 'ocean', 'bay', 'palolem', 'lagoon',
    ],
  },
  {
    variant: 'leaves',
    keywords: [
      'jungle', 'rainforest', 'amazon', 'forest', 'rishikesh', 'costa rica', 'borneo',
      'safari', 'savanna',
    ],
  },
  {
    variant: 'sand',
    keywords: [
      'desert', 'sahara', 'dune', 'oasis', 'dubai', 'rajasthan', 'jaisalmer', 'delhi',
      'arizona', 'sand', 'gobi',
    ],
  },
  {
    variant: 'stars',
    keywords: ['namibia', 'atacama', 'mongolia', 'outback', 'stargazing', 'observatory'],
  },
];

const VARIANTS = Object.keys(PALETTES) as ParticleVariant[];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Deterministic, free, instant — matches a destination's name/country/tags
// against a keyword table; falls back to a stable hash of the name so the
// same place always renders the same atmosphere across reloads.
export function inferTheme(name: string, country?: string | null, tags?: string[]): DestinationTheme {
  const haystack = [name, country, ...(tags || [])].filter(Boolean).join(' ').toLowerCase();

  for (const group of KEYWORD_GROUPS) {
    if (group.keywords.some((kw) => haystack.includes(kw))) {
      return PALETTES[group.variant];
    }
  }

  const fallbackVariant = VARIANTS[hashString(name) % VARIANTS.length];
  return PALETTES[fallbackVariant];
}
