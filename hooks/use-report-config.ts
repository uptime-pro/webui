"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { ReportConfig, UpdateReportConfigDto } from "@/types/report";

export const reportConfigKeys = {
  all: ["report-config"] as const,
  detail: () => [...reportConfigKeys.all, "detail"] as const,
};

export function useReportConfig() {
  return useQuery({
    queryKey: reportConfigKeys.detail(),
    queryFn: () => apiRequest<ReportConfig>("/api/v1/reports/config"),
  });
}

export function useUpdateReportConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateReportConfigDto) =>
      apiRequest<ReportConfig>("/api/v1/reports/config", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: reportConfigKeys.detail() }),
  });
}
