"use client";
import { useState } from "react";
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

const PAGE_SIZE = 50;

export function useHeartbeatsPaginated(monitorId: number) {
  const [pages, setPages] = useState<Heartbeat[][]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const firstPage = useQuery({
    queryKey: [...monitorKeys.heartbeats(monitorId), "paginated", "first"],
    queryFn: async () => {
      const data = await apiRequest<Heartbeat[]>(
        `/api/v1/monitors/${monitorId}/heartbeats?limit=${PAGE_SIZE}`,
      );
      setPages([data]);
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setCursor(data[data.length - 1]?.createdAt ?? null);
      }
      return data;
    },
    enabled: monitorId > 0,
  });

  async function loadMore() {
    if (!cursor || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await apiRequest<Heartbeat[]>(
        `/api/v1/monitors/${monitorId}/heartbeats?limit=${PAGE_SIZE}&before=${encodeURIComponent(cursor)}`,
      );
      setPages((prev) => [...prev, data]);
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setCursor(data[data.length - 1]?.createdAt ?? null);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  const allHeartbeats = pages.flat();

  return {
    heartbeats: allHeartbeats,
    isLoading: firstPage.isLoading,
    hasMore,
    loadMore,
    loadingMore,
    total: allHeartbeats.length,
  };
}
