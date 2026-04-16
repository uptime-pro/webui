"use client";
import { use } from "react";
import { Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/monitor/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHeartbeatsPaginated } from "@/hooks/use-heartbeats";

export default function HeartbeatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = parseInt(idStr, 10);
  const { heartbeats, isLoading, hasMore, loadMore, loadingMore, total } =
    useHeartbeatsPaginated(id);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!heartbeats.length)
    return (
      <p className="text-muted-foreground text-sm">
        No heartbeats recorded yet.
      </p>
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {total} heartbeat{total !== 1 ? "s" : ""}
          {hasMore ? " (scroll down to load more)" : ""}
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ping</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {heartbeats.map((hb) => (
              <TableRow key={hb.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(hb.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <StatusBadge status={hb.status} active={true} size="sm" />
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {hb.ping !== null ? `${hb.ping.toFixed(0)}ms` : "—"}
                </TableCell>
                <TableCell className="text-sm max-w-xs truncate">
                  {hb.msg ?? "—"}
                </TableCell>
                <TableCell className="text-sm tabular-nums">{hb.retries}</TableCell>
                <TableCell className="text-sm tabular-nums">{hb.duration}ms</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}

      {!hasMore && total > 0 && (
        <p className="text-center text-xs text-muted-foreground py-2">
          All {total} heartbeats loaded
        </p>
      )}
    </div>
  );
}
