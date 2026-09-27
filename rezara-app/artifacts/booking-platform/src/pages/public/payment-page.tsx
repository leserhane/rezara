import { useParams } from "wouter";
import logoUrl from "@assets/ezara_1773754651962.png";
import { useGetReservation, getGetReservationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Lock,
  Users,
  Phone,
  CalendarPlus,
  Hourglass,
  CheckCircle2,
  Ban,
  SearchX,
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { formatDate, formatMoney, minutesUntil, whatsappUrl } from "@/lib/format";

function usePayPalConfig() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [madPerUsd, setMadPerUsd] = useState(10);

  useEffect(() => {
    fetch("/api/payments/paypal/config")
      .then((r) => r.json())
      .then((d: { clientId: string; madPerUsd?: number }) => {
        setClientId(d.clientId || "test");
        if (d.madPerUsd) setMadPerUsd(d.madPerUsd);
      })
      .catch(() => setClientId("test"));
  }, []);

  return { clientId, madPerUsd };
}

/** Countdown that re-renders every 15s; null when there's no deadline. */
function useMinutesLeft(expiresAt: string | null | undefined) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return minutesUntil(expiresAt);
}

/** A tiny .ics so customers can drop the booking into their calendar. */
function icsHref(opts: { title: string; date: string; time: string; location?: string | null }) {
  const [y, m, d] = opts.date.split("-");
  const [hh, mm] = opts.time.split(":");
  const start = `${y}${m}${d}T${hh}${mm}00`;
  const endHour = String(Math.min(23, Number(hh) + 2)).padStart(2, "0");
  const end = `${y}${m}${d}T${endHour}${mm}00`;
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rezara//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${start}-${Math.random().toString(36).slice(2)}@rezara`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(opts.title)}`,
    ...(opts.location ? [`LOCATION:${esc(opts.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-5 md:py-10">
      <div className="w-full max-w-lg flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="" className="w-7 h-7 rounded-lg object-contain" />
          <span className="text-lg font-bold tracking-tight brand-name">Rezara</span>
        </div>
        <LanguageSwitcher />
      </div>
      {children}
      <p className="mt-8 text-xs text-slate-400 font-medium">
        {t("payment.poweredBy")} <span className="brand-name">Rezara</span>
      </p>
    </div>
  );
}

function StateCard({
  icon: Icon,
  tone,
  title,
  body,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "red" | "slate" | "emerald";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  const tones = {
    red: "bg-red-100 text-red-500",
    slate: "bg-slate-100 text-slate-500",
    emerald: "bg-emerald-100 text-emerald-600",
  };
  return (
    <div className="text-center bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 w-full max-w-lg">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${tones[tone]}`}>
        <Icon className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-500">{body}</p>
      {children}
    </div>
  );
}

export default function PublicPaymentPage() {
  const { t } = useTranslation();
  const { linkId } = useParams();
  const queryClient = useQueryClient();
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { data, isLoading, error } = useGetReservation(linkId || "", {
    query: {
      queryKey: getGetReservationQueryKey(linkId || ""),
      retry: false,
      enabled: !!linkId,
    },
  });

  const { clientId: paypalClientId, madPerUsd } = usePayPalConfig();
  const minutesLeft = useMinutesLeft(data?.status === "pending_payment" && !paymentDone ? data.expiresAt : null);

  if (isLoading) {
    return (
      <Shell>
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-xl">
          <Skeleton className="h-16 w-16 rounded-2xl mx-auto mb-6" />
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <StateCard icon={SearchX} tone="slate" title={t("payment.notFoundTitle")} body={t("payment.notFoundBody")} />
      </Shell>
    );
  }

  const { business, ...reservation } = data;
  const contactHref = business.phone ? whatsappUrl(business.phone, "") : null;
  const contactButton = contactHref ? (
    <a
      href={contactHref}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
    >
      <Phone className="w-4 h-4" />
      {t("payment.contactBusiness", { name: business.name })}
    </a>
  ) : null;

  // Expiry is decided by the server (never locally), so a customer who is
  // mid-checkout in the PayPal window isn't yanked out by a device clock.
  if (reservation.status === "expired") {
    return (
      <Shell>
        <StateCard
          icon={Clock}
          tone="slate"
          title={t("payment.expired")}
          body={t("payment.expiredDesc", { name: business.name })}
        >
          {contactButton}
        </StateCard>
      </Shell>
    );
  }

  if (reservation.status === "cancelled") {
    return (
      <Shell>
        <StateCard
          icon={Ban}
          tone="red"
          title={t("payment.cancelled")}
          body={t("payment.cancelledDesc", { name: business.name })}
        >
          {contactButton}
        </StateCard>
      </Shell>
    );
  }

  // Completed means the visit already happened; the deposit was paid.
  const isConfirmed = reservation.status === "confirmed" || reservation.status === "completed" || paymentDone;
  const isPending = reservation.status === "pending_payment" && !paymentDone;
  const usdAmount = Math.max(Number(reservation.depositAmount) / madPerUsd, 0.5).toFixed(2);

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
      >
        {/* Business */}
        <div className="bg-slate-900 px-6 py-8 text-center">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
              className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg mb-4 object-contain mx-auto"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 mx-auto">
              <span className="text-3xl font-bold text-white">{business.name[0]}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{business.name}</h1>
          {business.description && <p className="text-slate-300 text-sm mt-1 max-w-xs mx-auto">{business.description}</p>}
        </div>

        {isConfirmed && (
          <motion.div
            initial={paymentDone ? { opacity: 0, scale: 0.96 } : false}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-6 mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-emerald-800">{t("payment.confirmed")}</p>
            <p className="text-sm text-emerald-700 mt-1">{t("payment.confirmedDesc")}</p>
          </motion.div>
        )}

        <div className="p-6 md:p-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {t("payment.reservationDetails")}
          </h2>

          <dl className="grid gap-3 mb-6">
            <InfoRow icon={Calendar} tone="bg-blue-100 text-blue-600" label={t("payment.date")}>
              <span className="capitalize">{formatDate(reservation.date, "EEEE d MMMM yyyy")}</span>
            </InfoRow>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={Clock} tone="bg-indigo-100 text-indigo-600" label={t("payment.time")}>
                <span dir="ltr">{reservation.time}</span>
              </InfoRow>
              <InfoRow icon={Users} tone="bg-violet-100 text-violet-600" label={t("payment.guests")}>
                {t("common.guestCount", { count: reservation.guests })}
              </InfoRow>
            </div>
            {(business.address || business.phone) && (
              <InfoRow icon={MapPin} tone="bg-emerald-100 text-emerald-600" label={t("payment.locationContact")}>
                {business.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:underline"
                  >
                    {business.address}
                  </a>
                )}
                {business.phone && (
                  <a href={`tel:${business.phone.replace(/[^\d+]/g, "")}`} className="block text-slate-600 font-normal" dir="ltr">
                    {business.phone}
                  </a>
                )}
              </InfoRow>
            )}
          </dl>

          <p className="text-sm text-slate-500 mb-6">
            {t("payment.for", { name: reservation.customerName })}
          </p>

          {isConfirmed ? (
            <a
              href={icsHref({
                title: `${business.name} — ${t("common.guestCount", { count: reservation.guests })}`,
                date: reservation.date,
                time: reservation.time,
                location: business.address,
              })}
              download="reservation.ics"
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <CalendarPlus className="w-5 h-5" />
              {t("payment.addToCalendar")}
            </a>
          ) : (
            <div className="pt-6 border-t border-dashed border-slate-200">
              <div className="flex justify-between items-end gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {t("payment.depositAmount")}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{t("payment.secureBooking")}</p>
                </div>
                <div className="text-end">
                  <div className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                    {formatMoney(reservation.depositAmount)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{t("payment.chargedInUsd", { amount: usdAmount })}</p>
                </div>
              </div>

              {minutesLeft !== null && (
                <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                  <Hourglass className="w-4 h-4 shrink-0" />
                  {minutesLeft > 0 ? t("payment.expiresIn", { count: minutesLeft }) : t("payment.expiringNow")}
                </div>
              )}

              {paymentError && (
                <p role="alert" className="text-red-600 bg-red-50 rounded-xl px-3 py-2 text-sm text-center mb-3">
                  {paymentError}
                </p>
              )}

              {isPending && paypalClientId ? (
                <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD", intent: "capture" }}>
                  <PayPalButtons
                    style={{ layout: "vertical", shape: "rect", color: "gold", label: "pay" }}
                    createOrder={async () => {
                      setPaymentError(null);
                      const res = await fetch("/api/payments/paypal/create-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ linkId }),
                      });
                      if (!res.ok) {
                        const err = (await res.json().catch(() => ({}))) as { error?: string };
                        setPaymentError(t("payment.errorStart"));
                        // Status may have changed (expired/cancelled) — refresh the page state.
                        queryClient.invalidateQueries({ queryKey: getGetReservationQueryKey(linkId || "") });
                        throw new Error(err.error || "Failed to create order");
                      }
                      const { orderId } = (await res.json()) as { orderId: string };
                      return orderId;
                    }}
                    onApprove={async (paypalData) => {
                      const res = await fetch("/api/payments/paypal/capture-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId: paypalData.orderID, linkId }),
                      });
                      if (!res.ok) {
                        setPaymentError(t("payment.errorCapture"));
                        return;
                      }
                      setPaymentDone(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      queryClient.invalidateQueries({ queryKey: getGetReservationQueryKey(linkId || "") });
                    }}
                    onError={(err) => {
                      console.error("PayPal error:", err);
                      setPaymentError((prev) => prev ?? t("payment.errorGeneric"));
                    }}
                    onCancel={() => setPaymentError(t("payment.errorCancelled"))}
                  />
                </PayPalScriptProvider>
              ) : (
                <div className="w-full h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">{t("payment.loadingPayment")}</span>
                </div>
              )}

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                <Lock className="w-3 h-3" />
                {t("payment.securePayment")}
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("payment.keepLink")}
            </div>
          )}
        </div>
      </motion.div>
    </Shell>
  );
}

function InfoRow({
  icon: Icon,
  tone,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 min-w-0">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</dt>
        <dd className="font-semibold text-slate-900 text-sm leading-snug break-words">{children}</dd>
      </div>
    </div>
  );
}
