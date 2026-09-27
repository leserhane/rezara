import { format as dfFormat, parseISO, isToday, isTomorrow, isValid } from "date-fns";
import { enUS, fr, arMA } from "date-fns/locale";
import i18n from "@/i18n";

const DATE_FNS_LOCALES = { en: enUS, fr, ar: arMA } as const;
const INTL_LOCALES = { en: "en-GB", fr: "fr-MA", ar: "ar-MA" } as const;

function lang(): keyof typeof DATE_FNS_LOCALES {
  const l = (i18n.language || "en").split("-")[0];
  return l === "fr" || l === "ar" ? l : "en";
}

/**
 * Reservation dates are stored as plain "YYYY-MM-DD" calendar dates.
 * `new Date("2026-03-30")` parses that as UTC midnight, which shows the
 * previous day for anyone west of UTC; parseISO keeps it a local date.
 */
export function toLocalDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/** Locale-aware date formatting (month/day names follow the UI language). */
export function formatDate(value: string | Date, pattern = "PP"): string {
  const d = toLocalDate(value);
  if (!isValid(d)) return typeof value === "string" ? value : "";
  return dfFormat(d, pattern, { locale: DATE_FNS_LOCALES[lang()] });
}

/** "Today" / "Tomorrow" / "Sat 30 Mar" — the way staff think about bookings. */
export function formatRelativeDay(value: string | Date): string {
  const d = toLocalDate(value);
  if (isToday(d)) return i18n.t("common.today");
  if (isTomorrow(d)) return i18n.t("common.tomorrow");
  return formatDate(d, "EEE d MMM");
}

export function formatMoney(amount: number | string, currency = "MAD"): string {
  const n = Number(amount);
  const value = new Intl.NumberFormat(INTL_LOCALES[lang()], {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
  // Isolate as left-to-right so Arabic text doesn't flip it to "MAD 50".
  return `\u2066${value} ${currency.toUpperCase()}\u2069`;
}

/** Week starts on Monday in Morocco/France; keep Sunday for English. */
export function weekStartsOn(): 0 | 1 {
  return lang() === "en" ? 0 : 1;
}

export function dateFnsLocale() {
  return DATE_FNS_LOCALES[lang()];
}

export function localDateString(d = new Date()): string {
  return dfFormat(d, "yyyy-MM-dd");
}

/** wa.me wants digits only, with the country code. */
export function whatsappUrl(phone: string | null | undefined, message: string): string {
  const digits = (phone ?? "").replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "");
  // Moroccan local format (06…/07…) → international.
  const intl = /^0\d{9}$/.test(digits) ? `212${digits.slice(1)}` : digits;
  const text = encodeURIComponent(message);
  return intl ? `https://wa.me/${intl}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function minutesUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}
