"use client";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { Heartbeat } from "@/types/monitor";
import { monitorKeys } from "./use-monitors";

export function useHeartbeats(monitorId: number, limit = 100) {
  return useQuery({
    queryKey: monitorKeys.heartbeats(monitorId),
    queryFn: () =>
      apiRequest<Heartbeat[]>(
        `/api/v1/monitors/${monitorId}/heartbeats?limit=${limit}`,
      ),
    enabled: monitorId > 0,
  });
}
