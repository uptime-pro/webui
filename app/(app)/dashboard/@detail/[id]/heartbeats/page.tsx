"use client";
import { use } from "react";
import { StatusBadge } from "@/components/monitor/status-badge";
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

export default function HeartbeatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = parseInt(idStr, 10);
  const { data: heartbeats, isLoading } = useHeartbeats(id, 200);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!heartbeats?.length)
    return (
      <p className="text-muted-foreground text-sm">
        No heartbeats recorded yet.
      </p>
    );

  return (
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
        {[...heartbeats].reverse().map((hb) => (
          <TableRow key={hb.id}>
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(hb.createdAt).toLocaleString()}
            </TableCell>
            <TableCell>
              <StatusBadge status={hb.status} active={true} size="sm" />
            </TableCell>
            <TableCell className="text-sm">
              {hb.ping !== null ? `${hb.ping.toFixed(0)}ms` : "—"}
            </TableCell>
            <TableCell className="text-sm max-w-xs truncate">
              {hb.msg ?? "—"}
            </TableCell>
            <TableCell className="text-sm">{hb.retries}</TableCell>
            <TableCell className="text-sm">{hb.duration}ms</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
