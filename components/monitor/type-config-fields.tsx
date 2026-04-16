"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { MonitorType } from "@/types/monitor";

type FieldValues = Record<string, string | number | boolean>;

export function getDefaultConfigForType(
  type: MonitorType,
): Record<string, unknown> {
  switch (type) {
    case "http":
      return { method: "GET", expectedStatus: 200 };
    case "dns":
      return { type: "A" };
    case "postgres":
      return { port: 5432, ssl: false };
    case "mysql":
      return { port: 3306 };
    case "mssql":
      return { port: 1433 };
    case "redis":
      return { port: 6379 };
    case "rabbitmq":
      return { port: 5672, vhost: "/" };
    case "grpc":
      return { port: 50051 };
    case "steam":
      return { port: 27015 };
    case "snmp":
      return { port: 161, community: "public" };
    case "smtp":
      return { port: 587 };
    case "sip":
      return { port: 5060 };
    case "docker":
      return { socketPath: "/var/run/docker.sock" };
    case "ssl-cert":
      return { port: 443, warningDays: 30, criticalDays: 14 };
    case "domain-expiry":
      return { warningDays: 30, criticalDays: 14 };
    default:
      return {};
  }
}

interface TypeConfigFieldsProps {
  type: MonitorType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function TypeConfigFields({
  type,
  config,
  onChange,
}: TypeConfigFieldsProps) {
  const [values, setValues] = useState<FieldValues>(() => {
    const defaults = getDefaultConfigForType(type) as FieldValues;
    const v: FieldValues = { ...defaults };
    for (const [k, val] of Object.entries(config)) {
      if (
        val !== "***" &&
        val !== null &&
        val !== undefined &&
        typeof val !== "object"
      ) {
        v[k] = val as string | number | boolean;
      }
    }
    return v;
  });

  const [redacted, setRedacted] = useState<Set<string>>(() => {
    const rs = new Set<string>();
    for (const [k, val] of Object.entries(config)) {
      if (val === "***") rs.add(k);
    }
    return rs;
  });

  function emit(v: FieldValues, r: Set<string>) {
    const cfg: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      if (!r.has(k)) cfg[k] = val;
    }
    onChange(cfg);
  }

  function s(key: string, value: string | number | boolean) {
    const nv = { ...values, [key]: value };
    setValues(nv);
    emit(nv, redacted);
  }

  function clearRed(key: string) {
    const nr = new Set(redacted);
    nr.delete(key);
    setRedacted(nr);
    emit(values, nr);
  }

  function g(
    key: string,
    def: string | number | boolean = "",
  ): string | number | boolean {
    return values[key] ?? def;
  }

  /** Plain text input */
  function tf(key: string, label: string, placeholder?: string) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`cfg-${key}`}>{label}</Label>
        <Input
          id={`cfg-${key}`}
          value={String(g(key))}
          onChange={(e) => s(key, e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  }

  /** Numeric port / integer input */
  function pf(key: string, label: string, def: number) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`cfg-${key}`}>{label}</Label>
        <Input
          id={`cfg-${key}`}
          type="number"
          value={String(g(key, def))}
          onChange={(e) => s(key, Number.parseInt(e.target.value, 10) || def)}
          placeholder={String(def)}
        />
      </div>
    );
  }

  /** Sensitive / encrypted input */
  function sf(key: string, label: string, placeholder?: string) {
    const isRed = redacted.has(key);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label htmlFor={`cfg-${key}`}>{label}</Label>
          <span className="text-xs text-muted-foreground">
            Stored encrypted
          </span>
        </div>
        {isRed ? (
          <div className="flex gap-2">
            <div className="flex h-8 flex-1 select-none items-center rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground">
              ••••••••
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => clearRed(key)}
            >
              Change
            </Button>
          </div>
        ) : (
          <Input
            id={`cfg-${key}`}
            type="password"
            value={String(g(key))}
            onChange={(e) => s(key, e.target.value)}
            placeholder={placeholder}
            autoComplete="new-password"
          />
        )}
      </div>
    );
  }

  /** Boolean toggle (Switch) */
  function bf(key: string, label: string) {
    return (
      <div className="flex items-center gap-3">
        <Switch
          id={`cfg-${key}`}
          checked={Boolean(g(key, false))}
          onCheckedChange={(v) => s(key, v)}
        />
        <Label htmlFor={`cfg-${key}`}>{label}</Label>
      </div>
    );
  }

  switch (type) {
    case "http":
      return (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="cfg-url">URL</Label>
            <Input
              id="cfg-url"
              value={String(g("url"))}
              onChange={(e) => s("url", e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select
                value={String(g("method", "GET"))}
                onValueChange={(v) => s("method", v ?? "GET")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-expectedStatus">Expected status</Label>
              <Input
                id="cfg-expectedStatus"
                type="number"
                value={String(g("expectedStatus", 200))}
                onChange={(e) =>
                  s(
                    "expectedStatus",
                    Number.parseInt(e.target.value, 10) || 200,
                  )
                }
                placeholder="200"
              />
            </div>
          </div>
          {tf("keyword", "Keyword (optional)", "OK")}
          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expiry checks</p>
            {bf('checkSsl', 'Check SSL certificate expiry')}
            {g('checkSsl', false) && (
              <div className="grid grid-cols-2 gap-4 pl-4">
                {pf('sslWarningDays', 'SSL warning (days)', 30)}
                {pf('sslCriticalDays', 'SSL critical (days)', 14)}
              </div>
            )}
            {bf('checkDomain', 'Check domain registration expiry')}
            {g('checkDomain', false) && (
              <div className="grid grid-cols-2 gap-4 pl-4">
                {pf('domainWarningDays', 'Domain warning (days)', 30)}
                {pf('domainCriticalDays', 'Domain critical (days)', 14)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              SSL check only runs for https:// URLs. Domain check uses RDAP (not all TLDs supported).
            </p>
          </div>
        </>
      );

    case "tcp":
      return (
        <div className="grid grid-cols-2 gap-4">
          {tf("host", "Host", "example.com")}
          {pf("port", "Port", 443)}
        </div>
      );

    case "ping":
      return tf("host", "Host", "example.com");

    case "push":
      return (
        <div className="space-y-1.5">
          <Label>Push token</Label>
          {config.pushToken ? (
            <Textarea
              readOnly
              value={config.pushToken as string}
              className="font-mono text-xs"
              rows={2}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              A push token will be generated after the monitor is created.
            </p>
          )}
        </div>
      );

    case "dns":
      return (
        <>
          {tf("host", "Host", "example.com")}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Record type</Label>
              <Select
                value={String(g("type", "A"))}
                onValueChange={(v) => s("type", v ?? "A")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["A", "AAAA", "CNAME", "MX", "TXT"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {tf("expectedValue", "Expected value", "1.2.3.4")}
          </div>
        </>
      );

    case "websocket":
      return (
        <>
          {tf("url", "URL", "ws://example.com/ws")}
          {tf("expectedMessage", "Expected message (optional)", "pong")}
          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expiry checks</p>
            {bf('checkSsl', 'Check SSL certificate expiry (wss:// only)')}
            {g('checkSsl', false) && (
              <div className="grid grid-cols-2 gap-4 pl-4">
                {pf('sslWarningDays', 'SSL warning (days)', 30)}
                {pf('sslCriticalDays', 'SSL critical (days)', 14)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              SSL check only runs for wss:// WebSocket URLs.
            </p>
          </div>
        </>
      );

    case "postgres":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Host", "localhost")}
            {pf("port", "Port", 5432)}
          </div>
          {tf("database", "Database", "mydb")}
          {tf("username", "Username", "postgres")}
          {sf("password", "Password")}
          {bf("ssl", "Enable SSL")}
        </>
      );

    case "mysql":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Host", "localhost")}
            {pf("port", "Port", 3306)}
          </div>
          {tf("database", "Database", "mydb")}
          {tf("username", "Username", "root")}
          {sf("password", "Password")}
        </>
      );

    case "mssql":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Host", "localhost")}
            {pf("port", "Port", 1433)}
          </div>
          {tf("database", "Database", "mydb")}
          {tf("username", "Username", "sa")}
          {sf("password", "Password")}
        </>
      );

    case "mongodb":
      return (
        <>
          {sf("uri", "Connection URI", "mongodb://user:pass@host:27017/db")}
          {tf("database", "Database (optional)", "mydb")}
        </>
      );

    case "redis":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Host", "localhost")}
            {pf("port", "Port", 6379)}
          </div>
          {sf("password", "Password (optional)")}
          {tf("database", "Database index (optional)", "0")}
        </>
      );

    case "rabbitmq":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Host", "localhost")}
            {pf("port", "Port", 5672)}
          </div>
          {tf("username", "Username", "guest")}
          {sf("password", "Password")}
          {tf("vhost", "VHost", "/")}
        </>
      );

    case "mqtt":
      return (
        <>
          {tf("brokerUrl", "Broker URL", "mqtt://localhost:1883")}
          {tf("topic", "Topic", "sensors/temperature")}
          {tf("username", "Username (optional)")}
          {sf("password", "Password (optional)")}
        </>
      );

    case "docker":
      return (
        <>
          {tf("socketPath", "Socket path", "/var/run/docker.sock")}
          {tf("host", "Remote host (optional)", "tcp://localhost:2375")}
          {tf("containerId", "Container ID (optional)", "abc123")}
          {tf("containerName", "Container name (optional)", "my-container")}
        </>
      );

    case "grpc":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Host", "localhost")}
            {pf("port", "Port", 50051)}
          </div>
          {tf("service", "Service (optional)", "grpc.health.v1.Health")}
        </>
      );

    case "steam":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Server IP", "192.168.1.1")}
            {pf("port", "Port", 27015)}
          </div>
          {tf("appId", "App ID (optional)", "730")}
        </>
      );

    case "gamedig":
      return (
        <>
          {tf("type", "Game type", "minecraft")}
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Host", "play.example.com")}
            {tf("port", "Port", "25565")}
          </div>
        </>
      );

    case "tailscale-ping":
      return tf("hostname", "Tailscale hostname", "my-device");

    case "snmp":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Host", "192.168.1.1")}
            {pf("port", "Port", 161)}
          </div>
          {tf("community", "Community", "public")}
          {tf("oid", "OID", "1.3.6.1.2.1.1.1.0")}
        </>
      );

    case "smtp":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Host", "smtp.example.com")}
            {pf("port", "Port", 587)}
          </div>
          {tf("username", "Username (optional)", "user@example.com")}
          {sf("password", "Password (optional)")}
        </>
      );

    case "sip":
      return (
        <div className="grid grid-cols-2 gap-4">
          {tf("host", "Host", "sip.example.com")}
          {pf("port", "Port", 5060)}
        </div>
      );

    case "manual":
    case "group":
      return null;

    case "ssl-cert":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            {tf("host", "Hostname", "example.com")}
            {pf("port", "Port", 443)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {pf("warningDays", "Warning threshold (days)", 30)}
            {pf("criticalDays", "Critical threshold (days)", 14)}
          </div>
          <p className="text-xs text-muted-foreground">
            Alert when the certificate expires within the configured number of days.
            Critical threshold triggers a &quot;down&quot; alert.
          </p>
        </>
      );

    case "domain-expiry":
      return (
        <>
          {tf("domain", "Domain", "example.com")}
          <div className="grid grid-cols-2 gap-4">
            {pf("warningDays", "Warning threshold (days)", 30)}
            {pf("criticalDays", "Critical threshold (days)", 14)}
          </div>
          <p className="text-xs text-muted-foreground">
            Checks domain registration expiry via RDAP. Critical threshold triggers a &quot;down&quot; alert.
            Note: Not all TLDs support RDAP lookup.
          </p>
        </>
      );

    default:
      return null;
  }
}
