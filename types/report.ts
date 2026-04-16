export interface ReportConfig {
  enabled: boolean;
  recipientEmail: string;
  frequency: "daily" | "weekly" | "monthly";
}

export type UpdateReportConfigDto = Partial<ReportConfig>;
