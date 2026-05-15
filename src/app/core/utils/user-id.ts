export const normalizeUserId = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
      return null;
    }
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
    return null;
  }

  return null;
};

export const guardUserId = (value: unknown, context: string): number | null => {
  const normalized = normalizeUserId(value);
  if (normalized === null) {
    console.error(`[${context}] Invalid userId`, value);
    return null;
  }
  return normalized;
};
