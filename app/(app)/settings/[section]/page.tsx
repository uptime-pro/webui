"use client";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";

export default function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = use(params);
  const { data: settings, isLoading, error } = useSettings();
  const update = useUpdateSettings();

  const [siteName, setSiteName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [dateFormat, setDateFormat] = useState("");
  const [checkInterval, setCheckInterval] = useState(60);
  const [resendInterval, setResendInterval] = useState(60);
  const [retryCount, setRetryCount] = useState(3);

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName);
      setTimezone(settings.timezone);
      setDateFormat(settings.dateFormat);
      setCheckInterval(settings.checkIntervalSeconds);
      setResendInterval(settings.defaultResendIntervalMinutes);
      setRetryCount(settings.retryCount);
    }
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (section === "general") {
      await update.mutateAsync({ siteName, timezone, dateFormat });
    } else if (section === "monitoring") {
      await update.mutateAsync({
        checkIntervalSeconds: checkInterval,
        defaultResendIntervalMinutes: resendInterval,
        retryCount,
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load settings"}
      </p>
    );
  }

  if (section !== "general" && section !== "monitoring") {
    return (
      <p className="text-sm text-muted-foreground">Section not found.</p>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">
          {section === "general" ? "General" : "Monitoring"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {section === "general"
            ? "Basic application settings."
            : "Default monitoring behaviour settings."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {section === "general" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Uptime Pro"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC"
              />
              <p className="text-xs text-muted-foreground">
                IANA timezone identifier, e.g. America/New_York
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Input
                id="dateFormat"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </>
        )}

        {section === "monitoring" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="checkInterval">
                Default Check Interval (seconds)
              </Label>
              <Input
                id="checkInterval"
                type="number"
                min={10}
                value={checkInterval}
                onChange={(e) => setCheckInterval(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resendInterval">
                Default Resend Interval (minutes)
              </Label>
              <Input
                id="resendInterval"
                type="number"
                min={1}
                value={resendInterval}
                onChange={(e) => setResendInterval(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="retryCount">Retry Count</Label>
              <Input
                id="retryCount"
                type="number"
                min={0}
                value={retryCount}
                onChange={(e) => setRetryCount(Number(e.target.value))}
              />
            </div>
          </>
        )}

        {update.error && (
          <p className="text-sm text-destructive">{update.error.message}</p>
        )}
        {update.isSuccess && (
          <p className="text-sm text-green-600">Settings saved.</p>
        )}

        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
