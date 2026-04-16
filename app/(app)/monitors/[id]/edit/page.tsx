"use client";
import { useRouter } from "next/navigation";
import { use } from "react";
import { MonitorForm } from "@/components/monitor/monitor-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonitor } from "@/hooks/use-monitors";

export default function EditMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = parseInt(idStr, 10);
  const { data: monitor, isLoading } = useMonitor(id);
  const router = useRouter();

  if (isLoading)
    return <Skeleton className="h-48 w-full max-w-xl mx-auto mt-8" />;
  if (!monitor)
    return <p className="text-muted-foreground p-6">Monitor not found.</p>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Monitor</h1>
      <MonitorForm
        monitor={monitor}
        onSuccess={() => router.push(`/dashboard/${id}`)}
      />
    </div>
  );
}
