import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateReservation } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetReservationsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { nanoid } from "nanoid";
import { useTranslation } from "react-i18next";
import { usePublicBaseUrl } from "@/hooks/use-public-base-url";

function getLocalToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TODAY = getLocalToday();

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
})();

const schema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().optional(),
  date: z.string().min(1, "Date is required").refine((d) => d >= getLocalToday(), "Cannot select a past date"),
  time: z.string().min(1, "Time is required"),
  guests: z.coerce.number().min(1, "At least 1 guest required"),
  depositAmount: z.coerce.number().min(1, "Deposit must be > 0"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export default function NewReservation() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateReservation();
  const [autoWhatsApp, setAutoWhatsApp] = useState(true);
  const [hasPhone, setHasPhone] = useState(false);
  const publicBaseUrl = usePublicBaseUrl();
  const publicBaseUrlRef = useRef(publicBaseUrl);
  publicBaseUrlRef.current = publicBaseUrl;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { guests: 2, depositAmount: 50 },
  });

  const watchedPhone = watch("customerPhone");

  useEffect(() => {
    setHasPhone(!!watchedPhone && watchedPhone.trim().length > 3);
  }, [watchedPhone]);

  const onSubmit = async (data: FormData) => {
    const shouldWhatsApp = autoWhatsApp && hasPhone && !!data.customerPhone;

    // Generate linkId client-side so we can build the WhatsApp URL
    // BEFORE any async work — this is the only way to bypass popup blockers.
    const linkId = nanoid(10);
    const publicLink = `${publicBaseUrlRef.current}/r/${linkId}`;

    if (shouldWhatsApp && data.customerPhone) {
      const message = t("newReservation.waMessage", {
        name: data.customerName,
        date: data.date,
        time: data.time,
        amount: data.depositAmount,
        link: publicLink,
      });
      const cleaned = formatPhoneForWhatsApp(data.customerPhone);
      const waUrl = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
      // Synchronous — runs inside the click event, always allowed by browsers
      window.open(waUrl, "_blank");
    }

    try {
      // Pass the pre-generated linkId so server uses the same one
      const res = await createMutation.mutateAsync({ data: { ...data, linkId } });
      queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });

      toast({
        title: t("newReservation.toastCreated"),
        description: shouldWhatsApp
          ? t("newReservation.toastWhatsapp")
          : t("newReservation.toastManual"),
      });

      setLocation(`/reservations/${res.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("newReservation.toastError"),
        description: error.message || t("newReservation.toastErrorMsg"),
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reservations">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">{t("newReservation.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("newReservation.subtitle")}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t("newReservation.customerName")} <span className="text-destructive">*</span></label>
              <Input
                {...register("customerName")}
                placeholder={t("newReservation.customerNamePlaceholder")}
                className="h-12 rounded-xl subtle-ring"
              />
              {errors.customerName && <p className="text-sm text-destructive">{errors.customerName.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">{t("newReservation.whatsapp")}</label>
              <Input
                {...register("customerPhone")}
                placeholder="+212 6XX XXX XXX"
                className="h-12 rounded-xl subtle-ring"
              />
              <p className="text-xs text-muted-foreground">{t("newReservation.whatsappHint")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-border">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-semibold">{t("newReservation.date")} <span className="text-destructive">*</span></label>
              <Input
                type="date"
                min={TODAY}
                {...register("date")}
                className="h-12 rounded-xl subtle-ring"
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">{t("newReservation.time")} <span className="text-destructive">*</span></label>
              <Select onValueChange={(v) => setValue("time", v, { shouldValidate: true })}>
                <SelectTrigger className="h-12 rounded-xl subtle-ring">
                  <SelectValue placeholder="-- : --" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">{t("newReservation.guests")} <span className="text-destructive">*</span></label>
              <Input type="number" min="1" {...register("guests")} className="h-12 rounded-xl subtle-ring" />
              {errors.guests && <p className="text-sm text-destructive">{errors.guests.message}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-6">
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
              <div className="space-y-2 max-w-sm">
                <label className="text-sm font-semibold text-primary-foreground/80">
                  {t("newReservation.depositAmount")} <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">MAD</span>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("depositAmount")}
                    className="h-14 pl-16 text-xl font-bold rounded-xl border-primary/20 focus:ring-primary/30"
                  />
                </div>
                {errors.depositAmount && <p className="text-sm text-destructive">{errors.depositAmount.message}</p>}
                <p className="text-xs text-muted-foreground mt-2">{t("newReservation.depositHint")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">{t("newReservation.notes")}</label>
              <Textarea
                {...register("notes")}
                placeholder={t("newReservation.notesPlaceholder")}
                className="min-h-[100px] rounded-xl subtle-ring"
              />
            </div>
          </div>

          {/* WhatsApp toggle — only shown when a phone number is entered */}
          <div className={`pt-4 border-t border-border transition-opacity duration-200 ${!hasPhone ? "opacity-40 pointer-events-none" : ""}`}>
            <div className="flex items-center justify-between bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("newReservation.waToggle")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hasPhone
                      ? t("newReservation.waToggleOn")
                      : t("newReservation.waToggleOff")}
                  </p>
                </div>
              </div>
              <Switch
                checked={autoWhatsApp && hasPhone}
                onCheckedChange={setAutoWhatsApp}
                disabled={!hasPhone}
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-border">
            <Button
              type="submit"
              size="lg"
              className="rounded-xl px-8 shadow-lg shadow-primary/25"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                : <Save className="w-5 h-5 mr-2" />}
              {autoWhatsApp && hasPhone ? t("newReservation.saveWhatsapp") : t("newReservation.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
