import en from "../locales/en.json";
import ja from "../locales/ja.json";

export type Locale = "en" | "ja";

const translations: Record<Locale, Record<string, Record<string, string>>> = {
  en,
  ja,
};

const STORAGE_KEY = "app-locale";

let currentLocale: Locale = (localStorage.getItem(STORAGE_KEY) as Locale) || "ja";

const listeners: Set<() => void> = new Set();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Translate a key in "namespace.key" format.
 * Example: t("landing.exclusive_community")
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const dotIndex = key.indexOf(".");
  if (dotIndex === -1) return key;

  const namespace = key.slice(0, dotIndex);
  const field = key.slice(dotIndex + 1);

  const value = translations[currentLocale]?.[namespace]?.[field] ?? key;

  if (!vars) return value;

  let result = value;
  for (const [k, v] of Object.entries(vars)) {
    result = result.replaceAll(`{${k}}`, String(v));
  }
  return result;
}
