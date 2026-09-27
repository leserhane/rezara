import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  pending_payment: { pill: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  confirmed: { pill: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  completed: { pill: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  cancelled: { pill: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  expired: { pill: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

export function statusDotClass(status: string): string {
  return STATUS_STYLES[status]?.dot ?? "bg-slate-400";
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useTranslation();
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.expired;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap",
        style.pill,
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} aria-hidden />
      {t(`status.${status}`, { defaultValue: status })}
    </span>
  );
}
