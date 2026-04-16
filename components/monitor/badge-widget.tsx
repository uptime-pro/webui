"use client";

import { ClipboardCopy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface BadgeWidgetProps {
  monitorId: number;
  apiUrl: string;
}

interface CopyFieldProps {
  value: string;
  label: string;
}

function CopyField({ value, label }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable in non-HTTPS
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <ClipboardCopy className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

interface BadgePreviewProps {
  title: string;
  badgeUrl: string;
  markdownSnippet: string;
}

function BadgePreview({ title, badgeUrl, markdownSnippet }: BadgePreviewProps) {
  return (
    <div className="space-y-3 flex-1">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex items-center h-8">
        {/* biome-ignore lint/performance/noImgElement: SVG badge from external API, next/image not suitable */}
        <img src={badgeUrl} alt={title} />
      </div>
      <CopyField value={badgeUrl} label="Badge URL" />
      <CopyField value={markdownSnippet} label="Markdown" />
    </div>
  );
}

export function BadgeWidget({ monitorId, apiUrl }: BadgeWidgetProps) {
  const statusUrl = `${apiUrl}/api/v1/badge/${monitorId}/status`;
  const uptimeUrl = `${apiUrl}/api/v1/badge/${monitorId}/uptime`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Status Badges</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6">
          <BadgePreview
            title="Status"
            badgeUrl={statusUrl}
            markdownSnippet={`![Status](${statusUrl})`}
          />
          <BadgePreview
            title="Uptime"
            badgeUrl={uptimeUrl}
            markdownSnippet={`![Uptime](${uptimeUrl})`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
