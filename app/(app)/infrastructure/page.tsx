"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  HardDrive,
  ListChecks,
  RefreshCw,
  Server,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shell/page-header";
import { useQueueStats, useDragonflyInfo } from "@/hooks/use-infrastructure";
import type { QueueStat, QueueCounts, DragonflyInfo } from "@/hooks/use-infrastructure";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function QueueCard({ queue }: { queue: QueueStat }) {
  const { counts, workerCount } = queue;
  const hasIssues = counts.failed > 0;

  const stats: { label: string; value: number; variant?: "destructive" | "secondary" | "outline" }[] = [
    { label: "Waiting", value: counts.waiting, variant: "secondary" },
    { label: "Active", value: counts.active, variant: counts.active > 0 ? "outline" : "secondary" },
    { label: "Delayed", value: counts.delayed, variant: "secondary" },
    { label: "Paused", value: counts.paused, variant: "secondary" },
    { label: "Completed", value: counts.completed, variant: "outline" },
    { label: "Failed", value: counts.failed, variant: counts.failed > 0 ? "destructive" : "secondary" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <ListChecks className="size-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">{queue.displayName}</CardTitle>
              <CardDescription className="text-xs font-mono">{queue.name}</CardDescription>
            </div>
          </div>
          {hasIssues ? (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertCircle className="size-3" />
              {counts.failed} failed
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              Healthy
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {stats.map(({ label, value, variant }) => (
            <div key={label} className="flex flex-col gap-0.5 rounded-md border bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className={`text-lg font-semibold tabular-nums ${
                label === "Failed" && value > 0 ? "text-destructive" : ""
              }`}>{value.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          <span>{workerCount} worker{workerCount !== 1 ? "s" : ""} connected</span>
        </div>
      </CardContent>
    </Card>
  );
}

function DragonflyCard({ info }: { info: DragonflyInfo }) {
  if (info.status === "error") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <Database className="size-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">DragonflyDB</CardTitle>
              <CardDescription className="text-xs">In-memory data store</CardDescription>
            </div>
            <Badge variant="destructive" className="ml-auto gap-1 text-xs">
              <AlertCircle className="size-3" />
              Error
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{info.error}</p>
        </CardContent>
      </Card>
    );
  }

  const hitRate =
    info.keyspaceHits + info.keyspaceMisses > 0
      ? Math.round((info.keyspaceHits / (info.keyspaceHits + info.keyspaceMisses)) * 100)
      : 100;

  const metrics = [
    { icon: HardDrive, label: "Memory Used", value: info.usedMemoryHuman },
    { icon: HardDrive, label: "Memory RSS", value: info.usedMemoryRssHuman },
    { icon: Clock, label: "Uptime", value: formatUptime(info.uptimeSeconds) },
    { icon: Users, label: "Clients", value: String(info.connectedClients) },
    { icon: Database, label: "Keys", value: info.dbSize.toLocaleString() },
    { icon: Zap, label: "Hit Rate", value: `${hitRate}%` },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <Database className="size-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">DragonflyDB</CardTitle>
              <CardDescription className="text-xs">v{info.version} · {info.role}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 rounded-md border bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-base font-semibold tabular-nums">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="size-3.5" />
            {info.totalCommandsProcessed.toLocaleString()} total commands
          </span>
          <span>·</span>
          <span>{info.keyspaceHits.toLocaleString()} hits / {info.keyspaceMisses.toLocaleString()} misses</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function InfrastructurePage() {
  const queues = useQueueStats();
  const dragonfly = useDragonflyInfo();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Infrastructure"
          description="Queue health, job statistics, and data store metrics."
        />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="size-3" />
          Auto-refreshes every 5s
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Server className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Data Store</h2>
        </div>
        {dragonfly.isLoading ? (
          <CardSkeleton />
        ) : dragonfly.data ? (
          <DragonflyCard info={dragonfly.data} />
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ListChecks className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Job Queues</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {queues.isLoading
            ? Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)
            : queues.data?.map((q) => <QueueCard key={q.name} queue={q} />)}
        </div>
      </section>
    </div>
  );
}
