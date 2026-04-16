"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Heartbeat } from "@/types/monitor";

interface Props {
  heartbeats: Heartbeat[];
  maxBars?: number;
}

export function HeartbeatBar({ heartbeats, maxBars = 50 }: Props) {
  const recent = heartbeats.slice(-maxBars);
  const padding = maxBars - recent.length;
  const bars: (Heartbeat | null)[] = [
    ...Array<null>(padding).fill(null),
    ...recent,
  ];

  return (
    <TooltipProvider>
      <div className="flex gap-0.5 items-center">
        {bars.map((hb, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static-length bar with stable positions
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "h-8 w-2 rounded-sm",
                  hb === null
                    ? "bg-muted"
                    : hb.status
                      ? "bg-green-500"
                      : "bg-red-500",
                )}
              />
            </TooltipTrigger>
            {hb && (
              <TooltipContent>
                <p>
                  {hb.status ? "Up" : "Down"} —{" "}
                  {hb.ping ? `${hb.ping.toFixed(0)}ms` : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(hb.createdAt).toLocaleString()}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
