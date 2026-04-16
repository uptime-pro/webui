"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useCreateMaintenance,
  useUpdateMaintenance,
} from "@/hooks/use-maintenance";
import type {
  CreateMaintenanceDto,
  MaintenanceStrategy,
  MaintenanceWindow,
  UpdateMaintenanceDto,
} from "@/types/maintenance";

const STRATEGY_OPTIONS: { value: MaintenanceStrategy; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "one-time", label: "One-time" },
  { value: "recurring-interval", label: "Recurring Interval" },
  { value: "recurring-weekday", label: "Recurring Weekday" },
  { value: "recurring-day-of-month", label: "Recurring Day of Month" },
  { value: "cron", label: "Cron Expression" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

interface Props {
  maintenance?: MaintenanceWindow;
  onSuccess: () => void;
}

export function MaintenanceForm({ maintenance, onSuccess }: Props) {
  const [title, setTitle] = useState(maintenance?.title ?? "");
  const [strategy, setStrategy] = useState<MaintenanceStrategy>(
    maintenance?.strategy ?? "manual",
  );
  const [active, setActive] = useState(maintenance?.active ?? true);
  const [timezone, setTimezone] = useState(maintenance?.timezone ?? "UTC");
  const [startDate, setStartDate] = useState(
    maintenance?.startDate ? maintenance.startDate.slice(0, 16) : "",
  );
  const [endDate, setEndDate] = useState(
    maintenance?.endDate ? maintenance.endDate.slice(0, 16) : "",
  );
  const [weekdays, setWeekdays] = useState<number[]>(
    maintenance?.weekdays ?? [],
  );
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>(
    strategy === "recurring-day-of-month" ? (maintenance?.weekdays ?? []) : [],
  );
  const [hours, setHours] = useState<number[]>(maintenance?.hours ?? []);
  const [durationMinutes, setDurationMinutes] = useState(
    maintenance?.durationMinutes ?? 60,
  );
  const [cronExpr, setCronExpr] = useState(maintenance?.cronExpr ?? "");

  const create = useCreateMaintenance();
  const update = useUpdateMaintenance(maintenance?.id ?? 0);
  const isPending = create.isPending || update.isPending;
  const mutationError = create.error ?? update.error;

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function toggleDayOfMonth(day: number) {
    setDaysOfMonth((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function toggleHour(h: number) {
    setHours((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h],
    );
  }

  function buildPayload(): CreateMaintenanceDto {
    const base: CreateMaintenanceDto = {
      title: title.trim(),
      strategy,
      active,
      timezone,
    };

    switch (strategy) {
      case "one-time":
        base.startDate = startDate
          ? new Date(startDate).toISOString()
          : undefined;
        base.endDate = endDate ? new Date(endDate).toISOString() : undefined;
        break;
      case "recurring-interval":
      case "recurring-weekday":
        base.weekdays = weekdays;
        base.hours = hours;
        base.durationMinutes = durationMinutes;
        break;
      case "recurring-day-of-month":
        base.weekdays = daysOfMonth;
        base.hours = hours;
        base.durationMinutes = durationMinutes;
        break;
      case "cron":
        base.cronExpr = cronExpr;
        base.durationMinutes = durationMinutes;
        break;
      default:
        break;
    }

    return base;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      if (maintenance) {
        const payload: UpdateMaintenanceDto = buildPayload();
        await update.mutateAsync(payload);
      } else {
        await create.mutateAsync(buildPayload());
      }
      onSuccess();
    } catch {
      // surfaced via mutationError
    }
  }

  const showWeekdayFields =
    strategy === "recurring-interval" || strategy === "recurring-weekday";
  const showDayOfMonthFields = strategy === "recurring-day-of-month";
  const showHoursAndDuration =
    showWeekdayFields || showDayOfMonthFields || strategy === "cron";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="maint-title">Title</Label>
        <Input
          id="maint-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Weekly maintenance window"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Strategy</Label>
        <Select
          value={strategy}
          onValueChange={(v) => setStrategy(v as MaintenanceStrategy)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STRATEGY_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="maint-active"
          checked={active}
          onCheckedChange={setActive}
        />
        <Label htmlFor="maint-active">Active</Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="maint-timezone">Timezone</Label>
        <Input
          id="maint-timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="UTC"
        />
      </div>

      {strategy === "one-time" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="maint-start">Start Date & Time</Label>
            <Input
              id="maint-start"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maint-end">End Date & Time</Label>
            <Input
              id="maint-end"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </>
      )}

      {showWeekdayFields && (
        <div className="space-y-1.5">
          <Label>Days of Week</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleWeekday(i)}
                className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                  weekdays.includes(i)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showDayOfMonthFields && (
        <div className="space-y-1.5">
          <Label>Days of Month</Label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDayOfMonth(day)}
                className={`h-8 w-8 rounded border text-xs font-medium transition-colors ${
                  daysOfMonth.includes(day)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {(showWeekdayFields || showDayOfMonthFields) && (
        <div className="space-y-1.5">
          <Label>Hours (UTC)</Label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 24 }, (_, i) => i).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => toggleHour(h)}
                className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                  hours.includes(h)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent"
                }`}
              >
                {formatHour(h)}
              </button>
            ))}
          </div>
        </div>
      )}

      {strategy === "cron" && (
        <div className="space-y-1.5">
          <Label htmlFor="maint-cron">Cron Expression</Label>
          <Input
            id="maint-cron"
            value={cronExpr}
            onChange={(e) => setCronExpr(e.target.value)}
            placeholder="0 2 * * *"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Standard 5-field cron: minute hour day month weekday. Example: "0 2
            * * *" runs at 2 AM daily.
          </p>
        </div>
      )}

      {showHoursAndDuration && (
        <div className="space-y-1.5">
          <Label htmlFor="maint-duration">Duration (minutes)</Label>
          <Input
            id="maint-duration"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          />
        </div>
      )}

      {mutationError && (
        <p className="text-sm text-destructive">{mutationError.message}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending
          ? "Saving…"
          : maintenance
            ? "Save Changes"
            : "Create Maintenance Window"}
      </Button>
    </form>
  );
}
