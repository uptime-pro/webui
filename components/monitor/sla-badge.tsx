"use client";
import { Badge } from "@/components/ui/badge";
import { useMonitorSla } from "@/hooks/use-monitors";

interface SlaBadgeProps {
  monitorId: number;
  slaTarget?: number;
  compact?: boolean;
}

export function SlaBadge({
  monitorId,
  slaTarget,
  compact = false,
}: SlaBadgeProps) {
  const { data: sla, isLoading } = useMonitorSla(monitorId);

  if (isLoading) {
    return (
      <Badge variant="outline" className="text-xs">
        …
      </Badge>
    );
  }

  if (!sla) return null;

  const uptime = sla.uptimePercent;
  const target = slaTarget ?? sla.slaTarget;

  const variant: "default" | "secondary" | "destructive" | "outline" =
    "outline";
  let className = "text-xs";

  if (target !== null && target !== undefined) {
    if (uptime >= target) {
      className =
        "text-xs bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400";
    } else if (uptime >= target - 0.5) {
      className =
        "text-xs bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";
    } else {
      className =
        "text-xs bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400";
    }
  } else {
    className =
      "text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
  }

  if (compact) {
    return (
      <Badge variant={variant} className={className}>
        {uptime.toFixed(2)}%
      </Badge>
    );
  }

  return (
    <Badge variant={variant} className={className}>
      {target !== null && target !== undefined
        ? `SLA: ${uptime.toFixed(2)}% / ${target}%`
        : `${uptime.toFixed(2)}%`}
    </Badge>
  );
}
