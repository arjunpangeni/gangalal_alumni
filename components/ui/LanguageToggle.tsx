"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { locales } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex items-center rounded-full border border-border/80 bg-background/70 p-0.5">
      {locales.map((item) => {
        const active = item === locale;
        return (
          <button
            key={item}
            type="button"
            onClick={() => setLocale(item)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={active}
          >
            {item === "ne" ? "ने" : "EN"}
          </button>
        );
      })}
    </div>
  );
}
