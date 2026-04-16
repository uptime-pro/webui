"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type {
  CreateNotificationDto,
  Notification,
  UpdateNotificationDto,
} from "@/types/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  detail: (id: number) => [...notificationKeys.all, "detail", id] as const,
  monitorAssignments: (monitorId: number) =>
    [...notificationKeys.all, "monitor", monitorId] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => apiRequest<Notification[]>("/api/v1/notifications"),
  });
}

export function useNotification(id: number) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => apiRequest<Notification>(`/api/v1/notifications/${id}`),
    enabled: id > 0,
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNotificationDto) =>
      apiRequest<Notification>("/api/v1/notifications", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: notificationKeys.list() }),
  });
}

export function useUpdateNotification(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateNotificationDto) =>
      apiRequest<Notification>(`/api/v1/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list() });
      qc.invalidateQueries({ queryKey: notificationKeys.detail(id) });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ message: string }>(`/api/v1/notifications/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: notificationKeys.list() }),
  });
}

export function useTestNotification() {
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ message: string }>(`/api/v1/notifications/${id}/test`, {
        method: "POST",
      }),
  });
}

export function useTestNotificationDirect() {
  return useMutation({
    mutationFn: ({ type, config }: { type: string; config: Record<string, unknown> }) =>
      apiRequest<void>("/api/v1/notifications/test", {
        method: "POST",
        body: JSON.stringify({ type, config }),
      }),
  });
}

export function useMonitorNotifications(monitorId: number) {
  return useQuery({
    queryKey: notificationKeys.monitorAssignments(monitorId),
    queryFn: () =>
      apiRequest<{ notificationIds: number[] }>(
        `/api/v1/notifications/monitor/${monitorId}`,
      ),
    enabled: monitorId > 0,
  });
}

export function useAssignMonitorNotifications(monitorId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationIds: number[]) =>
      apiRequest<{ notificationIds: number[] }>(
        `/api/v1/notifications/monitor/${monitorId}`,
        {
          method: "PUT",
          body: JSON.stringify({ notificationIds }),
        },
      ),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: notificationKeys.monitorAssignments(monitorId),
      }),
  });
}
