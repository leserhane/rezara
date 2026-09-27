import {
  useGetDashboardStats,
  useGetMyBusiness,
  getGetMyBusinessQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import {
  CalendarCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  Wallet,
  ArrowRight,
  Store,
  Plus,
  Hourglass,
  Send,
  UserRoundPen,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { ReservationRow } from "@/components/reservation-row";
import { formatDate, formatMoney, localDateString } from "@/lib/format";
import { cn } from "@/lib/utils";

// Kept for backwards compatibility with pages that imported it from here.
export { StatusBadge } from "@/components/status-badge";

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return "dashboard.goodMorning";
  if (h < 18) return "dashboard.goodAfternoon";
  return "dashboard.goodEvening";
}

export default function Dashboard() {
  const { t } = useTranslation();
  const today = localDateString();
  const { data: business, isLoading: isBusinessLoading } = useGetMyBusiness({
    query: { queryKey: getGetMyBusinessQueryKey(), retry: false },
  });

  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats(
    { today },
    { query: { queryKey: getGetDashboardStatsQueryKey({ today }), enabled: !!business, refetchInterval: 60000 } },
  );

  if (isBusinessLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!business) {
    return <Onboarding />;
  }

  const upcoming = stats?.upcomingReservations ?? [];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground capitalize">{formatDate(new Date(), "EEEE d MMMM")}</p>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mt-0.5 truncate">
            {t(greetingKey(), { name: business.name })}
          </h1>
        </div>
        <Link href="/reservations/new" className="hidden sm:block">
          <Button className="rounded-xl shadow-md gap-2">
            <Plus className="w-4 h-4" />
            {t("dashboard.newReservation")}
          </Button>
        </Link>
      </div>

      {isStatsLoading || !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {stats.pendingPayment > 0 && (
            <Link
              href="/reservations?status=pending_payment"
              className="flex items-center gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/70 transition-colors"
            >
              <Hourglass className="w-5 h-5 shrink-0 text-amber-600" />
              <p className="flex-1 text-sm font-medium">
                {t("dashboard.awaitingCallout", { count: stats.pendingPayment })}
              </p>
              <ArrowRight className="w-4 h-4 shrink-0 rtl:rotate-180" />
            </Link>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <StatCard
              title={t("dashboard.totalRevenue")}
              value={formatMoney(stats.totalRevenue)}
              icon={Wallet}
              tone="emerald"
              href="/payments"
            />
            <StatCard
              title={t("dashboard.pendingPayments")}
              value={stats.pendingPayment}
              icon={CreditCard}
              tone="amber"
              href="/reservations?status=pending_payment"
            />
            <StatCard
              title={t("dashboard.confirmedBookings")}
              value={stats.confirmed}
              icon={CheckCircle2}
              tone="blue"
              href="/reservations?status=confirmed"
            />
            <StatCard
              title={t("dashboard.cancellations")}
              value={stats.cancelled}
              icon={XCircle}
              tone="red"
              href="/reservations?status=cancelled"
            />
          </div>

          <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-border flex justify-between items-center gap-4">
              <h2 className="text-lg md:text-xl font-bold font-display flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" />
                {t("dashboard.upcoming")}
              </h2>
              <Link
                href="/reservations"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                {t("dashboard.viewAll")} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-muted-foreground mb-4">{t("dashboard.noUpcoming")}</p>
                <Link href="/reservations/new">
                  <Button variant="outline" className="rounded-xl gap-2">
                    <Plus className="w-4 h-4" />
                    {t("dashboard.newReservation")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcoming.map((r) => (
                  <ReservationRow key={r.id} reservation={r} />
                ))}
              </div>
            )}
          </section>

        </>
      )}
    </div>
  );
}

function Onboarding() {
  const { t } = useTranslation();
  const steps = [
    { icon: UserRoundPen, title: t("dashboard.step1Title"), body: t("dashboard.step1Body") },
    { icon: Plus, title: t("dashboard.step2Title"), body: t("dashboard.step2Body") },
    { icon: Send, title: t("dashboard.step3Title"), body: t("dashboard.step3Body") },
  ];
  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm p-6 md:p-12">
      <div className="max-w-xl mx-auto text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Store className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">{t("dashboard.welcomeTitle")}</h1>
        <p className="text-muted-foreground mb-8">{t("dashboard.welcomeBody")}</p>
      </div>
      <ol className="grid gap-3 md:grid-cols-3 max-w-3xl mx-auto mb-8">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className={cn(
              "rounded-2xl border p-4 text-start",
              i === 0 ? "border-primary/40 bg-primary/5" : "border-border",
            )}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={cn(
                  "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
                  i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className="font-semibold text-sm">{s.title}</span>
            </div>
            <p className="text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
      <div className="text-center">
        <Link href="/settings">
          <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20">
            {t("dashboard.setupProfile")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

const TONES = {
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  red: "bg-red-100 text-red-600",
} as const;

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof TONES;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all block"
    >
      <div className="flex justify-between items-start gap-2">
        <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0", TONES[tone])}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      </div>
      <p className="text-xl md:text-3xl font-bold font-display text-foreground mt-2 truncate">{value}</p>
    </Link>
  );
}
