"use client";
import {
  Activity,
  Edit,
  Package,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHeartbeats } from "@/hooks/use-heartbeats";
import {
  useDeleteMonitor,
  useMonitors,
  usePauseMonitor,
  useResumeMonitor,
} from "@/hooks/use-monitors";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Monitor } from "@/types/monitor";
import { HeartbeatBar } from "./heartbeat-bar";
import { SlaBadge } from "./sla-badge";

type GroupBy = "none" | "status" | "tag";
type StatusFilter = "all" | "up" | "down" | "paused";

function monitorDisplayStatus(monitor: Monitor): "up" | "down" | "paused" {
  if (!monitor.active) return "paused";
  if (monitor.lastStatus === null) return "paused";
  return monitor.lastStatus ? "up" : "down";
}

function StatusDot({ status }: { status: "up" | "down" | "paused" }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        status === "up"
          ? "bg-green-500"
          : status === "down"
            ? "bg-destructive"
            : "bg-muted-foreground",
      )}
    />
  );
}

function PanelRow({
  monitor,
  selected,
  onToggle,
}: {
  monitor: Monitor;
  selected: boolean;
  onToggle: (id: number) => void;
}) {
  const { data: heartbeats = [] } = useHeartbeats(monitor.id, 20);
  const pause = usePauseMonitor();
  const resume = useResumeMonitor();
  const deleteMut = useDeleteMonitor();
  const [showDelete, setShowDelete] = useState(false);
  const status = monitorDisplayStatus(monitor);
  const target =
    (monitor.config.url as string | undefined) ||
    (monitor.config.hostname as string | undefined) ||
    (monitor.config.host as string | undefined);

  return (
    <>
      <TableRow className="h-9">
        <TableCell className="w-8 pr-0 py-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(monitor.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${monitor.name}`}
            className="h-3.5 w-3.5 rounded border-gray-300"
          />
        </TableCell>
        <TableCell className="py-1">
          <Link href={`/dashboard/${monitor.id}`} className="flex items-center gap-2 group/link min-w-0">
            <StatusDot status={status} />
            <span className="font-medium text-sm truncate max-w-[160px] group-hover/link:underline">
              {monitor.name}
            </span>
            {target && (
              <span className="text-xs text-muted-foreground truncate hidden lg:block max-w-[140px]">
                {target}
              </span>
            )}
          </Link>
        </TableCell>
        <TableCell className="py-1 hidden sm:table-cell">
          <Badge variant="secondary" className="text-xs uppercase py-0">
            {monitor.type}
          </Badge>
        </TableCell>
        <TableCell className="py-1 hidden md:table-cell w-28">
          <HeartbeatBar heartbeats={heartbeats} maxBars={16} />
        </TableCell>
        <TableCell className="py-1 hidden lg:table-cell">
          <SlaBadge monitorId={monitor.id} slaTarget={monitor.slaTarget} compact />
        </TableCell>
        <TableCell className="py-1 hidden xl:table-cell text-xs text-muted-foreground tabular-nums">
          {monitor.lastPing !== null ? `${monitor.lastPing.toFixed(0)}ms` : "—"}
        </TableCell>
        <TableCell className="py-1 w-20 text-right">
          <div className="flex items-center justify-end gap-0">
            <Button size="icon" variant="ghost" className="h-6 w-6" render={<Link href={`/monitors/${monitor.id}/edit`} title="Edit" />}>
              <Edit className="h-3 w-3" />
            </Button>
            {monitor.active ? (
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Pause"
                disabled={pause.isPending}
                onClick={(e) => { e.preventDefault(); pause.mutate(monitor.id); }}
              >
                <PauseCircle className="h-3 w-3" />
              </Button>
            ) : (
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Resume"
                disabled={resume.isPending}
                onClick={(e) => { e.preventDefault(); resume.mutate(monitor.id); }}
              >
                <PlayCircle className="h-3 w-3" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"
              title="Delete"
              onClick={(e) => { e.preventDefault(); setShowDelete(true); }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{monitor.name}&quot;?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All data for this monitor will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMut.isPending}
              onClick={() => deleteMut.mutateAsync(monitor.id).then(() => setShowDelete(false))}
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GroupHeader({ title, count }: { title: string; count: number }) {
  return (
    <TableRow className="hover:bg-transparent h-7">
      <TableCell colSpan={7} className="py-1 bg-muted/40">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title} ({count})
        </span>
      </TableCell>
    </TableRow>
  );
}

export function MonitorPanel() {
  useWebSocket();
  const { data: monitors, isLoading } = useMonitors();
  const deleteMonitor = useDeleteMonitor();

  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(filtered: Monitor[]) {
    if (filtered.every((m) => selected.has(m.id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((m) => m.id)));
    }
  }

  async function bulkPause() {
    setBulkPending(true);
    await Promise.allSettled(
      Array.from(selected).map((id) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/v1/monitors/${id}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: false }),
        }),
      ),
    );
    setBulkPending(false);
    setSelected(new Set());
    deleteMonitor.reset();
  }

  async function bulkResume() {
    setBulkPending(true);
    await Promise.allSettled(
      Array.from(selected).map((id) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/v1/monitors/${id}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: true }),
        }),
      ),
    );
    setBulkPending(false);
    setSelected(new Set());
  }

  async function bulkDelete() {
    setBulkPending(true);
    await Promise.allSettled(Array.from(selected).map((id) => deleteMonitor.mutateAsync(id)));
    setBulkPending(false);
    setSelected(new Set());
    setShowBulkDeleteConfirm(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Skeleton key={i} className="h-8 w-48 rounded-md" />
        ))}
      </div>
    );
  }

  const allMonitors = monitors ?? [];
  const upCount = allMonitors.filter((m) => m.active && m.lastStatus === true).length;
  const downCount = allMonitors.filter((m) => m.active && m.lastStatus === false).length;
  const pausedCount = allMonitors.filter((m) => !m.active).length;
  const total = allMonitors.length;

  const filtered = allMonitors
    .filter((m) => {
      if (statusFilter === "up") return m.active && m.lastStatus === true;
      if (statusFilter === "down") return m.active && m.lastStatus === false;
      if (statusFilter === "paused") return !m.active;
      return true;
    })
    .filter((m) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const target =
        (m.config.url as string | undefined) ||
        (m.config.hostname as string | undefined) ||
        (m.config.host as string | undefined) || "";
      return m.name.toLowerCase().includes(q) || target.toLowerCase().includes(q);
    });

  const allSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const someSelected = selected.size > 0;

  function renderRows() {
    if (groupBy === "status") {
      const groups: Record<"up" | "down" | "paused", Monitor[]> = { up: [], down: [], paused: [] };
      for (const m of filtered) groups[monitorDisplayStatus(m)].push(m);
      const rows: React.ReactNode[] = [];
      for (const [label, ms] of [["Down", groups.down], ["Up", groups.up], ["Paused", groups.paused]] as [string, Monitor[]][]) {
        if (ms.length === 0) continue;
        rows.push(<GroupHeader key={`hdr-${label}`} title={label} count={ms.length} />);
        for (const m of ms) rows.push(<PanelRow key={m.id} monitor={m} selected={selected.has(m.id)} onToggle={toggleSelect} />);
      }
      return rows;
    }
    if (groupBy === "tag") {
      const tagMap = new Map<string, Monitor[]>();
      const untagged: Monitor[] = [];
      for (const m of filtered) {
        const tags = (m.config.tags as string[] | undefined) ?? [];
        if (tags.length === 0) { untagged.push(m); }
        else { for (const tag of tags) { if (!tagMap.has(tag)) tagMap.set(tag, []); tagMap.get(tag)?.push(m); } }
      }
      const rows: React.ReactNode[] = [];
      for (const [tag, ms] of tagMap) {
        rows.push(<GroupHeader key={`hdr-${tag}`} title={tag} count={ms.length} />);
        for (const m of ms) rows.push(<PanelRow key={m.id} monitor={m} selected={selected.has(m.id)} onToggle={toggleSelect} />);
      }
      if (untagged.length > 0) {
        rows.push(<GroupHeader key="hdr-untagged" title="Untagged" count={untagged.length} />);
        for (const m of untagged) rows.push(<PanelRow key={m.id} monitor={m} selected={selected.has(m.id)} onToggle={toggleSelect} />);
      }
      return rows;
    }
    return filtered.map((m) => <PanelRow key={m.id} monitor={m} selected={selected.has(m.id)} onToggle={toggleSelect} />);
  }

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 flex-wrap border-b bg-muted/30">
        {/* Inline stats summary */}
        <div className="flex items-center gap-2 text-sm shrink-0">
          <span className="font-medium tabular-nums">{total}</span>
          <span className="text-muted-foreground">monitors</span>
          {downCount > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs">{downCount} down</Badge>
          )}
          {upCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-green-500/15 text-green-600 dark:text-green-400">{upCount} up</Badge>
          )}
          {pausedCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{pausedCount} paused</Badge>
          )}
        </div>

        <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

        {/* Status filter tabs */}
        <div className="flex rounded-md border bg-background p-0.5 gap-0.5 shrink-0">
          {(["all", "up", "down", "paused"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-2.5 py-0.5 rounded text-xs font-medium transition-colors capitalize",
                statusFilter === f
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 w-40 text-xs"
        />

        {/* Bulk actions */}
        {someSelected && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" disabled={bulkPending} onClick={bulkPause}>
              <PauseCircle className="h-3 w-3 mr-1" />Pause
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" disabled={bulkPending} onClick={bulkResume}>
              <PlayCircle className="h-3 w-3 mr-1" />Resume
            </Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs px-2" disabled={bulkPending}
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <Trash2 className="h-3 w-3 mr-1" />Delete
            </Button>
          </div>
        )}

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No grouping</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="tag">By Tag</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" render={<Link href="/monitors/import-export" />}>
            <Package className="h-3 w-3 mr-1" />Import
          </Button>
          <Button size="sm" className="h-7 text-xs px-2.5" render={<Link href="/monitors/add" />}>
            <Plus className="h-3 w-3 mr-1" />Add
          </Button>
        </div>
      </div>

      {/* Table — max height so it doesn't take over the screen */}
      {total === 0 ? (
        <div className="flex items-center justify-center gap-4 py-8 text-center">
          <Activity className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No monitors yet.</p>
          <Button size="sm" render={<Link href="/monitors/add" />}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add Monitor
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <p className="text-sm text-muted-foreground">No monitors match your filter.</p>
        </div>
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: "260px" }}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="h-8 hover:bg-transparent">
                <TableHead className="w-8 pr-0 py-1">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={() => toggleAll(filtered)}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                    aria-label="Select all monitors"
                  />
                </TableHead>
                <TableHead className="py-1 text-xs">Monitor</TableHead>
                <TableHead className="hidden sm:table-cell py-1 text-xs">Type</TableHead>
                <TableHead className="hidden md:table-cell py-1 text-xs">Last 24h</TableHead>
                <TableHead className="hidden lg:table-cell py-1 text-xs">Uptime</TableHead>
                <TableHead className="hidden xl:table-cell py-1 text-xs">Response</TableHead>
                <TableHead className="w-20 text-right py-1 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderRows()}</TableBody>
          </Table>
        </div>
      )}

      {/* Bulk delete confirm */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} monitor{selected.size !== 1 ? "s" : ""}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All data for the selected monitors will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" disabled={bulkPending} onClick={bulkDelete}>
              {bulkPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
