import { ReactNode, useState, useEffect, useRef } from "react";
import logoUrl from "@assets/ezara_1773754651962.png";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useGetNotifications, getGetNotificationsQueryKey } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./language-switcher";

const STORAGE_KEY = "rezara_notifications_last_read";

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

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { data: notifications = [], isLoading } = useGetNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 md:left-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-semibold text-sm text-foreground">{t("notifications.title")}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
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
          notifications.map((n) => (
            <Link key={n.id} href={`/reservations/${n.reservationId}`}>
              <div
                onClick={onClose}
                className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00C896]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {n.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("notifications.paidDeposit")}{" "}
                    <span className="font-semibold text-foreground">
                      {n.amount.toFixed(2)} MAD
                    </span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  {timeAgo(n.paidAt)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border">
          <Link href="/payments">
            <span
              onClick={onClose}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              {t("notifications.viewAll")}
            </span>
          </Link>
        </div>
      )}
    </motion.div>
  );
}

function BellButton() {
  const [open, setOpen] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) || new Date(0).toISOString()
  );
  const ref = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useGetNotifications({
    query: { queryKey: getGetNotificationsQueryKey(), refetchInterval: 30000 },
  });

  const unreadCount = notifications.filter(
    (n) => new Date(n.paidAt) > new Date(lastReadAt)
  ).length;

  function handleOpen() {
    setOpen((v) => !v);
    if (!open) {
      const now = new Date().toISOString();
      setLastReadAt(now);
      localStorage.setItem(STORAGE_KEY, now);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && <NotificationPanel onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "nav.reservations", href: "/reservations", icon: CalendarDays },
    { key: "nav.calendar", href: "/calendar", icon: CalendarDays },
    { key: "nav.payments", href: "/payments", icon: CreditCard },
    { key: "nav.settings", href: "/settings", icon: Settings },
  ];

  if (user?.role === "admin") {
    navigation.push({ key: "nav.admin", href: "/admin", icon: ShieldCheck });
  }

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive =
          location === item.href || location.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{t(item.key)}</span>
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="Rezara" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-bold text-lg tracking-tight brand-name">Rezara</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <BellButton />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-20 px-4"
          >
            <div className="flex flex-col gap-2">
              <NavLinks />
              <div className="mt-8 pt-8 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={logout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {t("nav.signOut")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-72 flex-col bg-card border-r border-border min-h-screen sticky top-0 h-screen p-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Rezara" className="w-10 h-10 rounded-xl object-contain shadow-lg" />
            <span className="font-bold text-2xl tracking-tight brand-name">Rezara</span>
          </div>
          <BellButton />
        </div>

        <div className="px-2 mb-8">
          <LanguageSwitcher />
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <NavLinks />
        </div>

        <div className="mt-auto pt-6 border-t border-border">
          <div className="flex items-center gap-3 px-2 mb-6">
            <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
              <AvatarImage src={user?.profileImage || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user?.firstName?.[0] || user?.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            {t("nav.signOut")}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
