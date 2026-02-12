import { useLocale } from "@/hooks/use-locale";
import { setLocale, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const labels: Record<Locale, string> = {
  en: "EN",
  ja: "JA",
};

export default function LanguageSwitcher() {
  const locale = useLocale();

  const toggle = () => {
    setLocale(locale === "ja" ? "en" : "ja");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-1 text-xs"
      aria-label="Switch language"
    >
      <Globe className="h-4 w-4" />
      {labels[locale]}
    </Button>
  );
}
