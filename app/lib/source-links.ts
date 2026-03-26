const COORDINATE_PAIR_PATTERN = /^[-+]?\d+(?:\.\d+)?\s*,\s*[-+]?\d+(?:\.\d+)?$/;
const COORDINATE_LABEL_PATTERN = /(?:^|[\s,{[(])(?:lat|lng|lon|long|latitude|longitude)\s*[:=]/i;

function looksLikeCoordinatePayload(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (COORDINATE_PAIR_PATTERN.test(trimmed)) return true;
  if (COORDINATE_LABEL_PATTERN.test(trimmed)) return true;
  return false;
}

export function getSafeExternalUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value || looksLikeCoordinatePayload(value)) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    const normalized = parsed.toString();
    if (looksLikeCoordinatePayload(normalized) || looksLikeCoordinatePayload(parsed.pathname)) {
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}
