import { useGetDashboardStats, useGetMyBusiness, getGetMyBusinessQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CreditCard, CheckCircle2, XCircle, TrendingUp, ArrowRight, Store } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: business, isLoading: isBusinessLoading } = useGetMyBusiness({
    query: { queryKey: getGetMyBusinessQueryKey(), retry: false }
  });
  
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey(), enabled: !!business }
  });

  if (isBusinessLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold font-display mb-2">{t("dashboard.welcomeTitle")}</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {t("dashboard.welcomeBody")}
        </p>
        <Link href="/settings">
          <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            {t("dashboard.setupProfile")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.subtitle", { name: business.name })}</p>
        </div>
        <Link href="/reservations/new">
          <Button className="rounded-xl shadow-md">
            {t("dashboard.newReservation")}
          </Button>
        </Link>
      </div>

      {isStatsLoading || !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title={t("dashboard.totalRevenue")}
              value={`${stats.totalRevenue.toFixed(2)} MAD`}
              icon={TrendingUp} 
              color="text-emerald-600" 
              bg="bg-emerald-100" 
            />
            <StatCard 
              title={t("dashboard.pendingPayments")}
              value={stats.pendingPayment} 
              icon={CreditCard} 
              color="text-amber-600" 
              bg="bg-amber-100" 
            />
            <StatCard 
              title={t("dashboard.confirmedBookings")}
              value={stats.confirmed} 
              icon={CheckCircle2} 
              color="text-blue-600" 
              bg="bg-blue-100" 
            />
            <StatCard 
              title={t("dashboard.cancellations")}
              value={stats.cancelled} 
              icon={XCircle} 
              color="text-red-600" 
              bg="bg-red-100" 
            />
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-bold font-display">{t("dashboard.recentReservations")}</h3>
              <Link href="/reservations" className="text-sm font-medium text-primary hover:underline flex items-center">
                {t("dashboard.viewAll")} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {(stats.recentReservations ?? []).length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{t("dashboard.noRecent")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-medium text-muted-foreground text-sm">{t("reservations.colCustomer")}</th>
                      <th className="text-left p-4 font-medium text-muted-foreground text-sm">{t("reservations.colDateTime")}</th>
                      <th className="text-left p-4 font-medium text-muted-foreground text-sm">{t("reservations.colDetails")}</th>
                      <th className="text-left p-4 font-medium text-muted-foreground text-sm">{t("reservations.colStatus")}</th>
                      <th className="text-right p-4 font-medium text-muted-foreground text-sm">{t("reservations.colAction")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(stats.recentReservations ?? []).map((res) => (
                      <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-foreground">{res.customerName}</div>
                          <div className="text-sm text-muted-foreground">{res.guests} guests</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{format(new Date(res.date), "MMM d, yyyy")}</div>
                          <div className="text-sm text-muted-foreground">{res.time}</div>
                        </td>
                        <td className="p-4 font-medium">{res.depositAmount.toFixed(2)} MAD</td>
                        <td className="p-4">
                          <StatusBadge status={res.status} />
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/reservations/${res.id}`}>
                            <Button variant="ghost" size="sm">{t("dashboard.view")}</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: string | number, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h4 className="text-3xl font-bold font-display text-foreground">{value}</h4>
        </div>
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const clsMap: Record<string, string> = {
    pending_payment: "bg-amber-100 text-amber-800 border-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    expired: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const cls = clsMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
  const label = t(`status.${status}`, { defaultValue: status });
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

