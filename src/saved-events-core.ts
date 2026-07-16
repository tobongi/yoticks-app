function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

export function parseSavedEventIds(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? uniqueIds(parsed.filter((entry): entry is string => typeof entry === 'string')) : [];
  } catch {
    return [];
  }
}

export function mergeSavedEventIds(primaryIds: string[], secondaryIds: string[]) {
  return uniqueIds([...primaryIds, ...secondaryIds]);
}

export function normalizeSavedEventIds(ids: string[]) {
  return uniqueIds(ids);
}
