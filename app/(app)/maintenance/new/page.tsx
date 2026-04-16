"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { Button } from "@/components/ui/button";

export default function NewMaintenancePage() {
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/maintenance">← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold">New Maintenance Window</h1>
      </div>
      <MaintenanceForm onSuccess={() => router.push("/maintenance")} />
    </div>
  );
}
