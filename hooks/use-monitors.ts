"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type {
  Monitor,
  MonitorExportData,
  MonitorImportItem,
  MonitorImportResult,
  SlaStats,
} from "@/types/monitor";

export const monitorKeys = {
  all: ["monitors"] as const,
  list: () => [...monitorKeys.all, "list"] as const,
  detail: (id: number) => [...monitorKeys.all, "detail", id] as const,
  heartbeats: (id: number) => [...monitorKeys.all, "heartbeats", id] as const,
};

export function useMonitors() {
  return useQuery({
    queryKey: monitorKeys.list(),
    queryFn: () => apiRequest<Monitor[]>("/api/v1/monitors"),
  });
}

export function useMonitor(id: number) {
  return useQuery({
    queryKey: monitorKeys.detail(id),
    queryFn: () => apiRequest<Monitor>(`/api/v1/monitors/${id}`),
    enabled: id > 0,
  });
}

export function useCreateMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Monitor>) =>
      apiRequest<Monitor>("/api/v1/monitors", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: monitorKeys.list() }),
  });
}

export function useUpdateMonitor(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Monitor>) =>
      apiRequest<Monitor>(`/api/v1/monitors/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: monitorKeys.list() });
      qc.invalidateQueries({ queryKey: monitorKeys.detail(id) });
    },
  });
}

export function useDeleteMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/v1/monitors/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: monitorKeys.list() }),
  });
}

export function usePauseMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/v1/monitors/${id}/pause`, { method: "POST" }),
    onSuccess: (_data, id) =>
      qc.invalidateQueries({ queryKey: monitorKeys.detail(id) }),
  });
}

export function useResumeMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/v1/monitors/${id}/resume`, { method: "POST" }),
    onSuccess: (_data, id) =>
      qc.invalidateQueries({ queryKey: monitorKeys.detail(id) }),
  });
}

export function useManualCheck() {
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/v1/monitors/${id}/check`, { method: "POST" }),
  });
}

export const monitorSlaKeys = {
  all: ["monitor-sla"] as const,
  detail: (id: number, days: number) =>
    [...monitorSlaKeys.all, id, days] as const,
};

export function useMonitorSla(id: number, days = 30) {
  return useQuery({
    queryKey: monitorSlaKeys.detail(id, days),
    queryFn: () =>
      apiRequest<SlaStats>(`/api/v1/monitors/${id}/sla?days=${days}`),
    enabled: id > 0,
  });
}

export function useExportMonitors() {
  return useQuery({
    queryKey: ["monitors-export"],
    queryFn: () => apiRequest<MonitorExportData>("/api/v1/monitors/export"),
    enabled: false,
  });
}

export function useImportMonitors() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (monitors: MonitorImportItem[]) =>
      apiRequest<MonitorImportResult>("/api/v1/monitors/import", {
        method: "POST",
        body: JSON.stringify({ monitors }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: monitorKeys.list() }),
  });
}
