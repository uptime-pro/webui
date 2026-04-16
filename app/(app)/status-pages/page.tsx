"use client";
import Link from "next/link";
import { Globe, Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteStatusPage, useStatusPages } from "@/hooks/use-status-pages";
import type { StatusPage } from "@/types/status-page";

function StatusPageRow({ page }: { page: StatusPage }) {
  const deletePage = useDeleteStatusPage();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    await deletePage.mutateAsync(page.id);
    setConfirmDelete(false);
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{page.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <a
              href={`/status/${page.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:underline truncate"
            >
              /status/{page.slug}
            </a>
            <Badge variant={page.published ? "default" : "secondary"} className="text-xs">
              {page.published ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Created {new Date(page.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" render={<Link href={`/status-pages/${page.id}`} />}>Edit</Button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deletePage.isPending}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatusPagesPage() {
  const { data: pages, isLoading, error } = useStatusPages();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Status Pages"
        description="Public pages showing the status of your monitored services."
        action={
          <Button size="sm" render={<Link href="/status-pages/new" />}>
              <Plus className="h-4 w-4 mr-2" />
              New Status Page
            </Button>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load status pages"}
        </p>
      )}

      {!isLoading && !error && pages?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Globe className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium">No status pages yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first status page to get started.
          </p>
          <Button size="sm" className="mt-4" render={<Link href="/status-pages/new" />}>New Status Page</Button>
        </div>
      )}

      {!isLoading && !error && pages && pages.length > 0 && (
        <div className="space-y-3">
          {pages.map((page) => (
            <StatusPageRow key={page.id} page={page} />
          ))}
        </div>
      )}
    </div>
  );
}
