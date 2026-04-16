"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { NotificationType } from "@/types/notification";

interface ProviderFieldsProps {
  type: NotificationType;
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  isEdit?: boolean;
}

function SecretField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: unknown;
  onChange: (v: string | undefined) => void;
}) {
  const isMasked = value === "***";
  const [revealed, setReveal] = useState(false);

  if (isMasked && !revealed) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex gap-2">
          <Input
            id={id}
            value="••••••••"
            readOnly
            className="flex-1 text-muted-foreground"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setReveal(true);
              onChange("");
            }}
          >
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        autoComplete="new-password"
      />
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: unknown;
  onChange: (v: unknown) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : ""
        }
        onChange={(e) =>
          onChange(type === "number" ? e.target.value : e.target.value)
        }
        placeholder={placeholder}
      />
    </div>
  );
}

export function ProviderFields({
  type,
  config,
  onChange,
}: ProviderFieldsProps) {
  switch (type) {
    case "discord":
      return (
        <SecretField
          id="discord-webhookUrl"
          label="Webhook URL"
          value={config.webhookUrl}
          onChange={(v) => onChange("webhookUrl", v)}
        />
      );

    case "slack":
      return (
        <div className="space-y-1.5">
          <Label htmlFor="slack-webhookUrl">Webhook URL</Label>
          <Input
            id="slack-webhookUrl"
            value={
              typeof config.webhookUrl === "string" ? config.webhookUrl : ""
            }
            onChange={(e) => onChange("webhookUrl", e.target.value)}
            placeholder="https://hooks.slack.com/..."
          />
        </div>
      );

    case "email":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="email-host"
              label="SMTP Host"
              value={config.host}
              onChange={(v) => onChange("host", v)}
              placeholder="smtp.example.com"
            />
            <TextField
              id="email-port"
              label="Port"
              value={config.port}
              onChange={(v) => onChange("port", v)}
              placeholder="587"
              type="number"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="email-secure"
              checked={config.secure === true}
              onCheckedChange={(v) => onChange("secure", v)}
            />
            <Label htmlFor="email-secure">Use TLS/SSL</Label>
          </div>
          <TextField
            id="email-username"
            label="Username"
            value={config.username}
            onChange={(v) => onChange("username", v)}
            placeholder="user@example.com"
          />
          <SecretField
            id="email-password"
            label="Password"
            value={config.password}
            onChange={(v) => onChange("password", v)}
          />
          <TextField
            id="email-from"
            label="From"
            value={config.from}
            onChange={(v) => onChange("from", v)}
            placeholder="alerts@example.com"
          />
          <TextField
            id="email-to"
            label="To"
            value={config.to}
            onChange={(v) => onChange("to", v)}
            placeholder="admin@example.com"
          />
        </div>
      );

    case "webhook":
      return (
        <div className="space-y-4">
          <TextField
            id="webhook-url"
            label="URL"
            value={config.url}
            onChange={(v) => onChange("url", v)}
            placeholder="https://example.com/hook"
          />
          <div className="space-y-1.5">
            <Label htmlFor="webhook-headers">Headers (JSON, optional)</Label>
            <Textarea
              id="webhook-headers"
              value={
                typeof config.headers === "string"
                  ? config.headers
                  : config.headers
                    ? JSON.stringify(config.headers, null, 2)
                    : ""
              }
              onChange={(e) => onChange("headers", e.target.value || undefined)}
              placeholder='{"Authorization": "Bearer ..."}'
              rows={3}
              className="font-mono text-xs"
            />
          </div>
        </div>
      );

    case "teams":
      return (
        <div className="space-y-1.5">
          <Label htmlFor="teams-webhookUrl">Webhook URL</Label>
          <Input
            id="teams-webhookUrl"
            value={
              typeof config.webhookUrl === "string" ? config.webhookUrl : ""
            }
            onChange={(e) => onChange("webhookUrl", e.target.value)}
            placeholder="https://outlook.office.com/webhook/..."
          />
        </div>
      );

    case "telegram":
      return (
        <div className="space-y-4">
          <SecretField
            id="telegram-botToken"
            label="Bot Token"
            value={config.botToken}
            onChange={(v) => onChange("botToken", v)}
          />
          <TextField
            id="telegram-chatId"
            label="Chat ID"
            value={config.chatId}
            onChange={(v) => onChange("chatId", v)}
            placeholder="-100123456789"
          />
        </div>
      );

    case "pushover":
      return (
        <div className="space-y-4">
          <SecretField
            id="pushover-token"
            label="API Token"
            value={config.token}
            onChange={(v) => onChange("token", v)}
          />
          <SecretField
            id="pushover-userKey"
            label="User Key"
            value={config.userKey}
            onChange={(v) => onChange("userKey", v)}
          />
        </div>
      );

    case "gotify":
      return (
        <div className="space-y-4">
          <TextField
            id="gotify-serverUrl"
            label="Server URL"
            value={config.serverUrl}
            onChange={(v) => onChange("serverUrl", v)}
            placeholder="https://gotify.example.com"
          />
          <SecretField
            id="gotify-token"
            label="App Token"
            value={config.token}
            onChange={(v) => onChange("token", v)}
          />
        </div>
      );

    case "ntfy":
      return (
        <div className="space-y-4">
          <TextField
            id="ntfy-serverUrl"
            label="Server URL"
            value={config.serverUrl}
            onChange={(v) => onChange("serverUrl", v)}
            placeholder="https://ntfy.sh"
          />
          <TextField
            id="ntfy-topic"
            label="Topic"
            value={config.topic}
            onChange={(v) => onChange("topic", v)}
            placeholder="my-alerts"
          />
          <SecretField
            id="ntfy-authToken"
            label="Auth Token (optional)"
            value={config.authToken}
            onChange={(v) => onChange("authToken", v)}
          />
        </div>
      );

    default:
      return null;
  }
}
