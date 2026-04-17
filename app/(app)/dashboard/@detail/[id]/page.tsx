"use client";
import { use } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import type { Monitor } from "@/types/monitor";

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
            onClick={() =>
              check.mutate(id, {
                onSuccess: () => toast.success("Check complete — results updated"),
                onError: () => toast.error("Check failed"),
              })
            }
            disabled={check.isPending}
          >
            {check.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Checking…</>
            ) : (
              <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Check now</>
            )}
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

      {/* Expiry metadata for ssl-cert and domain-expiry monitors */}
      {(monitor.type === 'ssl-cert' || monitor.type === 'domain-expiry') && heartbeats[0]?.meta && (
        <ExpiryMetaCard monitor={monitor} meta={heartbeats[0].meta as Record<string, unknown>} />
      )}

      {/* Piggyback SSL check results for http/websocket monitors */}
      {(monitor.type === 'http' || monitor.type === 'websocket') &&
        heartbeats[0]?.meta &&
        !!((heartbeats[0].meta as Record<string, unknown>)['ssl'] || (heartbeats[0].meta as Record<string, unknown>)['domain']) && (
        <PiggybackExpiryCard meta={heartbeats[0].meta as Record<string, unknown>} />
      )}

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

function PiggybackExpiryCard({ meta }: { meta: Record<string, unknown> }) {
  const ssl = meta['ssl'] as Record<string, unknown> | undefined;
  const domain = meta['domain'] as Record<string, unknown> | undefined;

  function getDaysColor(days: number | null | undefined): string {
    if (days == null) return 'text-muted-foreground';
    if (days <= 0) return 'text-destructive';
    if (days <= 14) return 'text-destructive';
    if (days <= 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  }

  function ExpiryRow({ label, data, nameLabel }: {
    label: string;
    data: Record<string, unknown>;
    nameLabel: string;
  }) {
    const days = data['daysUntilExpiry'] as number | null | undefined;
    const expiry = data['expiryDate'] as string | null | undefined;
    const name = (data['issuer'] ?? data['registrar']) as string | null | undefined;
    return (
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className={cn("text-lg font-bold", getDaysColor(days))}>
            {days != null ? (days <= 0 ? `${Math.abs(days)}d ago` : `${days}d`) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">{days != null && days <= 0 ? 'Expired' : 'Days left'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Expiry date</p>
          <p className="text-sm font-medium">{expiry ? new Date(expiry).toLocaleDateString() : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{nameLabel}</p>
          <p className="text-sm font-medium truncate" title={name ?? ''}>{name ?? '—'}</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Expiry Checks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ssl && <ExpiryRow label="SSL Certificate" data={ssl} nameLabel="Issuer" />}
        {ssl && domain && <div className="border-t" />}
        {domain && <ExpiryRow label="Domain Registration" data={domain} nameLabel="Registrar" />}
      </CardContent>
    </Card>
  );
}

function ExpiryMetaCard({ monitor, meta }: { monitor: Monitor; meta: Record<string, unknown> }) {
  const daysUntilExpiry = meta['daysUntilExpiry'] as number | null | undefined;
  const expiryDate = meta['expiryDate'] as string | null | undefined;
  const certState = (meta['certState'] ?? meta['domainState']) as string | undefined;
  const issuerOrRegistrar = monitor.type === 'ssl-cert'
    ? meta['issuer'] as string | undefined
    : meta['registrar'] as string | undefined;

  function getDaysColor(days: number | null | undefined): string {
    if (days == null) return 'text-muted-foreground';
    if (days <= 0) return 'text-destructive';
    if (days <= 14) return 'text-destructive';
    if (days <= 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          {monitor.type === 'ssl-cert' ? 'Certificate Details' : 'Domain Registration'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className={cn("text-2xl font-bold", getDaysColor(daysUntilExpiry))}>
              {daysUntilExpiry != null
                ? daysUntilExpiry <= 0
                  ? `${Math.abs(daysUntilExpiry)}d ago`
                  : `${daysUntilExpiry}d`
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {(daysUntilExpiry ?? 0) <= 0 ? 'Expired' : 'Days left'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium truncate">
              {expiryDate ? new Date(expiryDate).toLocaleDateString() : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Expiry date</p>
          </div>
          <div>
            <p className="text-sm font-medium truncate" title={issuerOrRegistrar ?? ''}>
              {issuerOrRegistrar ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {monitor.type === 'ssl-cert' ? 'Issuer' : 'Registrar'}
            </p>
          </div>
        </div>
        {certState && certState !== 'healthy' && (
          <p className={cn(
            "text-xs mt-3 text-center font-medium",
            certState === 'expired' || certState === 'critical' ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-400'
          )}>
            {certState === 'expired' ? '⚠ Certificate/Domain expired' :
             certState === 'critical' ? '⚠ Expiry within critical threshold' :
             certState === 'warning' ? '⚠ Expiry within warning threshold' :
             certState === 'unsupported' ? 'RDAP lookup not supported for this TLD' :
             certState === 'error' ? 'Lookup failed' : certState}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
