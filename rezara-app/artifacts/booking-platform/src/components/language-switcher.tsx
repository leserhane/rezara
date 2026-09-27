import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "ar", label: "ع", name: "العربية" },
] as const;

export function setLanguage(code: string) {
  // Persist the choice and flip text direction for Arabic.
  try {
    localStorage.setItem("rezara_lang", code);
  } catch {
    /* private mode — the choice just won't persist */
  }
  document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = code;
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    setLanguage(code);
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("common.language")}
      className={cn("inline-flex items-center gap-0.5 bg-muted/70 rounded-xl p-1 border border-border", className)}
    >
      {LANGUAGES.map(({ code, label, name }) => {
        const active = i18n.language === code;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => handleChange(code)}
            title={name}
            lang={code}
            className={cn(
              "min-w-9 h-7 px-2 rounded-lg text-xs font-semibold transition-all select-none",
              active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
