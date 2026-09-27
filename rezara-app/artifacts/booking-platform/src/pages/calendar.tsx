import { useState } from "react";
import {
  useGetReservations,
  useGetCapacitySlots,
  useUpsertCapacitySlot,
  useDeleteCapacitySlot,
  getGetCapacitySlotsQueryKey,
} from "@workspace/api-client-react";
import type { CapacitySlot } from "@workspace/api-client-react";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  Plus,
  Trash2,
  Loader2,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return `${h}:00`;
});

function CapacityPanel({
  day,
  onClose,
}: {
  day: Date;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const dateStr = format(day, "yyyy-MM-dd");
  const qc = useQueryClient();

  const { data: slots = [], isLoading } = useGetCapacitySlots(
    { date: dateStr },
    { query: { queryKey: getGetCapacitySlotsQueryKey({ date: dateStr }) } }
  );

  const upsertMutation = useUpsertCapacitySlot();
  const deleteMutation = useDeleteCapacitySlot();

  const allDaySlot = slots.find((s) => !s.startTime);
  const timeSlots = slots.filter((s) => !!s.startTime);

  const [allDayCapacity, setAllDayCapacity] = useState<string>(
    () => allDaySlot?.maxCapacity?.toString() ?? ""
  );
  const [savingAllDay, setSavingAllDay] = useState(false);

  const [newSlot, setNewSlot] = useState({
    startTime: "09:00",
    durationHours: "1",
    maxCapacity: "",
  });
  const [addingSlot, setAddingSlot] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  async function saveAllDay() {
    if (!allDayCapacity || Number(allDayCapacity) < 1) return;
    setSavingAllDay(true);
    try {
      await upsertMutation.mutateAsync({
        data: {
          id: allDaySlot?.id,
          date: dateStr,
          startTime: null,
          durationHours: null,
          maxCapacity: Number(allDayCapacity),
        },
      });
      qc.invalidateQueries({ queryKey: getGetCapacitySlotsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetCapacitySlotsQueryKey({ date: dateStr }) });
    } finally {
      setSavingAllDay(false);
    }
  }

  async function deleteAllDay() {
    if (!allDaySlot) return;
    await deleteMutation.mutateAsync({ id: allDaySlot.id });
    setAllDayCapacity("");
    qc.invalidateQueries({ queryKey: getGetCapacitySlotsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetCapacitySlotsQueryKey({ date: dateStr }) });
  }

  async function addTimeSlot() {
    if (!newSlot.maxCapacity || Number(newSlot.maxCapacity) < 1) return;
    setAddingSlot(true);
    try {
      await upsertMutation.mutateAsync({
        data: {
          date: dateStr,
          startTime: newSlot.startTime,
          durationHours: Number(newSlot.durationHours),
          maxCapacity: Number(newSlot.maxCapacity),
        },
      });
      setNewSlot({ startTime: "09:00", durationHours: "1", maxCapacity: "" });
      setShowAddForm(false);
      qc.invalidateQueries({ queryKey: getGetCapacitySlotsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetCapacitySlotsQueryKey({ date: dateStr }) });
    } finally {
      setAddingSlot(false);
    }
  }

  async function deleteSlot(slot: CapacitySlot) {
    await deleteMutation.mutateAsync({ id: slot.id });
    qc.invalidateQueries({ queryKey: getGetCapacitySlotsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetCapacitySlotsQueryKey({ date: dateStr }) });
  }

  return (
    <div className="space-y-7">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Daily capacity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">{t("calendar.dailyLimit")}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("calendar.dailyLimitHint")}
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                placeholder={t("calendar.dailyLimitPlaceholder")}
                value={allDayCapacity}
                onChange={(e) => setAllDayCapacity(e.target.value)}
                className="rounded-xl"
              />
              <Button
                onClick={saveAllDay}
                disabled={savingAllDay || !allDayCapacity}
                className="rounded-xl shrink-0"
              >
                {savingAllDay ? <Loader2 className="w-4 h-4 animate-spin" /> : t("calendar.save")}
              </Button>
              {allDaySlot && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={deleteAllDay}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Time slots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">{t("calendar.timeSlots")}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs gap-1.5"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="w-3.5 h-3.5" />
                {t("calendar.addSlot")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("calendar.timeSlotsHint")}
            </p>

            {/* Add slot form */}
            {showAddForm && (
              <div className="bg-muted/50 rounded-2xl p-4 space-y-3 border border-border">
                <p className="text-xs font-semibold text-foreground">{t("calendar.newTimeSlot")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t("calendar.startTime")}</label>
                    <Select
                      value={newSlot.startTime}
                      onValueChange={(v) => setNewSlot((s) => ({ ...s, startTime: v }))}
                    >
                      <SelectTrigger className="rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t("calendar.duration")}</label>
                    <Select
                      value={newSlot.durationHours}
                      onValueChange={(v) => setNewSlot((s) => ({ ...s, durationHours: v }))}
                    >
                      <SelectTrigger className="rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t("calendar.oneHour")}</SelectItem>
                        <SelectItem value="2">{t("calendar.twoHours")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("calendar.maxPeople")}</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder={t("calendar.maxPeoplePlaceholder")}
                    value={newSlot.maxCapacity}
                    onChange={(e) => setNewSlot((s) => ({ ...s, maxCapacity: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={addTimeSlot}
                    disabled={addingSlot || !newSlot.maxCapacity}
                    size="sm"
                    className="rounded-xl flex-1"
                  >
                    {addingSlot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("calendar.addSlot")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setShowAddForm(false)}
                  >
                    {t("calendar.cancel")}
                  </Button>
                </div>
              </div>
            )}

            {/* Existing time slots */}
            {timeSlots.length === 0 && !showAddForm ? (
              <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                {t("calendar.noSlots")}
              </div>
            ) : (
              <div className="space-y-2">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between bg-background border border-border rounded-2xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {slot.startTime} –{" "}
                          {slot.startTime
                            ? `${(parseInt(slot.startTime) + (slot.durationHours ?? 1)).toString().padStart(2, "0")}:00`
                            : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slot.durationHours}{t("calendar.hoursShort")} · {t("calendar.maxLabel")}{" "}
                          <span className="font-semibold text-foreground">{slot.maxCapacity}</span>{" "}
                          {t("calendar.peopleLabel")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteSlot(slot)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function CalendarView() {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { data: reservations } = useGetReservations();
  const { data: allCapacitySlots = [] } = useGetCapacitySlots(undefined, {
    query: { queryKey: getGetCapacitySlotsQueryKey() },
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">{t("calendar.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("calendar.subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-display">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 mb-4">
          {[
            t("calendar.days.sun"),
            t("calendar.days.mon"),
            t("calendar.days.tue"),
            t("calendar.days.wed"),
            t("calendar.days.thu"),
            t("calendar.days.fri"),
            t("calendar.days.sat"),
          ].map((d) => (
            <div
              key={d}
              className="text-center font-semibold text-sm text-muted-foreground uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const dayReservations =
              reservations?.filter((r) => isSameDay(new Date(r.date), day)) || [];
            const isToday = isSameDay(day, new Date());
            const dateStr = format(day, "yyyy-MM-dd");

            const dayCapSlots = allCapacitySlots.filter((s) => s.date === dateStr);
            const allDayCap = dayCapSlots.find((s) => !s.startTime);
            const timeSlotCount = dayCapSlots.filter((s) => !!s.startTime).length;

            return (
              <div
                key={i}
                onClick={() => isCurrentMonth && setSelectedDay(day)}
                className={`min-h-[100px] md:min-h-[120px] rounded-2xl p-2 border transition-all ${
                  isCurrentMonth
                    ? "bg-background border-border cursor-pointer hover:border-primary/40 hover:shadow-sm"
                    : "bg-muted/30 border-transparent opacity-40"
                } ${isToday ? "ring-2 ring-primary border-transparent" : ""}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div
                    className={`font-semibold text-sm w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday ? "bg-primary text-white" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  {isCurrentMonth && (allDayCap || timeSlotCount > 0) && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Users className="w-3 h-3 text-[#00C896]" />
                      <span className="text-[10px] font-semibold text-[#00C896] leading-none">
                        {allDayCap
                          ? allDayCap.maxCapacity
                          : `${timeSlotCount}t`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  {dayReservations.slice(0, 2).map((res) => (
                    <Link key={res.id} href={`/reservations/${res.id}`}>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs px-1.5 py-0.5 rounded-md truncate cursor-pointer hover:opacity-80 font-medium ${
                          res.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : res.status === "pending_payment"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {res.time} {res.customerName}
                      </div>
                    </Link>
                  ))}
                  {dayReservations.length > 2 && (
                    <div className="text-[10px] text-muted-foreground font-medium pl-1">
                      {t("calendar.moreCount", { n: dayReservations.length - 2 })}
                    </div>
                  )}
                  {isCurrentMonth && dayCapSlots.length === 0 && (
                    <div className="mt-1 hidden group-hover:flex items-center gap-1">
                      <Settings2 className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Capacity legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          {t("calendar.confirmedLegend")}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          {t("calendar.pendingPaymentLegend")}
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-[#00C896]" />
          {t("calendar.capacitySet")}
        </div>
      </div>

      {/* Day capacity sheet */}
      <Sheet open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold font-display">
              {selectedDay ? format(selectedDay, "EEEE, MMMM d") : ""}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {t("calendar.manageCapacity")}
            </p>
          </SheetHeader>

          {selectedDay && (
            <CapacityPanel day={selectedDay} onClose={() => setSelectedDay(null)} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
