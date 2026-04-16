import Image from "next/image";
import { notFound } from "next/navigation";
import type {
  Incident,
  MaintenanceWindow,
  PublicStatusPage,
  StatusPageMonitor,
} from "@/types/status-page";
import { SubscribeForm } from "./subscribe-form";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function getStatusPage(slug: string): Promise<PublicStatusPage | null> {
  const res = await fetch(`${API_BASE}/api/v1/status/${slug}`, {
    next: { revalidate: 30 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch status page");
  return res.json() as Promise<PublicStatusPage>;
}

// ── Overall status banner ────────────────────────────────────────────────────

function OverallStatus({ monitors }: { monitors: StatusPageMonitor[] }) {
  if (monitors.length === 0) {
    return (
      <div className="rounded-xl bg-muted px-6 py-5">
        <p className="text-sm font-medium text-muted-foreground">No monitors configured yet.</p>
      </div>
    );
  }
  const anyDown = monitors.some((m) => m.lastStatus === "down");
  const anyDegraded = monitors.some((m) => m.lastStatus === "pending");

  if (!anyDown && !anyDegraded) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 px-6 py-5 flex items-center gap-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-green-500 text-white text-xl shrink-0">✓</span>
        <div>
          <p className="text-lg font-semibold text-green-800">All Systems Operational</p>
          <p className="text-sm text-green-700 mt-0.5">All monitored services are up and running.</p>
        </div>
      </div>
    );
  }
  if (anyDown) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-6 py-5 flex items-center gap-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white text-xl shrink-0">✕</span>
        <div>
          <p className="text-lg font-semibold text-red-800">Major Outage</p>
          <p className="text-sm text-red-700 mt-0.5">One or more services are currently experiencing an outage.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-6 py-5 flex items-center gap-4">
      <span className="flex size-10 items-center justify-center rounded-full bg-yellow-400 text-white text-xl shrink-0">⚠</span>
      <div>
        <p className="text-lg font-semibold text-yellow-800">Degraded Performance</p>
        <p className="text-sm text-yellow-700 mt-0.5">Some services may be experiencing issues.</p>
      </div>
    </div>
  );
}

// ── 90-day history bar ───────────────────────────────────────────────────────

function UptimeBar({ history }: { history: StatusPageMonitor["history"] }) {
  if (!history.length) return null;
  return (
    <div className="flex gap-px h-8 items-end w-full overflow-hidden rounded">
      {history.map((day) => {
        const pct = day.total === 0 ? null : (day.up / day.total) * 100;
        const color =
          pct === null
            ? "bg-muted"
            : pct === 100
              ? "bg-green-400"
              : pct >= 80
                ? "bg-yellow-400"
                : "bg-red-400";
        const title =
          pct === null
            ? `${day.date}: no data`
            : `${day.date}: ${pct.toFixed(1)}% uptime`;
        return (
          <div
            key={day.date}
            title={title}
            className={`flex-1 min-w-0 rounded-sm ${color} transition-opacity hover:opacity-70`}
            style={{ height: pct === null ? "40%" : `${Math.max(20, pct)}%` }}
          />
        );
      })}
    </div>
  );
}

// ── Single monitor row ───────────────────────────────────────────────────────

function MonitorRow({ monitor }: { monitor: StatusPageMonitor }) {
  const statusColor =
    monitor.lastStatus === "up"
      ? "bg-green-500"
      : monitor.lastStatus === "down"
        ? "bg-red-500"
        : "bg-yellow-400";

  const statusLabel =
    monitor.lastStatus === "up"
      ? "Operational"
      : monitor.lastStatus === "down"
        ? "Down"
        : "Pending";

  const statusTextColor =
    monitor.lastStatus === "up"
      ? "text-green-600"
      : monitor.lastStatus === "down"
        ? "text-red-600"
        : "text-yellow-600";

  return (
    <div className="py-4 space-y-2">
      {/* Top row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`inline-block size-2.5 rounded-full shrink-0 ${statusColor}`} />
          <span className="font-medium text-sm truncate">{monitor.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
            {monitor.type.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-sm">
          {monitor.lastPing != null && (
            <span className="text-muted-foreground text-xs">{Math.round(monitor.lastPing)}ms</span>
          )}
          <span className={`font-semibold text-xs ${statusTextColor}`}>{statusLabel}</span>
        </div>
      </div>

      {/* History bar */}
      {monitor.history.length > 0 && (
        <div className="space-y-1">
          <UptimeBar history={monitor.history} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>90 days ago</span>
            <span className="font-medium">{monitor.uptimePct.toFixed(2)}% uptime</span>
            <span>Today</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Monitor group ────────────────────────────────────────────────────────────

function MonitorGroup({
  name,
  monitors,
}: {
  name: string | null;
  monitors: StatusPageMonitor[];
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {name && (
        <div className="px-5 py-3 border-b bg-muted/40">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{name}</p>
        </div>
      )}
      <div className="px-5 divide-y">
        {monitors.map((m) => (
          <MonitorRow key={m.id} monitor={m} />
        ))}
      </div>
    </div>
  );
}

// ── Incidents ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  INVESTIGATING: "bg-red-100 text-red-700 border-red-200",
  IDENTIFIED: "bg-orange-100 text-orange-700 border-orange-200",
  MONITORING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  RESOLVED: "bg-green-100 text-green-700 border-green-200",
};

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-500 text-white",
  MAJOR: "bg-orange-500 text-white",
  MINOR: "bg-yellow-400 text-white",
  MAINTENANCE: "bg-blue-500 text-white",
};

function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-4 bg-muted/40 border-b">
        <div className="space-y-1 min-w-0">
          <h3 className="font-semibold leading-snug">{incident.title}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(incident.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY_STYLES[incident.severity] ?? ""}`}>
            {incident.severity}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[incident.status] ?? ""}`}>
            {incident.status}
          </span>
        </div>
      </div>
      {incident.message && (
        <div className="px-5 py-3 border-b">
          <p className="text-sm text-muted-foreground">{incident.message}</p>
        </div>
      )}
      {incident.updates.length > 0 && (
        <div className="px-5 py-3 space-y-3">
          {incident.updates.map((u) => (
            <div key={u.id} className="flex gap-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${STATUS_STYLES[u.status] ?? ""}`}>
                    {u.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{u.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Maintenance window ───────────────────────────────────────────────────────

function MaintenanceCard({ window: mw }: { window: MaintenanceWindow }) {
  return (
    <div className="rounded-xl border bg-blue-50 border-blue-200 px-5 py-4 flex items-start gap-3">
      <span className="text-blue-500 text-lg shrink-0 mt-0.5">🔧</span>
      <div className="space-y-0.5">
        <h3 className="font-semibold text-blue-900">{mw.name}</h3>
        <p className="text-sm text-blue-700">
          {mw.startTime ? new Date(mw.startTime).toLocaleString() : "—"}
          {" – "}
          {mw.endTime ? new Date(mw.endTime).toLocaleString() : "—"}
        </p>
      </div>
    </div>
  );
}

// ── Summary stats bar ────────────────────────────────────────────────────────

function SummaryStats({ monitors }: { monitors: StatusPageMonitor[] }) {
  if (!monitors.length) return null;
  const up = monitors.filter((m) => m.lastStatus === "up").length;
  const down = monitors.filter((m) => m.lastStatus === "down").length;
  const avgUptime =
    monitors.reduce((sum, m) => sum + m.uptimePct, 0) / monitors.length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-xl border bg-card px-5 py-4 text-center">
        <p className="text-2xl font-bold text-green-600">{up}</p>
        <p className="text-xs text-muted-foreground mt-1">Operational</p>
      </div>
      <div className="rounded-xl border bg-card px-5 py-4 text-center">
        <p className="text-2xl font-bold text-red-600">{down}</p>
        <p className="text-xs text-muted-foreground mt-1">Down</p>
      </div>
      <div className="rounded-xl border bg-card px-5 py-4 text-center">
        <p className="text-2xl font-bold">{avgUptime.toFixed(2)}%</p>
        <p className="text-xs text-muted-foreground mt-1">Avg Uptime (30d)</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicStatusPagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getStatusPage(slug);

  if (!page || !page.published) notFound();

  const activeIncidents = page.incidents.filter((i) => i.status !== "RESOLVED");
  const resolvedIncidents = page.incidents.filter((i) => i.status === "RESOLVED");
  const upcomingMaintenance = page.maintenanceWindows.filter(
    (mw) => mw.endTime && new Date(mw.endTime) > new Date(),
  );

  // Group monitors by groupName
  const groups = new Map<string | null, StatusPageMonitor[]>();
  for (const m of page.monitors) {
    const key = m.groupName ?? null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const lastUpdated = new Date().toLocaleString();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {page.logoUrl && (
              <Image
                src={page.logoUrl}
                alt={page.title}
                width={160}
                height={40}
                className="h-10 w-auto"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{page.title}</h1>
              {page.description && (
                <p className="text-muted-foreground text-sm mt-1">{page.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Overall status */}
        <OverallStatus monitors={page.monitors} />

        {/* Stats */}
        <SummaryStats monitors={page.monitors} />

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Active Incidents</h2>
            {activeIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </section>
        )}

        {/* Scheduled Maintenance */}
        {upcomingMaintenance.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Scheduled Maintenance</h2>
            {upcomingMaintenance.map((mw) => (
              <MaintenanceCard key={mw.id} window={mw} />
            ))}
          </section>
        )}

        {/* Services */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Services</h2>
          {page.monitors.length === 0 ? (
            <div className="rounded-xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              No services configured yet.
            </div>
          ) : (
            Array.from(groups.entries()).map(([groupName, monitors]) => (
              <MonitorGroup
                key={groupName ?? "__default__"}
                name={groupName}
                monitors={monitors}
              />
            ))
          )}
        </section>

        {/* Resolved Incidents */}
        {resolvedIncidents.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Recent Resolved Incidents</h2>
            {resolvedIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </section>
        )}

        {/* Subscribe */}
        <SubscribeForm statusPageId={page.id} />

        {/* Footer */}
        <footer className="text-center space-y-1 pb-8">
          {page.footerText && (
            <p className="text-sm text-muted-foreground">{page.footerText}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdated} · Powered by <span className="font-semibold">Uptime Pro</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
