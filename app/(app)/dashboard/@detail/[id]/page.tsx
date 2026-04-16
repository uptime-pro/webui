"use client";
import { use } from "react";
import { BadgeWidget } from "@/components/monitor/badge-widget";
import { HeartbeatBar } from "@/components/monitor/heartbeat-bar";
import { SlaBadge } from "@/components/monitor/sla-badge";
import { StatusBadge } from "@/components/monitor/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHeartbeats } from "@/hooks/use-heartbeats";
import {
  useManualCheck,
  useMonitor,
  useMonitorSla,
  usePauseMonitor,
  useResumeMonitor,
} from "@/hooks/use-monitors";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function MonitorOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = parseInt(idStr, 10);
  const { data: monitor, isLoading } = useMonitor(id);
  const { data: heartbeats = [] } = useHeartbeats(id, 50);
  const { data: sla } = useMonitorSla(id);
  const pause = usePauseMonitor();
  const resume = useResumeMonitor();
  const check = useManualCheck();

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!monitor)
    return <p className="text-muted-foreground">Monitor not found.</p>;

  const uptime = heartbeats.length
    ? (
        (heartbeats.filter((h) => h.status).length / heartbeats.length) *
        100
      ).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{monitor.name}</h2>
          <StatusBadge status={monitor.lastStatus} active={monitor.active} />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => check.mutate(id)}
            disabled={check.isPending}
          >
            Check now
          </Button>
          {monitor.active ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => pause.mutate(id)}
              disabled={pause.isPending}
            >
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => resume.mutate(id)}
              disabled={resume.isPending}
            >
              Resume
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent checks</CardTitle>
        </CardHeader>
        <CardContent>
          <HeartbeatBar heartbeats={heartbeats} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">
              {monitor.lastPing ? `${monitor.lastPing.toFixed(0)}ms` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{uptime ? `${uptime}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">Uptime (recent)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{monitor.interval}s</p>
            <p className="text-xs text-muted-foreground">Check interval</p>
          </CardContent>
        </Card>
      </div>

      {sla && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              SLA &amp; Uptime
              <SlaBadge monitorId={id} slaTarget={monitor.slaTarget} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">
                  {sla.uptimePercent.toFixed(3)}%
                </p>
                <p className="text-xs text-muted-foreground">30-day uptime</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{sla.upChecks}</p>
                <p className="text-xs text-muted-foreground">Up checks</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{sla.totalChecks}</p>
                <p className="text-xs text-muted-foreground">Total checks</p>
              </div>
            </div>
            {monitor.slaTarget != null && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                SLA target: {monitor.slaTarget}%
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <BadgeWidget monitorId={id} apiUrl={API_URL} />
    </div>
  );
}
