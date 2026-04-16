export type MaintenanceStrategy =
  | "manual"
  | "one-time"
  | "recurring-interval"
  | "recurring-weekday"
  | "recurring-day-of-month"
  | "cron";

export interface MaintenanceWindow {
  id: number;
  title: string;
  strategy: MaintenanceStrategy;
  active: boolean;
  startDate?: string;
  endDate?: string;
  weekdays?: number[];
  hours?: number[];
  durationMinutes: number;
  cronExpr?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  monitorIds?: number[];
}

export interface CreateMaintenanceDto {
  title: string;
  strategy: MaintenanceStrategy;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  weekdays?: number[];
  hours?: number[];
  durationMinutes?: number;
  cronExpr?: string;
  timezone?: string;
}

export interface UpdateMaintenanceDto {
  title?: string;
  strategy?: MaintenanceStrategy;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  weekdays?: number[];
  hours?: number[];
  durationMinutes?: number;
  cronExpr?: string;
  timezone?: string;
}
