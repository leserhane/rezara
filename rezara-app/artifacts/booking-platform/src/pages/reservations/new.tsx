import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateReservation,
  useGetReservations,
  useGetCapacitySlots,
  getGetCapacitySlotsQueryKey,
  getGetReservationsQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { useLocation, useSearch, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, MessageCircle, Minus, Plus, AlertTriangle, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { nanoid } from "nanoid";
import { useTranslation } from "react-i18next";
import { useAppConfig } from "@/hooks/use-public-base-url";
import { formatDate, formatMoney, localDateString, whatsappUrl } from "@/lib/format";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/errors";

const DEPOSIT_PRESETS = [50, 100, 200, 500];

export default function NewReservation() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateReservation();
  const [autoWhatsApp, setAutoWhatsApp] = useState(true);
  const { publicBaseUrl, reservationExpiryMinutes } = useAppConfig();
  const configRef = useRef({ publicBaseUrl, reservationExpiryMinutes });
  configRef.current = { publicBaseUrl, reservationExpiryMinutes };

  const today = localDateString();
  const tomorrow = localDateString(addDays(new Date(), 1));
  const prefillDate = new URLSearchParams(search).get("date");

  const schema = useMemo(
    () =>
      z.object({
        customerName: z.string().trim().min(2, t("newReservation.nameRequired")),
        customerPhone: z.string().optional(),
        date: z
          .string()
          .min(1, t("newReservation.dateRequired"))
          .refine((d) => d >= localDateString(), t("newReservation.datePast")),
        time: z.string().regex(/^\d{2}:\d{2}$/, t("newReservation.timeRequired")),
        guests: z.coerce.number().int().min(1, t("newReservation.guestsMin")),
        depositAmount: z.coerce.number().positive(t("newReservation.depositMin")),
        notes: z.string().optional(),
      }),
    [t],
  );
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      guests: 2,
      depositAmount: 50,
      date: prefillDate && prefillDate >= today ? prefillDate : today,
      time: "",
    },
  });

  const watchedPhone = watch("customerPhone");
  const watchedDate = watch("date");
  const watchedTime = watch("time");
  const watchedGuests = Number(watch("guests")) || 0;
  const watchedDeposit = Number(watch("depositAmount")) || 0;
  const hasPhone = !!watchedPhone && watchedPhone.replace(/\D/g, "").length >= 8;
  const willOpenWhatsApp = autoWhatsApp && hasPhone;

  // Capacity check: soft warning only — the owner knows their venue best.
  const { data: reservations } = useGetReservations();
  const { data: slots = [] } = useGetCapacitySlots(
    { date: watchedDate },
    { query: { queryKey: getGetCapacitySlotsQueryKey({ date: watchedDate }), enabled: !!watchedDate } },
  );
  const capacity = useMemo(() => {
    const active = (reservations ?? []).filter(
      (r) => r.date === watchedDate && (r.status === "confirmed" || r.status === "pending_payment"),
    );
    const bookedDay = active.reduce((s, r) => s + r.guests, 0);
    const daySlot = slots.find((s) => !s.startTime);
    let slotInfo: { booked: number; max: number; label: string } | null = null;
    if (watchedTime) {
      const slot = slots.find((s) => {
        if (!s.startTime) return false;
        const start = parseInt(s.startTime, 10);
        const end = start + (s.durationHours ?? 1);
        const h = parseInt(watchedTime, 10);
        return h >= start && h < end;
      });
      if (slot?.startTime) {
        const start = parseInt(slot.startTime, 10);
        const end = start + (slot.durationHours ?? 1);
        const booked = active
          .filter((r) => {
            const h = parseInt(r.time, 10);
            return h >= start && h < end;
          })
          .reduce((s, r) => s + r.guests, 0);
        slotInfo = {
          booked,
          max: slot.maxCapacity,
          label: `${slot.startTime}–${String(end).padStart(2, "0")}:00`,
        };
      }
    }
    return { bookedDay, dayMax: daySlot?.maxCapacity ?? null, slotInfo };
  }, [reservations, slots, watchedDate, watchedTime]);

  const dayOver = capacity.dayMax !== null && capacity.bookedDay + watchedGuests > capacity.dayMax;
  const slotOver = !!capacity.slotInfo && capacity.slotInfo.booked + watchedGuests > capacity.slotInfo.max;

  const onSubmit = async (data: FormData) => {
    const shouldWhatsApp = willOpenWhatsApp && !!data.customerPhone;

    // Generate linkId client-side so we can build the WhatsApp URL BEFORE any
    // async work — opening a window after an await gets popup-blocked.
    const linkId = nanoid(12);
    const publicLink = `${configRef.current.publicBaseUrl}/r/${linkId}`;

    if (shouldWhatsApp && data.customerPhone) {
      const message = t("newReservation.waMessage", {
        name: data.customerName.trim(),
        date: formatDate(data.date, "EEEE d MMMM"),
        time: data.time,
        amount: formatMoney(data.depositAmount),
        link: publicLink,
        minutes: configRef.current.reservationExpiryMinutes,
      });
      window.open(whatsappUrl(data.customerPhone, message), "_blank", "noopener");
    }

    try {
      const res = await createMutation.mutateAsync({
        data: { ...data, customerName: data.customerName.trim(), linkId },
      });
      queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });

      // Without WhatsApp, the details page's "Reservation created" banner says it all.
      if (shouldWhatsApp) {
        toast({ title: t("newReservation.toastCreated"), description: t("newReservation.toastWhatsapp") });
      }

      // Land on the details page with the share panel front and centre.
      setLocation(`/reservations/${res.id}?created=1`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("newReservation.toastError"),
        description: shouldWhatsApp
          ? t("newReservation.toastErrorWhatsapp")
          : apiErrorMessage(error, t("newReservation.toastErrorMsg")),
      });
    }
  };

  const fieldError = (msg?: string) =>
    msg ? (
      <p role="alert" className="text-sm text-destructive">
        {msg}
      </p>
    ) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/reservations">
          <Button variant="outline" size="icon" className="rounded-xl shrink-0" aria-label={t("common.back")}>
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">{t("newReservation.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("newReservation.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Who */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-5 md:p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("newReservation.sectionCustomer")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="customerName" className="text-sm font-semibold">
                {t("newReservation.customerName")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="customerName"
                autoComplete="off"
                autoFocus
                {...register("customerName")}
                placeholder={t("newReservation.customerNamePlaceholder")}
                aria-invalid={!!errors.customerName}
                className="h-12 rounded-xl subtle-ring"
              />
              {fieldError(errors.customerName?.message)}
            </div>

            <div className="space-y-2">
              <label htmlFor="customerPhone" className="text-sm font-semibold">
                {t("newReservation.whatsapp")}
              </label>
              <Input
                id="customerPhone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                dir="ltr"
                {...register("customerPhone")}
                placeholder="+212 6XX XXX XXX"
                className="h-12 rounded-xl subtle-ring"
              />
              <p className="text-xs text-muted-foreground">{t("newReservation.whatsappHint")}</p>
            </div>
          </div>
        </section>

        {/* When */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-5 md:p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("newReservation.sectionWhen")}
          </h2>

          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-semibold">
              {t("newReservation.date")} <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: today, label: t("common.today") },
                { value: tomorrow, label: t("common.tomorrow") },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setValue("date", c.value, { shouldValidate: true })}
                  aria-pressed={watchedDate === c.value}
                  className={cn(
                    "h-10 px-4 rounded-xl border text-sm font-medium transition-colors",
                    watchedDate === c.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/40",
                  )}
                >
                  {c.label}
                </button>
              ))}
              <Input
                id="date"
                type="date"
                min={today}
                {...register("date")}
                aria-invalid={!!errors.date}
                className="h-10 rounded-xl subtle-ring w-auto flex-1 min-w-[10rem]"
              />
            </div>
            {watchedDate && !errors.date && (
              <p className="text-xs text-muted-foreground capitalize">{formatDate(watchedDate, "EEEE d MMMM yyyy")}</p>
            )}
            {fieldError(errors.date?.message)}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="time" className="text-sm font-semibold">
                {t("newReservation.time")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="time"
                type="time"
                step={900}
                dir="ltr"
                {...register("time")}
                aria-invalid={!!errors.time}
                className="h-12 rounded-xl subtle-ring"
              />
              {fieldError(errors.time?.message)}
            </div>

            <div className="space-y-2">
              <label htmlFor="guests" className="text-sm font-semibold">
                {t("newReservation.guests")} <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center h-12 rounded-xl border border-input bg-background overflow-hidden">
                <button
                  type="button"
                  aria-label={t("newReservation.fewerGuests")}
                  onClick={() => setValue("guests", Math.max(1, watchedGuests - 1), { shouldValidate: true })}
                  className="w-11 h-full flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40"
                  disabled={watchedGuests <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="guests"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  {...register("guests")}
                  className="flex-1 min-w-0 h-full text-center font-semibold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label={t("newReservation.moreGuests")}
                  onClick={() => setValue("guests", watchedGuests + 1, { shouldValidate: true })}
                  className="w-11 h-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {fieldError(errors.guests?.message)}
            </div>
          </div>

          {(capacity.dayMax !== null || capacity.slotInfo) && (
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-sm",
                dayOver || slotOver
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {dayOver || slotOver ? (
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              ) : (
                <Users className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <div className="space-y-0.5">
                {capacity.dayMax !== null && (
                  <p>
                    {t("newReservation.capacityDay", {
                      booked: capacity.bookedDay,
                      max: capacity.dayMax,
                    })}
                  </p>
                )}
                {capacity.slotInfo && (
                  <p>
                    {t("newReservation.capacitySlot", {
                      slot: capacity.slotInfo.label,
                      booked: capacity.slotInfo.booked,
                      max: capacity.slotInfo.max,
                    })}
                  </p>
                )}
                {(dayOver || slotOver) && <p className="font-medium">{t("newReservation.capacityOver")}</p>}
              </div>
            </div>
          )}
        </section>

        {/* Deposit */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-5 md:p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="depositAmount" className="text-sm font-semibold">
              {t("newReservation.depositAmount")} <span className="text-destructive">*</span>
            </label>
            <div className="relative max-w-xs">
              <Input
                id="depositAmount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                dir="ltr"
                {...register("depositAmount")}
                aria-invalid={!!errors.depositAmount}
                className="h-14 pe-16 text-xl font-bold rounded-xl subtle-ring"
              />
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground pointer-events-none">
                MAD
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEPOSIT_PRESETS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setValue("depositAmount", v, { shouldValidate: true })}
                  aria-pressed={watchedDeposit === v}
                  className={cn(
                    "h-9 px-3.5 rounded-full border text-sm font-medium transition-colors",
                    watchedDeposit === v
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "bg-background border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {formatMoney(v)}
                </button>
              ))}
            </div>
            {fieldError(errors.depositAmount?.message)}
            <p className="text-xs text-muted-foreground">
              {t("newReservation.depositHint", { minutes: reservationExpiryMinutes })}
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <label htmlFor="notes" className="text-sm font-semibold">
              {t("newReservation.notes")}
            </label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder={t("newReservation.notesPlaceholder")}
              className="min-h-[88px] rounded-xl subtle-ring"
            />
            <p className="text-xs text-muted-foreground">{t("newReservation.notesHint")}</p>
          </div>
        </section>

        {/* Send */}
        <section
          className={cn(
            "flex items-center justify-between gap-4 rounded-2xl border p-4 md:p-5 transition-colors",
            hasPhone ? "bg-[#25D366]/10 border-[#25D366]/30" : "bg-muted/40 border-border",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                hasPhone ? "bg-[#25D366]" : "bg-muted-foreground/30",
              )}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <label htmlFor="auto-wa" className="font-semibold text-sm block">
                {t("newReservation.waToggle")}
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasPhone ? t("newReservation.waToggleOn") : t("newReservation.waToggleOff")}
              </p>
            </div>
          </div>
          <Switch id="auto-wa" checked={willOpenWhatsApp} onCheckedChange={setAutoWhatsApp} disabled={!hasPhone} />
        </section>

        {/* Sticky on phones so the primary action is always reachable */}
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:static z-30 -mx-4 px-4 py-3 md:p-0 md:mx-0 bg-background/95 backdrop-blur md:bg-transparent border-t border-border md:border-0">
          <Button
            type="submit"
            size="lg"
            className={cn(
              "w-full md:w-auto md:float-end rounded-xl px-8 h-12 shadow-lg gap-2",
              willOpenWhatsApp && "bg-[#1fa855] hover:bg-[#1a9149] shadow-green-600/20",
            )}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : willOpenWhatsApp ? (
              <MessageCircle className="w-5 h-5" />
            ) : null}
            {willOpenWhatsApp ? t("newReservation.saveWhatsapp") : t("newReservation.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
