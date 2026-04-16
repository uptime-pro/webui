"use client";
import { useRouter } from "next/navigation";
import { MonitorForm } from "@/components/monitor/monitor-form";

export default function AddMonitorPage() {
  const router = useRouter();
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add Monitor</h1>
      <MonitorForm onSuccess={() => router.push("/dashboard")} />
    </div>
  );
}
