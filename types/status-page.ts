export type IncidentStatus =
  | "INVESTIGATING"
  | "IDENTIFIED"
  | "MONITORING"
  | "RESOLVED";
export type IncidentSeverity = "CRITICAL" | "MAJOR" | "MINOR" | "MAINTENANCE";

export interface StatusPageMonitor {
  id: number;
  name: string;
  type: string;
  groupName?: string | null;
  ordering: number;
  lastStatus: "up" | "down" | "pending";
  lastPing?: number | null;
  uptimePct: number;
  history: { date: string; up: number; total: number }[];
}

export interface IncidentUpdate {
  id: number;
  message: string;
  status: IncidentStatus;
  createdAt: string;
}

export interface Incident {
  id: number;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  message?: string;
  statusPageId: number;
  createdAt: string;
  updatedAt: string;
  updates: IncidentUpdate[];
}

export interface MaintenanceWindow {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

export interface StatusPage {
  id: number;
  userId: number;
  title: string;
  slug: string;
  description?: string;
  customDomain?: string;
  logoUrl?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStatusPage {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  published: boolean;
  footerText?: string | null;
  theme?: string;
  customCss?: string | null;
  monitors: StatusPageMonitor[];
  incidents: Incident[];
  maintenanceWindows: MaintenanceWindow[];
}

export interface CreateStatusPageDto {
  title: string;
  slug: string;
  description?: string;
  customDomain?: string;
  logoUrl?: string;
  published?: boolean;
}

export interface UpdateStatusPageDto {
  title?: string;
  slug?: string;
  description?: string;
  customDomain?: string;
  logoUrl?: string;
  published?: boolean;
}

export interface CreateIncidentDto {
  title: string;
  statusPageId: number;
  severity?: IncidentSeverity;
  message?: string;
}

export interface UpdateIncidentDto {
  title?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  message?: string;
}

export interface CreateIncidentUpdateDto {
  message: string;
  status?: IncidentStatus;
}
