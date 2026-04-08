"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

function lookup(source: unknown, path: string): string | undefined {
  const result = path.split(".").reduce<unknown>((acc, part) => {
    if (typeof acc === "object" && acc !== null && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);

  return typeof result === "string" ? result : undefined;
}

export function I18nText({
  id,
  fallback,
  values,
}: {
  id: string;
  fallback: string;
  values?: Record<string, string | number>;
}) {
  const { messages } = useI18n();
  let text = lookup(messages, id) ?? fallback;

  if (values) {
    for (const [key, value] of Object.entries(values)) {
      text = text.replaceAll(`{${key}}`, String(value));
    }
  }

  return <>{text}</>;
}
