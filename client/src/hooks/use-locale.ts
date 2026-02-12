import { useSyncExternalStore } from "react";
import { getLocale, subscribe, type Locale } from "@/lib/i18n";

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, getLocale);
}
