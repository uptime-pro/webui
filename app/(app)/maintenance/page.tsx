"use client";
import Link from "next/link";
import { Wrench, Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useDeleteMaintenance,
  useMaintenanceWindows,
  useUpdateMaintenance,
} from "@/hooks/use-maintenance";
import type { MaintenanceWindow } from "@/types/maintenance";

const STRATEGY_LABELS: Record<string, string> = {
  manual: "Manual",
  "one-time": "One-time",
  "recurring-interval": "Recurring Interval",
  "recurring-weekday": "Recurring Weekday",
  "recurring-day-of-month": "Day of Month",
  cron: "Cron",
};

function scheduleSummary(w: MaintenanceWindow): string {
  switch (w.strategy) {
    case "manual":
      return "Manually controlled";
    case "one-time":
      if (w.startDate && w.endDate) {
        return `${new Date(w.startDate).toLocaleString()} → ${new Date(w.endDate).toLocaleString()}`;
      }
      return "One-time (dates not set)";
    case "recurring-interval":
    case "recurring-weekday": {
      const days = w.weekdays?.length
        ? `${w.weekdays.length} day(s)/week`
        : "every day";
      const hrs = w.hours?.length ? `at ${w.hours.length} hour(s)` : "";
      return `${days}${hrs ? ` ${hrs}` : ""}, ${w.durationMinutes} min`;
    }
    case "recurring-day-of-month": {
      const days = w.weekdays?.length
        ? `${w.weekdays.length} day(s)/month`
        : "every day";
      const hrs = w.hours?.length ? `at ${w.hours.length} hour(s)` : "";
      return `${days}${hrs ? ` ${hrs}` : ""}, ${w.durationMinutes} min`;
    }
    case "cron":
      return w.cronExpr
        ? `${w.cronExpr} (${w.durationMinutes} min)`
        : "Cron (not configured)";
    default:
      return "—";
  }
}

function MaintenanceRow({ window: w }: { window: MaintenanceWindow }) {
  const deleteMaintenance = useDeleteMaintenance();
  const updateMaintenance = useUpdateMaintenance(w.id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    await deleteMaintenance.mutateAsync(w.id);
    setConfirmDelete(false);
  }

  async function handleToggleActive(checked: boolean) {
    await updateMaintenance.mutateAsync({ active: checked });
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">{w.title}</p>
            <Badge variant="secondary" className="text-xs shrink-0">
              {STRATEGY_LABELS[w.strategy] ?? w.strategy}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{scheduleSummary(w)}</p>
          <p className="text-xs text-muted-foreground">TZ: {w.timezone}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Switch
            checked={w.active}
            onCheckedChange={handleToggleActive}
            disabled={updateMaintenance.isPending}
          />
          <Button variant="outline" size="sm" render={<Link href={`/maintenance/${w.id}/edit`} />}>Edit</Button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMaintenance.isPending}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MaintenancePage() {
  const { data: windows, isLoading, error } = useMaintenanceWindows();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Windows"
        description="Schedule planned downtime so monitors don't alert during maintenance."
        action={
          <Button size="sm" render={<Link href="/maintenance/new" />}>
              <Plus className="h-4 w-4 mr-2" />
              New Window
            </Button>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load maintenance windows"}
        </p>
      )}

      {!isLoading && !error && windows?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Wrench className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium">No maintenance windows</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create one to pause alerting during planned maintenance.
          </p>
          <Button size="sm" className="mt-4" render={<Link href="/maintenance/new" />}>New Window</Button>
        </div>
      )}

      {!isLoading && windows && windows.length > 0 && (
        <div className="space-y-3">
          {windows.map((w) => (
            <MaintenanceRow key={w.id} window={w} />
          ))}
        </div>
      )}
    </div>
  );
}
