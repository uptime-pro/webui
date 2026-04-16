"use client";

import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useReportConfig,
  useUpdateReportConfig,
} from "@/hooks/use-report-config";
import type { ReportConfig } from "@/types/report";

export default function ReportsPage() {
  const { data, isLoading } = useReportConfig();
  const update = useUpdateReportConfig();

  const [form, setForm] = useState<ReportConfig>({
    enabled: false,
    recipientEmail: "",
    frequency: "weekly",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await update.mutateAsync(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Uptime Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure scheduled uptime report emails.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="report-enabled" className="text-sm font-medium">
                  Enable scheduled reports
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive periodic uptime summaries via email
                </p>
              </div>
              <Switch
                id="report-enabled"
                checked={form.enabled}
                onCheckedChange={(checked) =>
                  setForm({ ...form, enabled: checked })
                }
              />
            </div>

            {form.enabled && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="report-email">Recipient Email</Label>
                  <Input
                    id="report-email"
                    type="email"
                    required
                    placeholder="alerts@example.com"
                    value={form.recipientEmail}
                    onChange={(e) =>
                      setForm({ ...form, recipientEmail: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="report-frequency">Frequency</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        frequency: v as ReportConfig["frequency"],
                      })
                    }
                  >
                    <SelectTrigger id="report-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {update.error && (
              <p className="text-sm text-destructive">{update.error.message}</p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save"}
              </Button>
              {saved && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Saved!
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
