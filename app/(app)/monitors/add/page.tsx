"use client";
import { useRouter } from "next/navigation";
import { MonitorForm } from "@/components/monitor/monitor-form";

export default function AddMonitorPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Add Monitor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure a new monitor to track uptime and performance.
        </p>
      </div>
      <MonitorForm onSuccess={() => router.push("/dashboard")} />
    </div>
  );
}
