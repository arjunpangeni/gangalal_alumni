"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import ne from "@/messages/ne.json";
import en from "@/messages/en.json";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type I18nContextValue = {
  locale: Locale;
  messages: typeof ne;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const storageKey = "ui-locale";

function subscribe() {
  return () => undefined;
}

function getServerSnapshot() {
  return defaultLocale;
}

function getClientSnapshot(): Locale {
  const stored = window.localStorage.getItem(storageKey);
  return stored === "en" ? "en" : "ne";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const initialLocale = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, nextLocale);
    }
  };

  const messages = locale === "en" ? en : ne;
  const value = useMemo(() => ({ locale, messages, setLocale }), [locale, messages]);

  if (!hydrated) return null;
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
