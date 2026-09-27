import { useParams } from "wouter";
import logoUrl from "@assets/ezara_1773754651962.png";
import { useGetReservation, getGetReservationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-6" />
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("payment.expired")}</h2>
          <p className="text-gray-500">
            {t("payment.expiredDesc", { name: "the business" })}
          </p>
        </div>
      </div>
    );
  }

  const { business, ...reservation } = data;

  if (reservation.status === "expired") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("payment.expired")}</h2>
          <p className="text-gray-500">
            {t("payment.expiredDesc", { name: business.name })}
          </p>
        </div>
      </div>
    );
  }

  if (reservation.status === "cancelled") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("payment.cancelled")}</h2>
          <p className="text-gray-500">
            {t("payment.cancelledDesc", { name: business.name })}
          </p>
        </div>
      </div>
    );
  }

  const isConfirmed = reservation.status === "confirmed" || paymentDone;
  const isPending = reservation.status === "pending_payment" && !paymentDone;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <div className="flex items-center gap-2 mb-6">
        <img src={logoUrl} alt="Rezara" className="w-8 h-8 rounded-lg object-contain" />
        <span className="text-xl font-bold tracking-tight brand-name">Rezara</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100"
      >
        {/* Header / Business Info */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
          <div className="relative z-10 flex flex-col items-center">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg mb-4 object-contain"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 shadow-lg backdrop-blur-md">
                <span className="text-3xl font-bold text-white">{business.name[0]}</span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-white">{business.name}</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xs">{business.description}</p>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">{t("payment.reservationDetails")}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {t("payment.for", { name: reservation.customerName, guests: reservation.guests })}
            </p>
          </div>

          <div className="grid gap-4 mb-8">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("payment.date")}</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(reservation.date), "EEEE, MMMM do")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("payment.time")}</p>
                <p className="font-semibold text-gray-900">{reservation.time}</p>
              </div>
            </div>

            {(business.address || business.phone) && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("payment.locationContact")}
                  </p>
                  {business.address && (
                    <p className="font-medium text-gray-900 text-sm leading-tight">
                      {business.address}
                    </p>
                  )}
                  {business.phone && <p className="text-gray-600 text-sm">{business.phone}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-dashed border-gray-200">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {t("payment.depositAmount")}
                </p>
                <p className="text-xs text-gray-400 mt-1">{t("payment.secureBooking")}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black tracking-tight text-gray-900">
                  {Number(reservation.depositAmount).toFixed(2)} MAD
                </div>
                {isPending && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t("payment.chargedInUsd", {
                      amount: Math.max(Number(reservation.depositAmount) / madPerUsd, 0.5).toFixed(2),
                    })}
                  </p>
                )}
              </div>
            </div>

            {isConfirmed ? (
              <div className="w-full h-14 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 mr-2" />
                {t("payment.confirmed")}
              </div>
            ) : isPending && paypalClientId ? (
              <>
                {paymentError && (
                  <p className="text-red-500 text-sm text-center mb-3">{paymentError}</p>
                )}
                <PayPalScriptProvider
                  options={{
                    clientId: paypalClientId,
                    currency: "USD",
                    intent: "capture",
                  }}
                >
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
                        const err = await res.json() as { error: string };
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
                        const err = await res.json() as { error: string };
                        setPaymentError(err.error || "Payment capture failed. Please try again.");
                        return;
                      }
                      setPaymentDone(true);
                      queryClient.invalidateQueries({
                        queryKey: getGetReservationQueryKey(linkId || ""),
                      });
                    }}
                    onError={(err) => {
                      console.error("PayPal error:", err);
                      setPaymentError("Payment was cancelled or failed. Please try again.");
                    }}
                    onCancel={() => {
                      setPaymentError("Payment was cancelled. You can try again.");
                    }}
                  />
                </PayPalScriptProvider>
              </>
            ) : (
              <div className="w-full h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                <span className="text-slate-400 text-sm">{t("payment.loadingPayment")}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
              <Lock className="w-3 h-3" />
              {t("payment.securePayment")}
            </div>
          </div>
        </div>
      </motion.div>

      <p className="mt-8 text-sm text-gray-400 font-medium">{t("payment.poweredBy")} <span className="brand-name">Rezara</span></p>
    </div>
  );
}
