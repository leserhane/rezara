import { ReactNode, useState, useEffect, useRef } from "react";
import logoUrl from "@assets/ezara_1773754651962.png";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  CreditCard,
  Settings,
  LogOut,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Plus,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetNotifications,
  getGetNotificationsQueryKey,
  useGetMyBusiness,
  getGetMyBusinessQueryKey,
} from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./language-switcher";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "rezara_notifications_last_read";

function readLastRead(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || new Date(0).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

function useTimeAgo() {
  const { t } = useTranslation();
  return (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("notifications.justNow");
    if (mins < 60) return t("notifications.mAgo", { n: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("notifications.hAgo", { n: hrs });
    return t("notifications.dAgo", { n: Math.floor(hrs / 24) });
  };
}

function NotificationPanel({ onClose, lastReadAt }: { onClose: () => void; lastReadAt: string }) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { data: notifications = [], isLoading } = useGetNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      role="dialog"
      aria-label={t("notifications.title")}
      className="absolute end-0 md:end-auto md:start-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-semibold text-sm text-foreground">{t("notifications.title")}</span>
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">{t("notifications.loading")}</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
          </div>
        ) : (
          notifications.map((n) => {
            const unread = new Date(n.paidAt) > new Date(lastReadAt);
            return (
              <Link key={n.id} href={`/reservations/${n.reservationId}`} onClick={onClose}>
                <div
                  className={cn(
                    "flex items-start gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer",
                    unread && "bg-primary/5",
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">{n.customerName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("notifications.paidDeposit")}{" "}
                      <span className="font-semibold text-foreground">{formatMoney(n.amount)}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{timeAgo(n.paidAt)}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border">
          <Link href="/payments" onClick={onClose} className="text-xs font-semibold text-primary hover:underline">
            {t("notifications.viewAll")}
          </Link>
        </div>
      )}
    </motion.div>
  );
}

function BellButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<string>(readLastRead);
  // What was "unread" when the panel opened, so items stay highlighted while it's open.
  const [panelLastReadAt, setPanelLastReadAt] = useState<string>(lastReadAt);
  const ref = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useGetNotifications({
    query: { queryKey: getGetNotificationsQueryKey(), refetchInterval: 30000 },
  });

  const unreadCount = notifications.filter((n) => new Date(n.paidAt) > new Date(lastReadAt)).length;

  function handleOpen() {
    if (!open) {
      const now = new Date().toISOString();
      setPanelLastReadAt(lastReadAt);
      setLastReadAt(now);
      try {
        localStorage.setItem(STORAGE_KEY, now);
      } catch {
        /* ignore */
      }
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={unreadCount > 0 ? t("notifications.unreadLabel", { n: unreadCount }) : t("notifications.title")}
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 end-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && <NotificationPanel onClose={() => setOpen(false)} lastReadAt={panelLastReadAt} />}
      </AnimatePresence>
    </div>
  );
}

function isActivePath(location: string, href: string) {
  return location === href || location.startsWith(`${href}/`);
}

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { data: business } = useGetMyBusiness({
    query: { queryKey: getGetMyBusinessQueryKey(), retry: false, enabled: user?.role !== "admin" },
  });

  const navigation = [
    { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "nav.reservations", href: "/reservations", icon: ListChecks },
    { key: "nav.calendar", href: "/calendar", icon: CalendarDays },
    { key: "nav.payments", href: "/payments", icon: CreditCard },
    { key: "nav.settings", href: "/settings", icon: Settings },
  ];
  if (user?.role === "admin") {
    navigation.push({ key: "nav.admin", href: "/admin", icon: ShieldCheck });
  }

  // "/reservations/new" belongs to the New button, not the Reservations tab.
  const onNewPage = location === "/reservations/new";
  const displayName = business?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;

  const mobileTabs = [
    { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "nav.reservations", href: "/reservations", icon: ListChecks },
    { key: "new", href: "/reservations/new", icon: Plus },
    { key: "nav.calendar", href: "/calendar", icon: CalendarDays },
  ];
  const moreItems = navigation.filter((n) => !mobileTabs.some((m) => m.href === n.href));
  const moreActive = moreItems.some((n) => isActivePath(location, n.href));

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[100] focus:bg-card focus:px-4 focus:py-2 focus:rounded-lg focus:shadow"
      >
        {t("common.skipToContent")}
      </a>

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-card/95 backdrop-blur border-b border-border sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <img src={logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-bold text-lg tracking-tight brand-name">Rezara</span>
        </Link>
        <BellButton />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 lg:w-72 flex-col bg-card border-e border-border sticky top-0 h-screen p-5">
        <div className="flex items-center justify-between mb-6 px-1">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img src={logoUrl} alt="" className="w-10 h-10 rounded-xl object-contain shadow" />
            <span className="font-bold text-2xl tracking-tight brand-name">Rezara</span>
          </Link>
          <BellButton />
        </div>

        <Link href="/reservations/new">
          <Button className="w-full h-11 rounded-xl shadow-md shadow-primary/20 mb-6 gap-2">
            <Plus className="w-5 h-5" />
            {t("dashboard.newReservation")}
          </Button>
        </Link>

        <nav aria-label={t("common.mainNav")} className="flex-1 flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = !onNewPage && isActivePath(location, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-5 border-t border-border space-y-4">
          <div className="px-1 min-w-0">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            {business?.name && user?.email && (
              <p className="text-xs text-muted-foreground truncate" dir="ltr">
                {user.email}
              </p>
            )}
          </div>
          <LanguageSwitcher />
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground gap-3"
            onClick={logout}
          >
            <LogOut className="w-5 h-5 rtl:rotate-180" />
            {t("nav.signOut")}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main id="main" className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 py-5 md:p-8 pb-28 md:pb-8">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile bottom tab bar: the day-to-day actions within thumb reach */}
      <nav
        aria-label={t("common.mainNav")}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16">
          {mobileTabs.map((item) => {
            const Icon = item.icon;
            if (item.key === "new") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={t("dashboard.newReservation")}
                  className="flex items-center justify-center"
                >
                  <span
                    className={cn(
                      "w-12 h-12 -mt-5 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-background",
                      onNewPage && "bg-primary/90",
                    )}
                  >
                    <Plus className="w-6 h-6" />
                  </span>
                </Link>
              );
            }
            const isActive = !onNewPage && isActivePath(location, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate max-w-full px-1">{t(item.key)}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              moreActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>{t("nav.more")}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="text-start mb-2">
            <SheetTitle className="truncate">{displayName}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(location, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl font-medium",
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-muted",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {t(item.key)}
                </Link>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" className="text-destructive hover:text-destructive gap-2" onClick={logout}>
              <LogOut className="w-4 h-4 rtl:rotate-180" />
              {t("nav.signOut")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
