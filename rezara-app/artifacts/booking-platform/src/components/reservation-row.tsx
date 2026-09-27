import { Link } from "wouter";
import { ChevronRight, Clock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Reservation } from "@workspace/api-client-react";
import { StatusBadge } from "./status-badge";
import { formatDate, formatMoney, toLocalDate } from "@/lib/format";
import { isToday } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * One reservation as a tappable row. Works as a card on phones and a dense
 * row on desktop, so lists never need horizontal scrolling or hover-only
 * buttons (which don't exist on touch screens).
 */
export function ReservationRow({ reservation: r }: { reservation: Reservation }) {
  const { t } = useTranslation();
  const date = toLocalDate(r.date);
  const today = isToday(date);

  return (
    <Link
      href={`/reservations/${r.id}`}
      className="group flex items-center gap-3 sm:gap-4 px-4 py-3.5 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none transition-colors"
    >
      <div
        className={cn(
          "w-12 shrink-0 rounded-xl border text-center py-1.5",
          today ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border",
        )}
        aria-hidden
      >
        <div className={cn("text-[10px] font-semibold uppercase leading-none", !today && "text-muted-foreground")}>
          {formatDate(date, "EEE")}
        </div>
        <div className="text-lg font-bold leading-tight">{formatDate(date, "d")}</div>
        <div className={cn("text-[10px] leading-none", !today && "text-muted-foreground")}>
          {formatDate(date, "MMM")}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-semibold text-foreground truncate">{r.customerName}</p>
          <StatusBadge status={r.status} className="hidden sm:inline-flex" />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span dir="ltr">{r.time}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {t("common.guestCount", { count: r.guests })}
          </span>
          <span className="font-medium text-foreground/80">{formatMoney(r.depositAmount)}</span>
        </div>
        <span className="sr-only">{formatDate(date, "PPPP")}</span>
      </div>

      <StatusBadge status={r.status} className="sm:hidden" />
      <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 hidden sm:block rtl:rotate-180 group-hover:text-foreground transition-colors" />
    </Link>
  );
}
