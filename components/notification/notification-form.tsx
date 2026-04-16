"use client";
import { useState } from "react";
import { ProviderFields } from "@/components/notification/provider-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useCreateNotification,
  useUpdateNotification,
} from "@/hooks/use-notifications";
import type {
  CreateNotificationDto,
  Notification,
  NotificationType,
  UpdateNotificationDto,
} from "@/types/notification";

const PROVIDER_LABELS: Record<NotificationType, string> = {
  discord: "Discord",
  slack: "Slack",
  email: "Email",
  webhook: "Webhook",
  teams: "Microsoft Teams",
  telegram: "Telegram",
  pushover: "Pushover",
  gotify: "Gotify",
  ntfy: "ntfy",
};

interface Props {
  notification?: Notification;
  onSuccess?: () => void;
}

export function NotificationForm({ notification, onSuccess }: Props) {
  const [name, setName] = useState(notification?.name ?? "");
  const [type, setType] = useState<NotificationType>(
    notification?.type ?? "discord",
  );
  const [config, setConfig] = useState<Record<string, unknown>>(
    notification?.config ?? {},
  );
  const [isDefault, setIsDefault] = useState(notification?.isDefault ?? false);
  const [nameError, setNameError] = useState("");

  const create = useCreateNotification();
  const update = useUpdateNotification(notification?.id ?? 0);
  const isPending = create.isPending || update.isPending;

  function handleConfigChange(key: string, value: unknown) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function handleTypeChange(newType: NotificationType) {
    setType(newType);
    // Reset config when changing type (unless editing same type)
    if (notification?.type !== newType) {
      setConfig({});
    } else {
      setConfig(notification?.config ?? {});
    }
  }

  function buildUpdateConfig(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config)) {
      // Skip masked secrets that weren't changed
      if (value === "***") continue;
      result[key] = value;
    }
    return result;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError("");

    try {
      if (notification) {
        const updateConfig = buildUpdateConfig();
        const payload: UpdateNotificationDto = {
          name: name.trim(),
          type,
          config: updateConfig,
          isDefault,
        };
        await update.mutateAsync(payload);
      } else {
        const payload: CreateNotificationDto = {
          name: name.trim(),
          type,
          config,
          isDefault,
        };
        await create.mutateAsync(payload);
      }
      onSuccess?.();
    } catch {
      // errors surfaced by mutation
    }
  }

  const mutationError = create.error ?? update.error;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="notif-name">Name</Label>
        <Input
          id="notif-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError("");
          }}
          placeholder="My Discord Alert"
        />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          value={type}
          onValueChange={(v) => handleTypeChange(v as NotificationType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.entries(PROVIDER_LABELS) as [NotificationType, string][]
            ).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProviderFields
        type={type}
        config={config}
        onChange={handleConfigChange}
        isEdit={!!notification}
      />

      <div className="flex items-center gap-3">
        <Switch
          id="notif-isDefault"
          checked={isDefault}
          onCheckedChange={setIsDefault}
        />
        <Label htmlFor="notif-isDefault">Set as default</Label>
      </div>

      {mutationError && (
        <p className="text-sm text-destructive">{mutationError.message}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending
          ? "Saving…"
          : notification
            ? "Save changes"
            : "Create notification"}
      </Button>
    </form>
  );
}
