export const locales = ["ne", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ne";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
