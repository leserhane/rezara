import { useParams, Link } from "wouter";
import { useState } from "react";
import { useGetReservations, useChangeReservationStatus, getGetDashboardStatsQueryKey, getGetReservationsQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Copy, Link as LinkIcon, Share2, CheckCircle2, Calendar as CalIcon, Users, Clock, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "../dashboard";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { usePublicBaseUrl } from "@/hooks/use-public-base-url";

export default function ReservationDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const publicBaseUrl = usePublicBaseUrl();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useGetReservations();
  const changeStatusMutation = useChangeReservationStatus();

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  const reservation = reservations?.find(r => r.id.toString() === id);

  if (!reservation) {
    return <div className="p-10 text-center">{t("reservationDetail.notFound")}</div>;
  }

  const STATUS_OPTIONS = [
    { value: "pending_payment", label: t("reservations.pendingPayment") },
    { value: "confirmed", label: t("reservations.confirmed") },
    { value: "completed", label: t("reservations.completed") },
    { value: "cancelled", label: t("reservations.cancelled") },
    { value: "expired", label: t("status.expired") },
  ] as const;

  const currentStatus = selectedStatus ?? reservation.status;

  const publicLink = `${publicBaseUrl}/r/${reservation.linkId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast({ title: t("reservationDetail.copied"), description: t("reservationDetail.copiedDesc") });
  };

  function formatPhoneForWhatsApp(phone: string): string {
    return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  }

  const waMessage = t("newReservation.waMessage", {
    name: reservation.customerName,
    date: reservation.date,
    time: reservation.time,
    amount: reservation.depositAmount,
    link: publicLink,
  });
  const waPhone = reservation.customerPhone ? formatPhoneForWhatsApp(reservation.customerPhone) : "";
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  const handleStatusChange = async () => {
    if (!selectedStatus || selectedStatus === reservation.status) return;
    try {
      await changeStatusMutation.mutateAsync({
        reservationId: reservation.linkId,
        data: { status: selectedStatus as "pending_payment" | "confirmed" | "cancelled" | "completed" | "expired" },
      });
      queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      toast({ title: t("reservationDetail.statusUpdated") });
      setSelectedStatus(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const isConfirmed = reservation.status === 'confirmed';
  const isPending = reservation.status === 'pending_payment';
  const hasStatusChange = selectedStatus !== null && selectedStatus !== reservation.status;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/reservations">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-display text-foreground">{reservation.customerName}</h1>
            <StatusBadge status={reservation.status} />
          </div>
          <p className="text-muted-foreground mt-1">ID: <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{reservation.linkId}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h2 className="font-bold font-display text-xl flex items-center gap-2">
                <CalIcon className="w-5 h-5 text-primary" /> {t("reservationDetail.reservationDetails")}
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-y-8 gap-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t("reservationDetail.dateLabel")}</p>
                <p className="font-semibold text-lg">{format(new Date(reservation.date), "EEEE, MMMM do, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t("reservationDetail.timeLabel")}</p>
                <p className="font-semibold text-lg flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground"/> {reservation.time}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t("reservationDetail.guestsLabel")}</p>
                <p className="font-semibold text-lg flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground"/> {reservation.guests}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t("newReservation.whatsapp")}</p>
                <p className="font-semibold text-lg">{reservation.customerPhone || "—"}</p>
              </div>

              {reservation.notes && (
                <div className="col-span-2 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">{t("reservationDetail.notesLabel")}</p>
                  <p className="text-foreground bg-muted/30 p-4 rounded-xl">{reservation.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Management Card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h2 className="font-bold font-display text-xl flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" /> {t("reservationDetail.statusCard")}
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                {t("reservationDetail.statusHint")}
              </p>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedStatus ?? reservation.status}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="rounded-xl flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStatusChange}
                  disabled={!hasStatusChange || changeStatusMutation.isPending}
                  className="rounded-xl px-6"
                >
                  {changeStatusMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : t("reservationDetail.applyStatus")
                  }
                </Button>
              </div>
              {hasStatusChange && (
                <p className="text-xs text-muted-foreground mt-3">
                  {t("reservationDetail.changingFrom")} <span className="font-semibold">{STATUS_OPTIONS.find(s => s.value === reservation.status)?.label}</span>{" "}
                  {t("reservationDetail.changingTo")} <span className="font-semibold">{STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment Link Card */}
          <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-2xl border border-primary/20 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                <LinkIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold font-display text-lg mb-1">{t("reservationDetail.paymentLink")}</h3>

              {isPending ? (
                <p className="text-sm text-muted-foreground mb-6">{t("reservationDetail.depositLabel")}: {reservation.depositAmount} MAD</p>
              ) : isConfirmed ? (
                <p className="text-sm text-emerald-600 font-medium mb-6 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> {t("payment.confirmed")} ({reservation.depositAmount} MAD)</p>
              ) : (
                <p className="text-sm text-muted-foreground mb-6">{t("reservationDetail.depositLabel")}: {reservation.depositAmount} MAD</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-border">
                  <div className="flex-1 truncate text-sm font-mono text-muted-foreground">{publicLink}</div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={copyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white shadow-md shadow-green-500/20 h-10 px-4 py-2 text-sm font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" /> {t("reservationDetail.shareWhatsApp")}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-bold font-display mb-4">{t("reservationDetail.idLabel")} {reservation.linkId}</h3>
            <div className="space-y-4">
              <div className="flex gap-4 relative">
                <div className="absolute left-2 top-6 bottom-[-20px] w-[2px] bg-border"></div>
                <div className="w-4 h-4 rounded-full bg-primary mt-1 relative z-10 ring-4 ring-background"></div>
                <div>
                  <p className="font-medium text-sm">{t("newReservation.toastCreated")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(reservation.createdAt), "MMM d, h:mm a")}</p>
                </div>
              </div>
              {isConfirmed && (
                <div className="flex gap-4 relative">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 mt-1 relative z-10 ring-4 ring-background"></div>
                  <div>
                    <p className="font-medium text-sm">{t("payment.confirmed")}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(reservation.updatedAt), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
