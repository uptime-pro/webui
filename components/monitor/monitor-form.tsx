"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateMonitor, useUpdateMonitor } from "@/hooks/use-monitors";
import {
  useAssignMonitorNotifications,
  useMonitorNotifications,
  useNotifications,
} from "@/hooks/use-notifications";
import type { Monitor, MonitorType } from "@/types/monitor";
import {
  getDefaultConfigForType,
  TypeConfigFields,
} from "./type-config-fields";

interface Props {
  monitor?: Monitor;
  onSuccess?: () => void;
}

interface FormState {
  name: string;
  type: MonitorType;
  interval: string;
  active: boolean;
  typeConfig: Record<string, unknown>;
}

function fromMonitor(monitor: Monitor): FormState {
  return {
    name: monitor.name,
    type: monitor.type,
    interval: String(monitor.interval),
    active: monitor.active,
    typeConfig: monitor.config ?? {},
  };
}

const defaultState: FormState = {
  name: "",
  type: "http",
  interval: "60",
  active: true,
  typeConfig: getDefaultConfigForType("http"),
};

export function MonitorForm({ monitor, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(
    monitor ? fromMonitor(monitor) : defaultState,
  );
  const [errors, setErrors] = useState<{ name?: string; interval?: string }>(
    {},
  );

  const { data: allNotifications } = useNotifications();
  const { data: assignedData } = useMonitorNotifications(monitor?.id ?? 0);
  const [selectedNotifIds, setSelectedNotifIds] = useState<number[]>([]);
  const [notifIdsInitialized, setNotifIdsInitialized] = useState(false);
  if (assignedData && !notifIdsInitialized) {
    setSelectedNotifIds(assignedData.notificationIds);
    setNotifIdsInitialized(true);
  }

  const create = useCreateMonitor();
  const update = useUpdateMonitor(monitor?.id ?? 0);
  const assignNotifs = useAssignMonitorNotifications(monitor?.id ?? 0);
  const isPending = create.isPending || update.isPending;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "name") setErrors((prev) => ({ ...prev, name: undefined }));
    if (key === "interval")
      setErrors((prev) => ({ ...prev, interval: undefined }));
  }

  function handleTypeChange(v: MonitorType) {
    setForm((prev) => ({
      ...prev,
      type: v,
      typeConfig: getDefaultConfigForType(v),
    }));
  }

  function validate(): boolean {
    const errs: { name?: string; interval?: string } = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.interval || Number(form.interval) < 10)
      errs.interval = "Interval must be at least 10 seconds";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<Monitor> = {
      name: form.name.trim(),
      type: form.type,
      interval: Number.parseInt(form.interval, 10),
      active: form.active,
      config: form.typeConfig,
    };

    try {
      if (monitor) {
        await update.mutateAsync(payload);
        try {
          await assignNotifs.mutateAsync(selectedNotifIds);
        } catch {
          // notification assignment failed — monitor was saved successfully
        }
      } else {
        const created = await create.mutateAsync(payload);
        if (created?.id && selectedNotifIds.length > 0) {
          try {
            const { apiRequest } = await import("@/lib/api");
            await apiRequest(`/api/v1/notifications/monitor/${created.id}`, {
              method: "PUT",
              body: JSON.stringify({ notificationIds: selectedNotifIds }),
            });
          } catch {
            // notification assignment failed — monitor was created successfully
          }
        }
      }
      onSuccess?.();
    } catch {
      // errors surfaced by mutation
    }
  }

  const mutationError = create.error ?? update.error;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="My Website"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Type selector — grouped */}
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select value={form.type} onValueChange={(v) => handleTypeChange(v as MonitorType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Web</SelectLabel>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="websocket">WebSocket</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Network</SelectLabel>
              <SelectItem value="tcp">TCP</SelectItem>
              <SelectItem value="ping">Ping</SelectItem>
              <SelectItem value="dns">DNS</SelectItem>
              <SelectItem value="push">Push</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Database</SelectLabel>
              <SelectItem value="postgres">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="mssql">MSSQL</SelectItem>
              <SelectItem value="mongodb">MongoDB</SelectItem>
              <SelectItem value="redis">Redis</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Messaging</SelectLabel>
              <SelectItem value="rabbitmq">RabbitMQ</SelectItem>
              <SelectItem value="mqtt">MQTT</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Infrastructure</SelectLabel>
              <SelectItem value="docker">Docker</SelectItem>
              <SelectItem value="snmp">SNMP</SelectItem>
              <SelectItem value="smtp">SMTP</SelectItem>
              <SelectItem value="sip">SIP</SelectItem>
              <SelectItem value="tailscale-ping">Tailscale Ping</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Services</SelectLabel>
              <SelectItem value="grpc">gRPC</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Game</SelectLabel>
              <SelectItem value="steam">Steam</SelectItem>
              <SelectItem value="gamedig">GameDig</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Other</SelectLabel>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="group">Group</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Type-specific config fields */}
      <TypeConfigFields
        key={form.type}
        type={form.type}
        config={form.typeConfig}
        onChange={(cfg) => set("typeConfig", cfg)}
      />

      {/* Interval */}
      <div className="space-y-1.5">
        <Label htmlFor="interval">Check interval (seconds)</Label>
        <Input
          id="interval"
          type="number"
          min={10}
          value={form.interval}
          onChange={(e) => set("interval", e.target.value)}
        />
        {errors.interval && (
          <p className="text-xs text-destructive">{errors.interval}</p>
        )}
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="active"
          checked={form.active}
          onCheckedChange={(v) => set("active", v)}
        />
        <Label htmlFor="active">Active</Label>
      </div>

      {mutationError && (
        <p className="text-sm text-destructive">{mutationError.message}</p>
      )}

      {/* Notification Channels */}
      <div className="space-y-2">
        <Label>Notification Channels</Label>
        {!allNotifications || allNotifications.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No notification channels configured.{" "}
            <a href="/notifications" className="underline">
              Add one in Notifications
            </a>
            .
          </p>
        ) : (
          <div className="space-y-2 rounded-md border p-3">
            {allNotifications.map((n) => {
              const checked = selectedNotifIds.includes(n.id);
              return (
                <label
                  key={n.id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSelectedNotifIds((prev) =>
                        e.target.checked
                          ? [...prev, n.id]
                          : prev.filter((id) => id !== n.id),
                      );
                    }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">{n.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    ({n.type})
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : monitor ? "Save changes" : "Create monitor"}
      </Button>
    </form>
  );
}
