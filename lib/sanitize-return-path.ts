const DEFAULT_ARTICLE_EDITOR_RETURN = "/dashboard/articles";

/**
 * Safe return path for `/content/edit/[slug]` (prevents open redirects).
 * Only allows paths under `/admin` or `/dashboard`.
 */
export function sanitizeArticleEditorReturnPath(raw: string | undefined | null): string {
  if (raw == null || typeof raw !== "string") return DEFAULT_ARTICLE_EDITOR_RETURN;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return DEFAULT_ARTICLE_EDITOR_RETURN;
  if (trimmed.startsWith("//") || trimmed.includes("\\")) return DEFAULT_ARTICLE_EDITOR_RETURN;
  const pathOnly = trimmed.split("?")[0].split("#")[0];
  if (!pathOnly || pathOnly.includes("//")) return DEFAULT_ARTICLE_EDITOR_RETURN;
  if (!/^\/(admin|dashboard)(\/|$)/.test(pathOnly)) return DEFAULT_ARTICLE_EDITOR_RETURN;
  return pathOnly;
}
