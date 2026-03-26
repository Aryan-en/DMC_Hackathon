const ENTITY_ALIAS_MAP: Record<string, string> = {
  us: 'United States',
  usa: 'United States',
  'the us': 'United States',
  'the usa': 'United States',
  'united states': 'United States',
  'united states of america': 'United States',
  unitedstates: 'United States',
  'u s': 'United States',
  'u s a': 'United States',
  eu: 'European Union',
  uae: 'United Arab Emirates',
  uk: 'United Kingdom',
  'the uk': 'United Kingdom',
  'russia federation': 'Russia',
  'russian federation': 'Russia',
};

function titleCase(value: string) {
  return value.replace(/\b\w+/g, (part) => part.charAt(0).toUpperCase() + part.slice(1));
}

export function canonicalizeEntityLabel(raw: string | null | undefined): string {
  const value = (raw || '').trim();
  if (!value) return '';

  const normalized = value
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^the\s+/, '');

  const compact = normalized.replace(/\s+/g, '');
  return ENTITY_ALIAS_MAP[normalized] || ENTITY_ALIAS_MAP[compact] || titleCase(normalized);
}
