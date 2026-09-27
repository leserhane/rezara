import { useState } from "react";
import { useGetReservations } from "@workspace/api-client-react";
import { GetReservationsStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Plus, Search, Filter, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "../dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReservationsList() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<GetReservationsStatus | "all">("all");
  const [search, setSearch] = useState("");

  const { data: reservations, isLoading } = useGetReservations(
    statusFilter === "all" ? {} : { status: statusFilter }
  );

  const filtered = reservations?.filter(r => 
    r.customerName.toLowerCase().includes(search.toLowerCase()) ||
    r.linkId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">{t("reservations.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("reservations.subtitle")}</p>
        </div>
        <Link href="/reservations/new">
          <Button className="rounded-xl shadow-md hover:shadow-lg transition-all">
            <Plus className="w-5 h-5 mr-2" />
            {t("reservations.newReservation")}
          </Button>
        </Link>
      </div>

      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder={t("reservations.searchPlaceholder")}
            className="pl-10 h-11 rounded-xl subtle-ring"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-11 rounded-xl subtle-ring">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={t("reservations.filterStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("reservations.allStatuses")}</SelectItem>
              <SelectItem value="pending_payment">{t("reservations.pendingPayment")}</SelectItem>
              <SelectItem value="confirmed">{t("reservations.confirmed")}</SelectItem>
              <SelectItem value="completed">{t("reservations.completed")}</SelectItem>
              <SelectItem value="cancelled">{t("reservations.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold font-display text-foreground mb-2">{t("reservations.notFound")}</h3>
            <p className="text-muted-foreground max-w-sm">
              {search || statusFilter !== "all" 
                ? t("reservations.notFoundFiltered")
                : t("reservations.notFoundEmpty")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("reservations.colId")}</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("reservations.colCustomer")}</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("reservations.colDateTime")}</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("reservations.colDetails")}</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("reservations.colStatus")}</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm uppercase tracking-wider">{t("reservations.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((res) => (
                  <tr key={res.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-4 text-sm font-mono text-muted-foreground">
                      {res.linkId.substring(0,8)}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{res.customerName}</div>
                      {res.customerPhone && <div className="text-sm text-muted-foreground">{res.customerPhone}</div>}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-foreground">{format(new Date(res.date), "MMM d, yyyy")}</div>
                      <div className="text-sm text-muted-foreground">{res.time}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{t("reservations.guests", { n: res.guests })}</div>
                      <div className="text-sm text-primary font-semibold">{t("reservations.deposit", { amount: res.depositAmount.toFixed(2) })}</div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={res.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/reservations/${res.id}`}>
                        <Button variant="secondary" size="sm" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          {t("reservations.manage")}
                        </Button>
                      </Link>
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
