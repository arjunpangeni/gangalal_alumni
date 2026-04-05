/**
 * Public pages use `export const revalidate = 60` (ISR on Vercel).
 * Next.js requires a numeric literal on each page export; keep this value in sync when tuning.
 */
export const PUBLIC_PAGE_REVALIDATE_SECONDS = 60;
