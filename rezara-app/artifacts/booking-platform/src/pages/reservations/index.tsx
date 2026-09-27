import { useMemo, useState } from "react";
import { useGetReservations } from "@workspace/api-client-react";
import { Link, useLocation, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { Plus, Search, CalendarX2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ReservationRow } from "@/components/reservation-row";
import { localDateString } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUSES = ["pending_payment", "confirmed", "completed", "cancelled", "expired"] as const;
type StatusFilter = (typeof STATUSES)[number] | "all";
type When = "upcoming" | "past" | "all";

export default function ReservationsList() {
  const { t } = useTranslation();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const statusParam = params.get("status");
  const statusFilter: StatusFilter = STATUSES.includes(statusParam as never) ? (statusParam as StatusFilter) : "all";
  const whenParam = params.get("when");
  // Default to upcoming: that's what staff open this screen for. A status
  // filter (e.g. from a dashboard card) shows every date by default.
  const when: When =
    whenParam === "past" || whenParam === "all" || whenParam === "upcoming"
      ? whenParam
      : statusFilter === "all"
        ? "upcoming"
        : "all";
  const [query, setQuery] = useState("");

  const { data: reservations, isLoading } = useGetReservations();

  function updateParams(next: { status?: StatusFilter; when?: When }) {
    const p = new URLSearchParams(search);
    const status = next.status ?? statusFilter;
    const w = next.when ?? when;
    if (status === "all") p.delete("status");
    else p.set("status", status);
    p.set("when", w);
    setLocation(`/reservations?${p.toString()}`, { replace: true });
  }

  const today = localDateString();

  const byWhen = useMemo(() => {
    const list = reservations ?? [];
    if (when === "upcoming") return list.filter((r) => r.date >= today);
    if (when === "past") return list.filter((r) => r.date < today);
    return list;
  }, [reservations, when, today]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: byWhen.length };
    for (const r of byWhen) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [byWhen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    const list = byWhen.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.linkId.toLowerCase().includes(q) ||
        (qDigits.length >= 3 && (r.customerPhone ?? "").replace(/\D/g, "").includes(qDigits))
      );
    });
    const key = (r: { date: string; time: string }) => `${r.date} ${r.time}`;
    // Upcoming: soonest first. Past/all: most recent first.
    return list.sort((a, b) => (when === "upcoming" ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a))));
  }, [byWhen, statusFilter, query, when]);

  const chips: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t("reservations.allStatuses") },
    { value: "pending_payment", label: t("status.pending_payment") },
    { value: "confirmed", label: t("status.confirmed") },
    { value: "completed", label: t("status.completed") },
    { value: "cancelled", label: t("status.cancelled") },
    { value: "expired", label: t("status.expired") },
  ];

  const isFiltered = !!query || statusFilter !== "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">{t("reservations.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("reservations.subtitle")}</p>
        </div>
        <Link href="/reservations/new" className="hidden sm:block">
          <Button className="rounded-xl shadow-md gap-2">
            <Plus className="w-5 h-5" />
            {t("reservations.newReservation")}
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              aria-label={t("reservations.searchPlaceholder")}
              placeholder={t("reservations.searchPlaceholder")}
              className="ps-10 h-11 rounded-xl subtle-ring bg-card"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div
            role="tablist"
            aria-label={t("reservations.when")}
            className="inline-flex bg-muted/70 rounded-xl p-1 border border-border self-start sm:self-auto"
          >
            {(["upcoming", "past", "all"] as const).map((w) => (
              <button
                key={w}
                role="tab"
                aria-selected={when === w}
                onClick={() => updateParams({ when: w })}
                className={cn(
                  "px-3 h-9 rounded-lg text-sm font-medium transition-colors",
                  when === w ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`reservations.when_${w}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
          {chips.map((c) => {
            const active = statusFilter === c.value;
            const n = counts[c.value] ?? 0;
            return (
              <button
                key={c.value}
                onClick={() => updateParams({ status: c.value })}
                aria-pressed={active}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border hover:text-foreground",
                )}
              >
                {c.label}
                <span className={cn("text-xs tabular-nums", active ? "opacity-80" : "opacity-60")}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CalendarX2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold font-display text-foreground mb-1">{t("reservations.notFound")}</h2>
            <p className="text-muted-foreground max-w-sm mb-5">
              {isFiltered
                ? t("reservations.notFoundFiltered")
                : when === "upcoming"
                  ? t("reservations.noUpcoming")
                  : t("reservations.notFoundEmpty")}
            </p>
            {isFiltered ? (
              <Button
                variant="outline"
                className="rounded-xl gap-2"
                onClick={() => {
                  setQuery("");
                  updateParams({ status: "all" });
                }}
              >
                <X className="w-4 h-4" />
                {t("reservations.clearFilters")}
              </Button>
            ) : (
              <Link href="/reservations/new">
                <Button className="rounded-xl gap-2">
                  <Plus className="w-4 h-4" />
                  {t("reservations.newReservation")}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((r) => (
              <ReservationRow key={r.id} reservation={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
