"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { CreateTagDto, Tag, UpdateTagDto } from "@/types/tag";

export const tagKeys = {
  all: ["tags"] as const,
  list: () => [...tagKeys.all, "list"] as const,
  detail: (id: number) => [...tagKeys.all, "detail", id] as const,
};

export function useTags() {
  return useQuery({
    queryKey: tagKeys.list(),
    queryFn: () => apiRequest<Tag[]>("/api/v1/tags"),
  });
}

export function useTag(id: number) {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: () => apiRequest<Tag>(`/api/v1/tags/${id}`),
    enabled: id > 0,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTagDto) =>
      apiRequest<Tag>("/api/v1/tags", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.list() }),
  });
}

export function useUpdateTag(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTagDto) =>
      apiRequest<Tag>(`/api/v1/tags/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.list() });
      qc.invalidateQueries({ queryKey: tagKeys.detail(id) });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ message: string }>(`/api/v1/tags/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.list() }),
  });
}
