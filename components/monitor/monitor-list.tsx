"use client";
import {
  Activity,
  Package,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useHeartbeats } from "@/hooks/use-heartbeats";
import { useDeleteMonitor, useMonitors } from "@/hooks/use-monitors";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Monitor } from "@/types/monitor";
import { HeartbeatBar } from "./heartbeat-bar";
import { SlaBadge } from "./sla-badge";
import { StatusBadge } from "./status-badge";

type GroupBy = "none" | "status" | "tag";

function monitorStatus(monitor: Monitor): "up" | "down" | "pending" {
  if (!monitor.active) return "pending";
  if (monitor.lastStatus === null) return "pending";
  return monitor.lastStatus ? "up" : "down";
}

function MonitorRow({
  monitor,
  selected,
  onToggle,
}: {
  monitor: Monitor;
  selected: boolean;
  onToggle: (id: number) => void;
}) {
  const { data: heartbeats = [] } = useHeartbeats(monitor.id, 50);

  return (
    <div className="flex items-stretch border-b hover:bg-accent/50 transition-colors">
      <div className="flex items-center px-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(monitor.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${monitor.name}`}
          className="h-4 w-4 rounded border-gray-300"
        />
      </div>
      <Link href={`/dashboard/${monitor.id}`} className="flex-1 px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm truncate mr-2">
            {monitor.name}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs uppercase">
              {monitor.type}
            </Badge>
            <StatusBadge
              status={monitor.lastStatus}
              active={monitor.active}
              size="sm"
            />
            <SlaBadge
              monitorId={monitor.id}
              slaTarget={monitor.slaTarget}
              compact
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <HeartbeatBar heartbeats={heartbeats} maxBars={30} />
          {monitor.lastPing !== null && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {monitor.lastPing.toFixed(0)}ms
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

function GroupSection({
  title,
  monitors,
  selected,
  onToggle,
}: {
  title: string;
  monitors: Monitor[];
  selected: Set<number>;
  onToggle: (id: number) => void;
}) {
  if (monitors.length === 0) return null;
  return (
    <div>
      <div className="px-4 py-1.5 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title} ({monitors.length})
      </div>
      {monitors.map((m) => (
        <MonitorRow
          key={m.id}
          monitor={m}
          selected={selected.has(m.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

export function MonitorList() {
  useWebSocket();
  const { data: monitors, isLoading } = useMonitors();
  const deleteMonitor = useDeleteMonitor();

  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!monitors) return;
    if (selected.size === monitors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(monitors.map((m) => m.id)));
    }
  }

  async function bulkPause() {
    setBulkPending(true);
    await Promise.allSettled(
      Array.from(selected).map((id) =>
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/v1/monitors/${id}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: false }),
          },
        ),
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
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/v1/monitors/${id}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: true }),
          },
        ),
      ),
    );
    setBulkPending(false);
    setSelected(new Set());
  }

  async function bulkDelete() {
    setBulkPending(true);
    await Promise.allSettled(
      Array.from(selected).map((id) => deleteMonitor.mutateAsync(id)),
    );
    setBulkPending(false);
    setSelected(new Set());
    setShowDeleteConfirm(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!monitors?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Activity className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">No monitors yet.</p>
        <Button asChild size="sm">
          <Link href="/monitors/add">
            <Plus className="h-4 w-4 mr-1" />
            Add Monitor
          </Link>
        </Button>
      </div>
    );
  }

  function renderGrouped() {
    if (!monitors) return null;
    if (groupBy === "status") {
      const groups: Record<"up" | "down" | "pending", Monitor[]> = {
        up: [],
        down: [],
        pending: [],
      };
      for (const m of monitors) groups[monitorStatus(m)].push(m);
      return (
        <>
          <GroupSection
            title="Down"
            monitors={groups.down}
            selected={selected}
            onToggle={toggleSelect}
          />
          <GroupSection
            title="Up"
            monitors={groups.up}
            selected={selected}
            onToggle={toggleSelect}
          />
          <GroupSection
            title="Pending / Paused"
            monitors={groups.pending}
            selected={selected}
            onToggle={toggleSelect}
          />
        </>
      );
    }
    if (groupBy === "tag") {
      const tagMap = new Map<string, Monitor[]>();
      const untagged: Monitor[] = [];
      for (const m of monitors) {
        const tags = (m.config.tags as string[] | undefined) ?? [];
        if (tags.length === 0) {
          untagged.push(m);
        } else {
          for (const tag of tags) {
            if (!tagMap.has(tag)) tagMap.set(tag, []);
            tagMap.get(tag)?.push(m);
          }
        }
      }
      return (
        <>
          {Array.from(tagMap.entries()).map(([tag, ms]) => (
            <GroupSection
              key={tag}
              title={tag}
              monitors={ms}
              selected={selected}
              onToggle={toggleSelect}
            />
          ))}
          {untagged.length > 0 && (
            <GroupSection
              title="Untagged"
              monitors={untagged}
              selected={selected}
              onToggle={toggleSelect}
            />
          )}
        </>
      );
    }
    return monitors.map((monitor) => (
      <MonitorRow
        key={monitor.id}
        monitor={monitor}
        selected={selected.has(monitor.id)}
        onToggle={toggleSelect}
      />
    ));
  }

  const allSelected = monitors.length > 0 && selected.size === monitors.length;
  const someSelected = selected.size > 0;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected;
            }}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300"
            aria-label="Select all monitors"
          />
          <span className="text-sm font-medium text-muted-foreground">
            {monitors.length} monitor{monitors.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={groupBy}
            onValueChange={(v) => setGroupBy(v as GroupBy)}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No grouping</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="tag">By Tag</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild size="sm" variant="ghost">
            <Link href="/monitors/add">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/monitors/import-export">
              <Package className="h-4 w-4 mr-1" />
              Import/Export
            </Link>
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-2 bg-accent/60 border-b text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkPending}
            onClick={bulkPause}
          >
            <PauseCircle className="h-3.5 w-3.5 mr-1" />
            Pause
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkPending}
            onClick={bulkResume}
          >
            <PlayCircle className="h-3.5 w-3.5 mr-1" />
            Resume
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={bulkPending}
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {renderGrouped()}

      {/* Bulk delete confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selected.size} monitor{selected.size !== 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All data for the selected monitors
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={bulkPending}
              onClick={bulkDelete}
            >
              {bulkPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
