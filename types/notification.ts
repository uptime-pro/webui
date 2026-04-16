export type NotificationType =
  | "discord"
  | "slack"
  | "email"
  | "webhook"
  | "teams"
  | "telegram"
  | "pushover"
  | "gotify"
  | "ntfy";

export interface Notification {
  id: number;
  userId: number;
  name: string;
  type: NotificationType;
  config: Record<string, unknown>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationDto {
  name: string;
  type: NotificationType;
  config: Record<string, unknown>;
  isDefault?: boolean;
}

export interface UpdateNotificationDto {
  name?: string;
  type?: NotificationType;
  config?: Record<string, unknown>;
  isDefault?: boolean;
}
