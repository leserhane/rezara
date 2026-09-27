import { useParams, Link, useSearch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  useGetReservations,
  useChangeReservationStatus,
  useUpdateReservation,
  getGetDashboardStatsQueryKey,
  getGetReservationsQueryKey,
  type Reservation,
} from "@workspace/api-client-react";
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  CheckCircle2,
  Calendar as CalIcon,
  Users,
  Clock,
  Loader2,
  Phone,
  MessageCircle,
  Pencil,
  Hourglass,
  RotateCcw,
  Ban,
  Banknote,
  PartyPopper,
  Wallet,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useAppConfig } from "@/hooks/use-public-base-url";
import { formatDate, formatMoney, formatRelativeDay, minutesUntil, whatsappUrl, localDateString } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

type Status = Reservation["status"];

/** Re-render every 30s so the "expires in" countdown stays honest. */
function useTick(active: boolean) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setN((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [active]);
}

export default function ReservationDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const justCreated = new URLSearchParams(search).get("created") === "1";
  const { publicBaseUrl, reservationExpiryMinutes } = useAppConfig();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Poll while a payment is pending so the page flips to "Paid" on its own.
  const [pollPending, setPollPending] = useState(false);
  const { data: reservations, isLoading } = useGetReservations(undefined, {
    query: {
      queryKey: getGetReservationsQueryKey(),
      refetchInterval: pollPending ? 15000 : false,
    },
  });
  const changeStatusMutation = useChangeReservationStatus();
  const [confirmAction, setConfirmAction] = useState<null | { status: Status; title: string; body: string }>(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<"link" | "message" | null>(null);

  const reservation = reservations?.find((r) => r.id.toString() === id);
  const isPending = reservation?.status === "pending_payment";
  useTick(!!isPending);
  useEffect(() => setPollPending(!!isPending), [isPending]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-lg font-semibold mb-4">{t("reservationDetail.notFound")}</p>
        <Link href="/reservations">
          <Button variant="outline" className="rounded-xl">
            {t("reservationDetail.back")}
          </Button>
        </Link>
      </div>
    );
  }

  const r = reservation;
  const publicLink = `${publicBaseUrl}/r/${r.linkId}`;
  const minutesLeft = minutesUntil(r.expiresAt);
  const isPast = r.date < localDateString();

  const shareMessage = t("newReservation.waMessage", {
    name: r.customerName,
    date: formatDate(r.date, "EEEE d MMMM"),
    time: r.time,
    amount: formatMoney(r.depositAmount),
    link: publicLink,
    minutes: minutesLeft !== null && minutesLeft > 0 ? minutesLeft : reservationExpiryMinutes,
  });
  const waShareUrl = whatsappUrl(r.customerPhone, shareMessage);
  const waChatUrl = whatsappUrl(r.customerPhone, "");

  async function copy(text: string, which: "link" | "message") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
      toast({ title: t("reservationDetail.copied") });
    } catch {
      toast({ variant: "destructive", title: t("reservationDetail.copyFailed") });
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: t("reservationDetail.paymentLink"), text: shareMessage });
    } catch {
      /* user dismissed the share sheet */
    }
  }

  async function changeStatus(status: Status, successTitle: string) {
    try {
      await changeStatusMutation.mutateAsync({ reservationId: r.linkId, data: { status } });
      await queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      toast({ title: successTitle });
      if (justCreated) setLocation(`/reservations/${r.id}`, { replace: true });
    } catch (e) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: apiErrorMessage(e, t("reservationDetail.statusFailed")),
      });
    }
  }

  const busy = changeStatusMutation.isPending;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const shareButtons = (
    <div className="space-y-2.5">
      <a
        href={waShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#1fa855] hover:bg-[#1a9149] text-white shadow-md shadow-green-600/20 h-11 px-4 text-sm font-semibold transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        {r.customerPhone
          ? t("reservationDetail.sendWhatsAppTo", { name: r.customerName.split(" ")[0] })
          : t("reservationDetail.shareWhatsApp")}
      </a>
      <div className={cn("grid gap-2", canShare ? "grid-cols-3" : "grid-cols-2")}>
        <Button variant="outline" className="rounded-xl gap-1.5 h-10" onClick={() => copy(publicLink, "link")}>
          {copied === "link" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {t("reservationDetail.copyLink")}
        </Button>
        <Button variant="outline" className="rounded-xl gap-1.5 h-10" onClick={() => copy(shareMessage, "message")}>
          {copied === "message" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {t("reservationDetail.copyMessage")}
        </Button>
        {canShare && (
          <Button variant="outline" className="rounded-xl gap-1.5 h-10" onClick={nativeShare}>
            <Share2 className="w-4 h-4" />
            {t("reservationDetail.share")}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground font-mono truncate px-1" dir="ltr" title={publicLink}>
        {publicLink}
      </p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-start gap-3">
        <Link href="/reservations">
          <Button variant="outline" size="icon" className="rounded-xl shrink-0" aria-label={t("reservationDetail.back")}>
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground truncate">{r.customerName}</h1>
            <StatusBadge status={r.status} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatRelativeDay(r.date)} · <span dir="ltr">{r.time}</span> ·{" "}
            {t("common.guestCount", { count: r.guests })}
          </p>
        </div>
      </div>

      {justCreated && isPending && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900">
          <PartyPopper className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <p className="font-semibold">{t("reservationDetail.createdTitle")}</p>
            <p className="text-sm">{t("reservationDetail.createdBody", { name: r.customerName })}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Next step: what the owner should do now, by status */}
        <section className="lg:col-span-3 lg:order-2 bg-card rounded-2xl border border-border shadow-sm p-5 md:p-6 space-y-5 h-fit">
          {r.status === "pending_payment" && (
            <>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Hourglass className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold font-display text-lg">
                    {t("reservationDetail.waitingTitle", { amount: formatMoney(r.depositAmount) })}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {minutesLeft !== null && minutesLeft > 0
                      ? t("reservationDetail.expiresIn", { count: minutesLeft })
                      : t("reservationDetail.expiringNow")}
                  </p>
                </div>
              </div>
              {shareButtons}
              <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  className="rounded-xl gap-2 h-10"
                  disabled={busy}
                  onClick={() =>
                    setConfirmAction({
                      status: "confirmed",
                      title: t("reservationDetail.markPaidTitle"),
                      body: t("reservationDetail.markPaidBody", {
                        amount: formatMoney(r.depositAmount),
                        name: r.customerName,
                      }),
                    })
                  }
                >
                  <Banknote className="w-4 h-4" />
                  {t("reservationDetail.markPaid")}
                </Button>
                <CancelButton busy={busy} onClick={() => setConfirmAction(cancelAction(t, r.customerName))} />
              </div>
            </>
          )}

          {r.status === "expired" && (
            <>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h2 className="font-bold font-display text-lg">{t("reservationDetail.expiredTitle")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("reservationDetail.expiredBody", { minutes: reservationExpiryMinutes })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  className="rounded-xl gap-2 h-11"
                  disabled={busy || isPast}
                  onClick={() => changeStatus("pending_payment", t("reservationDetail.reactivated"))}
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  {t("reservationDetail.reactivate")}
                </Button>
                <CancelButton busy={busy} onClick={() => setConfirmAction(cancelAction(t, r.customerName))} />
              </div>
              {isPast && <p className="text-xs text-muted-foreground">{t("reservationDetail.pastDate")}</p>}
            </>
          )}

          {r.status === "confirmed" && (
            <>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-bold font-display text-lg">
                    {t("reservationDetail.confirmedTitle", { amount: formatMoney(r.depositAmount) })}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t("reservationDetail.confirmedBody")}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  className="rounded-xl gap-2 h-11"
                  disabled={busy}
                  onClick={() => changeStatus("completed", t("reservationDetail.markedCompleted"))}
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {t("reservationDetail.markCompleted")}
                </Button>
                <CancelButton busy={busy} onClick={() => setConfirmAction(cancelAction(t, r.customerName, true))} />
              </div>
            </>
          )}

          {r.status === "completed" && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold font-display text-lg">{t("reservationDetail.completedTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("reservationDetail.completedBody")}</p>
              </div>
            </div>
          )}

          {r.status === "cancelled" && (
            <>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="font-bold font-display text-lg">{t("reservationDetail.cancelledTitle")}</h2>
                  <p className="text-sm text-muted-foreground">{t("reservationDetail.cancelledBody")}</p>
                </div>
              </div>
              {!isPast && (
                <Button
                  variant="outline"
                  className="rounded-xl gap-2 h-10"
                  disabled={busy}
                  onClick={() => changeStatus("pending_payment", t("reservationDetail.reactivated"))}
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("reservationDetail.restore")}
                </Button>
              )}
            </>
          )}
        </section>

        {/* Details */}
        <section className="lg:col-span-2 lg:order-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold font-display text-lg">{t("reservationDetail.reservationDetails")}</h2>
            {r.status !== "completed" && (
              <Button variant="ghost" size="sm" className="rounded-lg gap-1.5" onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" />
                {t("common.edit")}
              </Button>
            )}
          </div>
          <dl className="p-5 space-y-4">
            <DetailRow icon={CalIcon} label={t("reservationDetail.dateLabel")}>
              <span className="capitalize">{formatDate(r.date, "EEEE d MMMM yyyy")}</span>
            </DetailRow>
            <DetailRow icon={Clock} label={t("reservationDetail.timeLabel")}>
              <span dir="ltr">{r.time}</span>
            </DetailRow>
            <DetailRow icon={Users} label={t("reservationDetail.guestsLabel")}>
              {t("common.guestCount", { count: r.guests })}
            </DetailRow>
            <DetailRow icon={Wallet} label={t("reservationDetail.depositLabel")}>
              {formatMoney(r.depositAmount)}
            </DetailRow>
            <DetailRow icon={Phone} label={t("newReservation.whatsapp")}>
              {r.customerPhone ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr">{r.customerPhone}</span>
                  <a
                    href={`tel:${r.customerPhone.replace(/[^\d+]/g, "")}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {t("reservationDetail.call")}
                  </a>
                  <a
                    href={waChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    WhatsApp
                  </a>
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </DetailRow>
            {r.notes && (
              <DetailRow icon={StickyNote} label={t("reservationDetail.notesLabel")}>
                <p className="whitespace-pre-wrap font-normal">{r.notes}</p>
              </DetailRow>
            )}
          </dl>
          <div className="px-5 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
            <span>
              {t("reservationDetail.createdAt", { when: formatDate(new Date(r.createdAt), "d MMM, HH:mm") })}
            </span>
            <span className="font-mono" dir="ltr">
              #{r.linkId}
            </span>
          </div>
        </section>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.back")}</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "rounded-xl",
                confirmAction?.status === "cancelled" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              onClick={() => {
                if (!confirmAction) return;
                const s = confirmAction.status;
                changeStatus(
                  s,
                  s === "cancelled" ? t("reservationDetail.cancelledToast") : t("reservationDetail.markedPaid"),
                );
              }}
            >
              {confirmAction?.status === "cancelled"
                ? t("reservationDetail.cancelConfirm")
                : t("reservationDetail.markPaid")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editing && <EditReservationDialog reservation={r} onClose={() => setEditing(false)} />}
    </div>
  );
}

function cancelAction(t: (k: string, o?: Record<string, unknown>) => string, name: string, paid = false) {
  return {
    status: "cancelled" as Status,
    title: t("reservationDetail.cancelTitle"),
    body: paid ? t("reservationDetail.cancelBodyPaid", { name }) : t("reservationDetail.cancelBody", { name }),
  };
}

function CancelButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <Button
      variant="ghost"
      className="rounded-xl gap-2 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
      disabled={busy}
      onClick={onClick}
    >
      <Ban className="w-4 h-4" />
      {t("reservationDetail.cancelReservation")}
    </Button>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="font-semibold text-foreground mt-0.5 break-words">{children}</dd>
      </div>
    </div>
  );
}

function EditReservationDialog({ reservation: r, onClose }: { reservation: Reservation; onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateReservation();
  const depositLocked = r.status === "confirmed" || r.status === "completed";
  const [form, setForm] = useState({
    customerName: r.customerName,
    customerPhone: r.customerPhone ?? "",
    date: r.date,
    time: r.time,
    guests: String(r.guests),
    depositAmount: String(r.depositAmount),
    notes: r.notes ?? "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const invalid =
    form.customerName.trim().length < 2 ||
    !form.date ||
    !/^\d{2}:\d{2}$/.test(form.time) ||
    !(Number(form.guests) >= 1) ||
    !(Number(form.depositAmount) > 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    try {
      await updateMutation.mutateAsync({
        reservationId: r.linkId,
        data: {
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim() || null,
          date: form.date,
          time: form.time,
          guests: Math.round(Number(form.guests)),
          ...(depositLocked ? {} : { depositAmount: Number(form.depositAmount) }),
          notes: form.notes.trim() || null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      toast({ title: t("reservationDetail.saved") });
      onClose();
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: apiErrorMessage(err, t("reservationDetail.saveFailed")),
      });
    }
  }

  const label = "text-sm font-semibold";
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("reservationDetail.editTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="e-name" className={label}>
                {t("newReservation.customerName")}
              </label>
              <Input id="e-name" value={form.customerName} onChange={set("customerName")} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="e-phone" className={label}>
                {t("newReservation.whatsapp")}
              </label>
              <Input
                id="e-phone"
                type="tel"
                dir="ltr"
                value={form.customerPhone}
                onChange={set("customerPhone")}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="e-date" className={label}>
                {t("newReservation.date")}
              </label>
              <Input id="e-date" type="date" value={form.date} onChange={set("date")} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="e-time" className={label}>
                {t("newReservation.time")}
              </label>
              <Input
                id="e-time"
                type="time"
                step={900}
                dir="ltr"
                value={form.time}
                onChange={set("time")}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="e-guests" className={label}>
                {t("newReservation.guests")}
              </label>
              <Input
                id="e-guests"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.guests}
                onChange={set("guests")}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="e-deposit" className={label}>
                {t("newReservation.deposit")}
              </label>
              <Input
                id="e-deposit"
                type="number"
                min={1}
                step="0.01"
                inputMode="decimal"
                value={form.depositAmount}
                onChange={set("depositAmount")}
                disabled={depositLocked}
                className="rounded-xl"
              />
              {depositLocked && <p className="text-xs text-muted-foreground">{t("reservationDetail.depositLocked")}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="e-notes" className={label}>
              {t("newReservation.notes")}
            </label>
            <Textarea id="e-notes" value={form.notes} onChange={set("notes")} className="rounded-xl min-h-[80px]" />
          </div>
          {r.status === "pending_payment" && (
            <p className="text-xs text-muted-foreground">{t("reservationDetail.editExtendsLink")}</p>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              {t("common.back")}
            </Button>
            <Button type="submit" className="rounded-xl gap-2" disabled={invalid || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
