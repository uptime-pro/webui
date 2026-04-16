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
    .slice()
    .reverse()
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Response Time</h3>
        <span className="text-xs text-muted-foreground">{chartData.length} data points</span>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.1}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              unit="ms"
              width={52}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                borderRadius: "var(--radius)",
                fontSize: "12px",
              }}
              labelStyle={{ color: "var(--color-foreground)", opacity: 0.6 }}
              itemStyle={{ color: "var(--color-chart-1)" }}
              formatter={(value) => [
                value != null ? `${value}ms` : "N/A",
                "Ping",
              ]}
            />
            <Line
              type="monotone"
              dataKey="ping"
              stroke="var(--color-chart-1)"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

