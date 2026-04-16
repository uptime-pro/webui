"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useIncidents } from "@/hooks/use-incidents";
import { useMonitors } from "@/hooks/use-monitors";
import {
  useSetStatusPageMonitors,
  useStatusPage,
  useStatusPageMonitors,
  useUpdateStatusPage,
} from "@/hooks/use-status-pages";
import type { IncidentSeverity, IncidentStatus } from "@/types/status-page";

const SEVERITY_CLASSES: Record<IncidentSeverity, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  MAJOR: "bg-orange-100 text-orange-800",
  MINOR: "",
  MAINTENANCE: "",
};

const STATUS_CLASSES: Record<IncidentStatus, string> = {
  INVESTIGATING: "bg-red-100 text-red-800",
  IDENTIFIED: "bg-orange-100 text-orange-800",
  MONITORING: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
};

export default function StatusPageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);

  const { data: page, isLoading, error } = useStatusPage(numId);
  const { data: allMonitors } = useMonitors();
  const { data: assignedMonitors } = useStatusPageMonitors(numId);
  const { data: incidents } = useIncidents(numId);
  const updatePage = useUpdateStatusPage(numId);
  const setMonitors = useSetStatusPageMonitors(numId);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<number[]>([]);

  useEffect(() => {
    if (page) {
      setName(page.name);
      setSlug(page.slug);
      setDescription(page.description ?? "");
      setCustomDomain(page.customDomain ?? "");
      setLogoUrl(page.logoUrl ?? "");
      setPublished(page.published);
    }
  }, [page]);

  useEffect(() => {
    if (assignedMonitors) {
      setSelectedMonitorIds(assignedMonitors.map((m) => m.id));
    }
  }, [assignedMonitors]);

  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    await updatePage.mutateAsync({
      name,
      slug,
      description: description || undefined,
      customDomain: customDomain || undefined,
      logoUrl: logoUrl || undefined,
      published,
    });
  }

  async function handleSaveMonitors(e: React.FormEvent) {
    e.preventDefault();
    await setMonitors.mutateAsync(selectedMonitorIds);
  }

  function toggleMonitor(monitorId: number) {
    setSelectedMonitorIds((prev) =>
      prev.includes(monitorId)
        ? prev.filter((i) => i !== monitorId)
        : [...prev, monitorId],
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Status page not found"}
        </p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/status-pages">← Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/status-pages">← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold truncate">{page.name}</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="monitors">Monitors</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 max-w-xl">
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Public URL: /status/{slug}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="customDomain">Custom Domain</Label>
              <Input
                id="customDomain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="status.example.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="published"
                checked={published}
                onCheckedChange={setPublished}
              />
              <Label htmlFor="published">Published</Label>
            </div>
            {updatePage.error && (
              <p className="text-sm text-destructive">
                {updatePage.error instanceof Error
                  ? updatePage.error.message
                  : "Failed to save"}
              </p>
            )}
            {updatePage.isSuccess && (
              <p className="text-sm text-green-600">Saved successfully.</p>
            )}
            <Button type="submit" disabled={updatePage.isPending}>
              {updatePage.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="monitors" className="mt-4">
          <form onSubmit={handleSaveMonitors} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select which monitors appear on this status page.
            </p>
            {!allMonitors?.length && (
              <p className="text-sm text-muted-foreground">
                No monitors found.
              </p>
            )}
            <div className="space-y-2">
              {allMonitors?.map((monitor) => (
                <label
                  key={monitor.id}
                  className="flex items-center gap-3 cursor-pointer rounded-md border px-3 py-2 hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={selectedMonitorIds.includes(monitor.id)}
                    onChange={() => toggleMonitor(monitor.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium flex-1">
                    {monitor.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {monitor.type}
                  </Badge>
                </label>
              ))}
            </div>
            {setMonitors.error && (
              <p className="text-sm text-destructive">
                {setMonitors.error instanceof Error
                  ? setMonitors.error.message
                  : "Failed to save monitors"}
              </p>
            )}
            {setMonitors.isSuccess && (
              <p className="text-sm text-green-600">Monitors saved.</p>
            )}
            <Button type="submit" disabled={setMonitors.isPending}>
              {setMonitors.isPending ? "Saving..." : "Save Monitors"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Active and recent incidents for this status page.
            </p>
            <Button asChild>
              <Link href={`/status-pages/${numId}/incidents`}>
                Manage Incidents
              </Link>
            </Button>
          </div>
          {!incidents?.length && (
            <p className="text-sm text-muted-foreground">No incidents.</p>
          )}
          <div className="space-y-2">
            {incidents?.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
              >
                <span className="text-sm font-medium truncate flex-1">
                  {incident.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      incident.severity === "MINOR"
                        ? "secondary"
                        : incident.severity === "MAINTENANCE"
                          ? "outline"
                          : "destructive"
                    }
                    className={SEVERITY_CLASSES[incident.severity] || ""}
                  >
                    {incident.severity}
                  </Badge>
                  <Badge className={STATUS_CLASSES[incident.status]}>
                    {incident.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
