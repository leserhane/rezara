import { useMemo, useState } from "react";
import { useGetPaymentHistory } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Wallet, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function Payments() {
  const { t } = useTranslation();
  const { data: payments, isLoading } = useGetPaymentHistory();
  // Every time a customer opens PayPal a "pending" row is created; most are
  // abandoned or retried. Hide them by default so the list is real money.
  const [showIncomplete, setShowIncomplete] = useState(false);

  const paid = useMemo(() => (payments ?? []).filter((p) => p.paymentStatus === "paid"), [payments]);
  const visible = useMemo(
    () => (payments ?? []).filter((p) => showIncomplete || p.paymentStatus !== "pending"),
    [payments, showIncomplete],
  );
  const total = paid.reduce((s, p) => s + p.amount, 0);
  const thisMonth = useMemo(() => {
    const now = new Date();
    return paid
      .filter((p) => {
        const d = new Date(p.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((s, p) => s + p.amount, 0);
  }, [paid]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">{t("payments.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("payments.subtitle")}</p>
      </div>

      {!isLoading && paid.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:gap-6">
          <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground font-medium">{t("payments.thisMonth")}</p>
            <p className="text-xl md:text-3xl font-bold font-display mt-1">{formatMoney(thisMonth)}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground font-medium">
              {t("payments.allTime", { count: paid.length })}
            </p>
            <p className="text-xl md:text-3xl font-bold font-display mt-1">{formatMoney(total)}</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-end gap-2">
          <label htmlFor="show-incomplete" className="text-sm text-muted-foreground">
            {t("payments.showIncomplete")}
          </label>
          <Switch id="show-incomplete" checked={showIncomplete} onCheckedChange={setShowIncomplete} />
        </div>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold font-display text-foreground mb-1">{t("payments.empty")}</h2>
            <p className="text-muted-foreground max-w-sm">{t("payments.emptyDesc")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((payment) => (
              <li key={payment.id}>
                <Link
                  href={`/reservations/${payment.reservationId}`}
                  className="group flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{payment.customerName || t("payments.unknown")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(new Date(payment.createdAt), "d MMM yyyy, HH:mm")}
                      {payment.reservationDate &&
                        ` · ${t("payments.resDate", { date: formatDate(payment.reservationDate, "d MMM") })}`}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p
                      className={cn(
                        "font-bold tabular-nums",
                        payment.paymentStatus !== "paid" && "text-muted-foreground font-medium",
                      )}
                    >
                      {formatMoney(payment.amount, payment.currency || "MAD")}
                    </p>
                    <span
                      className={cn(
                        "inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                        PAYMENT_STYLES[payment.paymentStatus] ?? PAYMENT_STYLES.pending,
                      )}
                    >
                      {t(`payments.status_${payment.paymentStatus}`, { defaultValue: payment.paymentStatus })}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 hidden sm:block rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
