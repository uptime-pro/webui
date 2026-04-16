"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMaintenanceWindow } from "@/hooks/use-maintenance";

export default function EditMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = parseInt(idStr, 10);
  const { data: maintenance, isLoading } = useMaintenanceWindow(id);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!maintenance) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Maintenance window not found.</p>
        <Button variant="outline" size="sm" className="mt-4" render={<Link href="/maintenance" />}>← Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/maintenance" />}>← Back</Button>
        <h1 className="text-2xl font-bold">Edit Maintenance Window</h1>
      </div>
      <MaintenanceForm
        maintenance={maintenance}
        onSuccess={() => router.push("/maintenance")}
      />
    </div>
  );
}
