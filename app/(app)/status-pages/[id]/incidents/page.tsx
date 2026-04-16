"use client";
import Link from "next/link";
import { use, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useAddIncidentUpdate,
  useCreateIncident,
  useIncidents,
} from "@/hooks/use-incidents";
import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/status-page";

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

function AddUpdateDialog({
  incident,
  open,
  onClose,
}: {
  incident: Incident;
  open: boolean;
  onClose: () => void;
}) {
  const addUpdate = useAddIncidentUpdate(incident.id);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<IncidentStatus>(incident.status);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addUpdate.mutateAsync({ message, status });
    setMessage("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Update — {incident.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="update-message">Message</Label>
            <Textarea
              id="update-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="update-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as IncidentStatus)}
            >
              <SelectTrigger id="update-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                <SelectItem value="IDENTIFIED">Identified</SelectItem>
                <SelectItem value="MONITORING">Monitoring</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {addUpdate.error && (
            <p className="text-sm text-destructive">
              {addUpdate.error instanceof Error
                ? addUpdate.error.message
                : "Failed to add update"}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={addUpdate.isPending}>
              {addUpdate.isPending ? "Posting..." : "Post Update"}
            </Button>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const [expanded, setExpanded] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const addUpdate = useAddIncidentUpdate(incident.id);

  async function handleResolve() {
    await addUpdate.mutateAsync({
      message: "Issue resolved.",
      status: "RESOLVED",
    });
  }

  const severityVariant =
    incident.severity === "MINOR"
      ? ("secondary" as const)
      : incident.severity === "MAINTENANCE"
        ? ("outline" as const)
        : ("destructive" as const);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base">{incident.title}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={severityVariant}
              className={SEVERITY_CLASSES[incident.severity] || ""}
            >
              {incident.severity}
            </Badge>
            <Badge className={STATUS_CLASSES[incident.status]}>
              {incident.status}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(incident.createdAt).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {incident.message && (
          <p className="text-sm text-muted-foreground">{incident.message}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide" : "Show"} Timeline ({incident.updates.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUpdateDialogOpen(true)}
          >
            Add Update
          </Button>
          {incident.status !== "RESOLVED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolve}
              disabled={addUpdate.isPending}
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              Resolve
            </Button>
          )}
        </div>

        {expanded && incident.updates.length > 0 && (
          <div className="border-l-2 border-muted pl-4 space-y-3 mt-2">
            {incident.updates.map((update) => (
              <div key={update.id}>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${STATUS_CLASSES[update.status]}`}>
                    {update.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(update.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{update.message}</p>
              </div>
            ))}
          </div>
        )}

        <AddUpdateDialog
          incident={incident}
          open={updateDialogOpen}
          onClose={() => setUpdateDialogOpen(false)}
        />
      </CardContent>
    </Card>
  );
}

function CreateIncidentDialog({
  statusPageId,
  open,
  onClose,
}: {
  statusPageId: number;
  open: boolean;
  onClose: () => void;
}) {
  const createIncident = useCreateIncident();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("MAJOR");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createIncident.mutateAsync({
      title,
      statusPageId,
      severity,
      message: message || undefined,
    });
    setTitle("");
    setSeverity("MAJOR");
    setMessage("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="incident-title">Title</Label>
            <Input
              id="incident-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Service degradation..."
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="incident-severity">Severity</Label>
            <Select
              value={severity}
              onValueChange={(v) => setSeverity(v as IncidentSeverity)}
            >
              <SelectTrigger id="incident-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="MAJOR">Major</SelectItem>
                <SelectItem value="MINOR">Minor</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="incident-message">Initial Message</Label>
            <Textarea
              id="incident-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="We are investigating..."
            />
          </div>
          {createIncident.error && (
            <p className="text-sm text-destructive">
              {createIncident.error instanceof Error
                ? createIncident.error.message
                : "Failed to create incident"}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={createIncident.isPending}>
              {createIncident.isPending ? "Creating..." : "Create Incident"}
            </Button>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function IncidentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);

  const { data: incidents, isLoading, error } = useIncidents(numId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href={`/status-pages/${numId}`} />}>← Back</Button>
        <h1 className="text-2xl font-bold">Incidents</h1>
        <Button className="ml-auto" onClick={() => setCreateDialogOpen(true)}>
          Create Incident
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load incidents"}
        </p>
      )}

      {!isLoading && !error && incidents?.length === 0 && (
        <p className="text-muted-foreground text-sm">No incidents yet.</p>
      )}

      <div className="space-y-4">
        {incidents?.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>

      <CreateIncidentDialog
        statusPageId={numId}
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
}
