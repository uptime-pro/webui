"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { Monitor } from "@/types/monitor";
import type {
  CreateStatusPageDto,
  StatusPage,
  UpdateStatusPageDto,
} from "@/types/status-page";

export const statusPageKeys = {
  all: ["status-pages"] as const,
  list: () => [...statusPageKeys.all, "list"] as const,
  detail: (id: number) => [...statusPageKeys.all, "detail", id] as const,
  monitors: (id: number) => [...statusPageKeys.all, "monitors", id] as const,
};

export function useStatusPages() {
  return useQuery({
    queryKey: statusPageKeys.list(),
    queryFn: () => apiRequest<StatusPage[]>("/api/v1/status-pages"),
  });
}

export function useStatusPage(id: number) {
  return useQuery({
    queryKey: statusPageKeys.detail(id),
    queryFn: () => apiRequest<StatusPage>(`/api/v1/status-pages/${id}`),
    enabled: id > 0,
  });
}

export function useCreateStatusPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStatusPageDto) =>
      apiRequest<StatusPage>("/api/v1/status-pages", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusPageKeys.list() }),
  });
}

export function useUpdateStatusPage(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateStatusPageDto) =>
      apiRequest<StatusPage>(`/api/v1/status-pages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: statusPageKeys.list() });
      qc.invalidateQueries({ queryKey: statusPageKeys.detail(id) });
    },
  });
}

export function useDeleteStatusPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ message: string }>(`/api/v1/status-pages/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusPageKeys.list() }),
  });
}

export function useSetStatusPageMonitors(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (monitorIds: number[]) =>
      apiRequest<{ monitors: { monitorId: number }[] }>(
        `/api/v1/status-pages/${id}/monitors`,
        {
          method: "PUT",
          body: JSON.stringify({
            monitors: monitorIds.map((monitorId) => ({ monitorId })),
          }),
        },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: statusPageKeys.monitors(id) }),
  });
}

export function useStatusPageMonitors(id: number) {
  return useQuery({
    queryKey: statusPageKeys.monitors(id),
    queryFn: () => apiRequest<Monitor[]>(`/api/v1/status-pages/${id}/monitors`),
    enabled: id > 0,
  });
}
