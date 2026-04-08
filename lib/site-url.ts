/**
 * Canonical site origin for metadata (Open Graph, metadataBase).
 * Prefer NEXT_PUBLIC_APP_URL in production; Vercel sets VERCEL_URL as a fallback.
 */
export function getMetadataBase(): URL | undefined {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      /* ignore */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      return new URL(vercel.startsWith("http") ? vercel : `https://${vercel}`);
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

/** Resolve stored image URLs (absolute or site-relative) for og:image. */
export function absoluteContentUrl(pathOrAbsolute: string | undefined): string | undefined {
  const t = pathOrAbsolute?.trim();
  if (!t) return undefined;
  if (/^https?:\/\//i.test(t)) return t;
  const base = getMetadataBase();
  if (!base) return undefined;
  try {
    return new URL(t.startsWith("/") ? t : `/${t}`, base).href;
  } catch {
    return undefined;
  }
}
