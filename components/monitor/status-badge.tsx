"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  status: boolean | null;
  active: boolean;
  size?: "sm" | "md";
}

export function StatusBadge({ status, active, size = "md" }: Props) {
  if (!active)
    return (
      <Badge variant="secondary" className={cn(size === "sm" && "text-xs")}>
        Paused
      </Badge>
    );
  if (status === null)
    return (
      <Badge variant="outline" className={cn(size === "sm" && "text-xs")}>
        Pending
      </Badge>
    );
  return (
    <Badge
      className={cn(
        status
          ? "bg-green-500 hover:bg-green-600"
          : "bg-red-500 hover:bg-red-600",
        "text-white",
        size === "sm" && "text-xs",
      )}
    >
      {status ? "Up" : "Down"}
    </Badge>
  );
}
