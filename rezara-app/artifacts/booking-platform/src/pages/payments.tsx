import { useGetPaymentHistory } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Payments() {
  const { t } = useTranslation();
  const { data: payments, isLoading } = useGetPaymentHistory();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between items-start gap-4">
        <h1 className="text-3xl font-bold font-display text-foreground">{t("payments.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("payments.subtitle")}</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold font-display text-foreground mb-2">{t("payments.empty")}</h3>
            <p className="text-muted-foreground max-w-sm">
              {t("payments.emptyDesc")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("payments.colDate")}</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("payments.colCustomer")}</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("payments.colAmount")}</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("payments.colStatus")}</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("payments.colTransaction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-foreground">{format(new Date(payment.createdAt), "MMM d, yyyy")}</div>
                      <div className="text-sm text-muted-foreground">{format(new Date(payment.createdAt), "h:mm a")}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold">{payment.customerName || t("payments.unknown")}</div>
                      <div className="text-xs text-muted-foreground">{payment.reservationDate ? t("payments.resDate", { date: format(new Date(payment.reservationDate), "MMM d") }) : "N/A"}</div>
                    </td>
                    <td className="p-4 font-bold font-mono">
                      {payment.amount.toFixed(2)} {payment.currency || "MAD"}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        payment.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        payment.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-mono text-muted-foreground">
                      {payment.paypalOrderId || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
