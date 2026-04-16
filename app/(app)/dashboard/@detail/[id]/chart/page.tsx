"use client";
import { use } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useHeartbeats } from "@/hooks/use-heartbeats";

export default function ChartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = parseInt(idStr, 10);
  const { data: heartbeats, isLoading } = useHeartbeats(id, 200);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const chartData = heartbeats
    ?.filter((hb) => hb.ping !== null && hb.status)
    .map((hb) => ({
      time: new Date(hb.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ping: hb.ping,
    }));

  if (!chartData?.length) {
    return (
      <p className="text-muted-foreground text-sm">
        No response time data available yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Response Time (ms)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11 }} unit="ms" width={55} />
          <Tooltip
            formatter={(value) => [
              value != null ? `${value}ms` : "N/A",
              "Ping",
            ]}
          />
          <Line
            type="monotone"
            dataKey="ping"
            stroke="hsl(var(--primary))"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
