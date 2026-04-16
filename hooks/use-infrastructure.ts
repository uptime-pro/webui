"use client";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export interface QueueCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface QueueStat {
  name: string;
  displayName: string;
  counts: QueueCounts;
  workerCount: number;
}

export type DragonflyInfo =
  | {
      status: "connected";
      version: string;
      uptimeSeconds: number;
      connectedClients: number;
      usedMemoryHuman: string;
      usedMemoryRssHuman: string;
      totalCommandsProcessed: number;
      keyspaceHits: number;
      keyspaceMisses: number;
      dbSize: number;
      role: string;
    }
  | { status: "error"; error: string };

export function useQueueStats() {
  return useQuery({
    queryKey: ["infrastructure", "queues"],
    queryFn: () => apiRequest<QueueStat[]>("/api/v1/infrastructure/queues"),
    refetchInterval: 5000,
  });
}

export function useDragonflyInfo() {
  return useQuery({
    queryKey: ["infrastructure", "dragonfly"],
    queryFn: () => apiRequest<DragonflyInfo>("/api/v1/infrastructure/dragonfly"),
    refetchInterval: 10000,
  });
}
