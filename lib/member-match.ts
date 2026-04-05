/** Lowercase string of all searchable member fields (client-side only). */
export function memberSearchHaystack(m: {
  name: string;
  profile?: {
    profession?: string;
    company?: string;
    city?: string;
    country?: string;
    batch?: string;
    permanentAddress?: string;
    schoolPeriod?: string;
    bio?: string;
    slcSeeBatch?: number;
  };
}): string {
  const p = m.profile ?? {};
  const parts = [
    m.name,
    p.profession,
    p.company,
    p.city,
    p.country,
    p.batch,
    p.permanentAddress,
    p.schoolPeriod,
    p.bio,
    p.slcSeeBatch != null ? String(p.slcSeeBatch) : "",
  ];
  return parts.filter(Boolean).join(" \n ").toLowerCase();
}

/** Split query into tokens; empty / whitespace-only yields []. */
export function searchTokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Every token must appear somewhere in the member haystack. */
export function memberMatchesTokens(
  m: Parameters<typeof memberSearchHaystack>[0],
  tokens: string[]
): boolean {
  if (tokens.length === 0) return true;
  const hay = memberSearchHaystack(m);
  return tokens.every((t) => hay.includes(t));
}
