"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type {
  CreateIncidentDto,
  CreateIncidentUpdateDto,
  Incident,
  IncidentUpdate,
  UpdateIncidentDto,
} from "@/types/status-page";

export const incidentKeys = {
  all: ["incidents"] as const,
  list: (statusPageId: number) =>
    [...incidentKeys.all, "list", statusPageId] as const,
  detail: (id: number) => [...incidentKeys.all, "detail", id] as const,
};

export function useIncidents(statusPageId: number) {
  return useQuery({
    queryKey: incidentKeys.list(statusPageId),
    queryFn: () =>
      apiRequest<Incident[]>(`/api/v1/incidents?statusPageId=${statusPageId}`),
    enabled: statusPageId > 0,
  });
}

export function useIncident(id: number) {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => apiRequest<Incident>(`/api/v1/incidents/${id}`),
    enabled: id > 0,
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIncidentDto) =>
      apiRequest<Incident>("/api/v1/incidents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({
        queryKey: incidentKeys.list(vars.statusPageId),
      }),
  });
}

export function useUpdateIncident(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateIncidentDto) =>
      apiRequest<Incident>(`/api/v1/incidents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: incidentKeys.detail(id) });
      qc.invalidateQueries({
        queryKey: incidentKeys.list(data.statusPageId),
      });
    },
  });
}

export function useDeleteIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ message: string }>(`/api/v1/incidents/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: incidentKeys.all }),
  });
}

export function useAddIncidentUpdate(incidentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIncidentUpdateDto) =>
      apiRequest<IncidentUpdate>(`/api/v1/incidents/${incidentId}/updates`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: incidentKeys.all }),
  });
}
