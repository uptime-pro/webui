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
  | "group";
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
