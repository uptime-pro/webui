export interface SlaStats {
  slaTarget: number | null;
  uptimePercent: number;
  totalChecks: number;
  upChecks: number;
}

export interface MonitorExportItem {
  name: string;
  type: string;
  active?: boolean;
  interval?: number;
  config: Record<string, unknown>;
  slaTarget?: number;
  responseTimeThreshold?: number;
}

export interface MonitorExportData {
  version: "1";
  exportedAt: string;
  monitors: MonitorExportItem[];
}

export type MonitorImportItem = MonitorExportItem;

export interface MonitorImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export type MonitorType =
  | "http"
  | "tcp"
  | "ping"
  | "push"
  | "dns"
  | "websocket"
  | "postgres"
  | "mysql"
  | "mssql"
  | "mongodb"
  | "redis"
  | "rabbitmq"
  | "mqtt"
  | "docker"
  | "grpc"
  | "steam"
  | "gamedig"
  | "tailscale-ping"
  | "snmp"
  | "smtp"
  | "sip"
  | "manual"
  | "group"
  | "ssl-cert"
  | "domain-expiry";
export type MonitorStatus = "up" | "down" | "pending";

export interface Monitor {
  id: number;
  userId: number;
  name: string;
  type: MonitorType;
  active: boolean;
  interval: number;
  retryInterval: number;
  maxRetries: number;
  notificationDelay: number;
  resendInterval: number;
  upsideDown: boolean;
  config: Record<string, unknown>;
  slaTarget?: number;
  responseTimeThreshold?: number;
  lastStatus: boolean | null;
  lastPing: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Heartbeat {
  id: number;
  monitorId: number;
  status: boolean;
  ping: number | null;
  msg: string | null;
  important: boolean;
  downCount: number;
  duration: number;
  retries: number;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface HeartbeatEvent {
  monitorId: number;
  status: boolean;
  ping: number | null;
  msg: string | null;
  createdAt: string;
}

export interface MonitorStatusEvent {
  monitorId: number;
  status: boolean;
  previousStatus: boolean | null;
  ping: number | null;
  msg: string | null;
  createdAt: string;
}
