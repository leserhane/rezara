import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", countryCode: "gb", label: "EN" },
  { code: "fr", countryCode: "fr", label: "FR" },
  { code: "ar", countryCode: "ma", label: "AR" },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("rezara_lang", code);
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = code;
  };

  return (
    <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1 border border-border">
      {LANGUAGES.map(({ code, countryCode, label }) => {
        const active = i18n.language === code;
        return (
          <button
            key={code}
            onClick={() => handleChange(code)}
            title={label}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 select-none ${
              active
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <img
              src={`https://flagcdn.com/20x15/${countryCode}.png`}
              srcSet={`https://flagcdn.com/40x30/${countryCode}.png 2x`}
              width={20}
              height={15}
              alt={label}
              className="rounded-[2px] object-cover"
              style={{ display: "block" }}
            />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
