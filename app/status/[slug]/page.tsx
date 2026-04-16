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
  const res = await fetch(`${API_BASE}/api/v1/status-pages/public/${slug}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch status page");
  return res.json() as Promise<PublicStatusPage>;
}

function OverallStatus({ monitors }: { monitors: StatusPageMonitor[] }) {
  const allUp = monitors.every((m) => m.lastStatus === "up");
  const anyDown = monitors.some((m) => m.lastStatus === "down");

  if (monitors.length === 0) {
    return (
      <div className="rounded-lg bg-muted px-4 py-3 text-sm font-medium">
        No monitors configured
      </div>
    );
  }

  if (allUp) {
    return (
      <div className="rounded-lg bg-green-100 text-green-800 px-4 py-3 text-sm font-semibold">
        ✓ All systems operational
      </div>
    );
  }

  if (anyDown) {
    return (
      <div className="rounded-lg bg-red-100 text-red-800 px-4 py-3 text-sm font-semibold">
        ✕ Major outage detected
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-yellow-100 text-yellow-800 px-4 py-3 text-sm font-semibold">
      ⚠ Degraded performance
    </div>
  );
}

function MonitorRow({ monitor }: { monitor: StatusPageMonitor }) {
  const dotColor =
    monitor.lastStatus === "up"
      ? "bg-green-500"
      : monitor.lastStatus === "down"
        ? "bg-red-500"
        : "bg-yellow-400";

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <span className="text-sm font-medium">{monitor.name}</span>
        <span className="text-xs text-muted-foreground">{monitor.type}</span>
      </div>
      <span className="text-xs text-muted-foreground capitalize">
        {monitor.lastStatus === "pending"
          ? "Pending"
          : monitor.lastStatus === "up"
            ? "Operational"
            : "Down"}
        {monitor.lastPing != null && ` · ${monitor.lastPing}ms`}
      </span>
    </div>
  );
}

function ActiveIncident({ incident }: { incident: Incident }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold text-red-800">{incident.title}</h3>
        <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
          {incident.status}
        </span>
      </div>
      {incident.message && (
        <p className="text-sm text-red-700">{incident.message}</p>
      )}
      {incident.updates.length > 0 && (
        <div className="border-l-2 border-red-200 pl-3 space-y-2 mt-2">
          {incident.updates.slice(0, 3).map((u) => (
            <div key={u.id}>
              <p className="text-xs text-red-600 font-medium">
                {u.status} · {new Date(u.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-red-700">{u.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MaintenanceItem({ window: mw }: { window: MaintenanceWindow }) {
  return (
    <div className="rounded-lg border bg-blue-50 p-4">
      <h3 className="font-semibold text-blue-800">{mw.name}</h3>
      <p className="text-sm text-blue-600 mt-1">
        {new Date(mw.startTime).toLocaleString()} –{" "}
        {new Date(mw.endTime).toLocaleString()}
      </p>
    </div>
  );
}

export default async function PublicStatusPagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getStatusPage(slug);

  if (!page || !page.published) {
    notFound();
  }

  const activeIncidents = page.incidents.filter((i) => i.status !== "RESOLVED");

  const upcomingMaintenance = page.maintenanceWindows.filter(
    (mw) => new Date(mw.endTime) > new Date(),
  );

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-1">
        {page.logoUrl && (
          <Image
            src={page.logoUrl}
            alt={page.title}
            width={160}
            height={40}
            className="h-10 w-auto mb-4"
          />
        )}
        <h1 className="text-3xl font-bold">{page.title}</h1>
        {page.description && (
          <p className="text-muted-foreground">{page.description}</p>
        )}
      </div>

      <OverallStatus monitors={page.monitors} />

      {activeIncidents.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Active Incidents</h2>
          {activeIncidents.map((incident) => (
            <ActiveIncident key={incident.id} incident={incident} />
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Services</h2>
        <div className="rounded-lg border divide-y">
          {page.monitors.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No services configured.
            </p>
          )}
          {page.monitors.map((monitor) => (
            <MonitorRow key={monitor.id} monitor={monitor} />
          ))}
        </div>
      </section>

      {upcomingMaintenance.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Scheduled Maintenance</h2>
          {upcomingMaintenance.map((mw) => (
            <MaintenanceItem key={mw.id} window={mw} />
          ))}
        </section>
      )}

      <SubscribeForm statusPageId={page.id} />

      <footer className="text-center text-xs text-muted-foreground pt-4">
        Powered by Uptime Pro
      </footer>
    </main>
  );
}
