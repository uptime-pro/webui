"use client";
import { ArrowLeft, ClipboardCopy, Download, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useExportMonitors, useImportMonitors } from "@/hooks/use-monitors";
import type { MonitorExportData, MonitorImportItem } from "@/types/monitor";

export default function ImportExportPage() {
  const { refetch: fetchExport, isFetching: isExporting } = useExportMonitors();
  const importMutation = useImportMonitors();

  const [exportJson, setExportJson] = useState<string>("");
  const [importJson, setImportJson] = useState<string>("");
  const [importError, setImportError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const result = await fetchExport();
    if (result.data) {
      setExportJson(JSON.stringify(result.data, null, 2));
    }
  }

  function handleDownload() {
    if (!exportJson) return;
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitors-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(exportJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportJson((ev.target?.result as string) ?? "");
      setImportError("");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImportError("");
    let parsed: unknown;
    try {
      parsed = JSON.parse(importJson);
    } catch {
      setImportError("Invalid JSON — please check your input.");
      return;
    }

    let monitors: MonitorImportItem[] = [];
    if (Array.isArray(parsed)) {
      monitors = parsed as MonitorImportItem[];
    } else if (
      parsed !== null &&
      typeof parsed === "object" &&
      "monitors" in (parsed as MonitorExportData) &&
      Array.isArray((parsed as MonitorExportData).monitors)
    ) {
      monitors = (parsed as MonitorExportData).monitors;
    } else {
      setImportError(
        "Expected an array of monitors or an object with a `monitors` array.",
      );
      return;
    }

    await importMutation.mutateAsync(monitors);
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import / Export</h1>
          <p className="text-muted-foreground text-sm">
            Export monitors to JSON or import from a previous export.
          </p>
        </div>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Monitors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleExport} disabled={isExporting} size="sm">
            {isExporting ? "Exporting…" : "Export Monitors"}
          </Button>
          {exportJson && (
            <>
              <Textarea
                readOnly
                value={exportJson}
                className="font-mono text-xs h-48"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download JSON
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  <ClipboardCopy className="h-3.5 w-3.5 mr-1" />
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Monitors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
            <span className="text-xs text-muted-foreground">
              or paste JSON below
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          <Textarea
            value={importJson}
            onChange={(e) => {
              setImportJson(e.target.value);
              setImportError("");
            }}
            placeholder='Paste exported JSON here (array or { "monitors": [...] })'
            className="font-mono text-xs h-48"
          />
          {importError && (
            <p className="text-sm text-destructive">{importError}</p>
          )}
          {importMutation.error && (
            <p className="text-sm text-destructive">
              {importMutation.error.message}
            </p>
          )}
          {importMutation.isSuccess && importMutation.data && (
            <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
              <p>
                ✓ Imported {importMutation.data.imported} monitor
                {importMutation.data.imported !== 1 ? "s" : ""}
                {importMutation.data.skipped > 0
                  ? `, skipped ${importMutation.data.skipped}`
                  : ""}
                .
              </p>
              {importMutation.data.errors.map((err, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: error list
                <p key={i} className="text-destructive">
                  {err}
                </p>
              ))}
            </div>
          )}
          <Button
            onClick={handleImport}
            disabled={!importJson.trim() || importMutation.isPending}
            size="sm"
          >
            {importMutation.isPending ? "Importing…" : "Import"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
