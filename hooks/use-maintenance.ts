"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type {
  CreateMaintenanceDto,
  MaintenanceWindow,
  UpdateMaintenanceDto,
} from "@/types/maintenance";

export const maintenanceKeys = {
  all: ["maintenance"] as const,
  list: () => [...maintenanceKeys.all, "list"] as const,
  detail: (id: number) => [...maintenanceKeys.all, "detail", id] as const,
};

export function useMaintenanceWindows() {
  return useQuery({
    queryKey: maintenanceKeys.list(),
    queryFn: () => apiRequest<MaintenanceWindow[]>("/api/v1/maintenance"),
  });
}

export function useMaintenanceWindow(id: number) {
  return useQuery({
    queryKey: maintenanceKeys.detail(id),
    queryFn: () => apiRequest<MaintenanceWindow>(`/api/v1/maintenance/${id}`),
    enabled: id > 0,
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaintenanceDto) =>
      apiRequest<MaintenanceWindow>("/api/v1/maintenance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.list() }),
  });
}

export function useUpdateMaintenance(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMaintenanceDto) =>
      apiRequest<MaintenanceWindow>(`/api/v1/maintenance/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: maintenanceKeys.list() });
      qc.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
    },
  });
}

export function useDeleteMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ message: string }>(`/api/v1/maintenance/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.list() }),
  });
}
