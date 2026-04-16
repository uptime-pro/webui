"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateTag,
} from "@/hooks/use-tags";
import type { Tag } from "@/types/tag";

function TagForm({ tag, onSuccess }: { tag?: Tag; onSuccess: () => void }) {
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? "#6366f1");

  const create = useCreateTag();
  const update = useUpdateTag(tag?.id ?? 0);
  const isPending = create.isPending || update.isPending;
  const mutationError = create.error ?? update.error;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (tag) {
        await update.mutateAsync({ name: name.trim(), color });
      } else {
        await create.mutateAsync({ name: name.trim(), color });
      }
      onSuccess();
    } catch {
      // surfaced via mutationError
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tag-name">Name</Label>
        <Input
          id="tag-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. production"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tag-color">Color</Label>
        <div className="flex items-center gap-3">
          <input
            id="tag-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-16 cursor-pointer rounded border border-input bg-transparent p-1"
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#6366f1"
            className="font-mono"
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span
            className="inline-block h-4 w-4 rounded-full border"
            style={{ backgroundColor: color }}
          />
          <Badge style={{ backgroundColor: color, color: "#fff" }}>
            Preview: {name || "tag"}
          </Badge>
        </div>
      </div>
      {mutationError && (
        <p className="text-sm text-destructive">{mutationError.message}</p>
      )}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : tag ? "Save Changes" : "Create Tag"}
      </Button>
    </form>
  );
}

function TagRow({ tag, onEdit }: { tag: Tag; onEdit: (t: Tag) => void }) {
  const deleteTag = useDeleteTag();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    await deleteTag.mutateAsync(tag.id);
    setConfirmDelete(false);
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="h-4 w-4 rounded-full shrink-0 border"
            style={{ backgroundColor: tag.color }}
          />
          <Badge
            className="text-sm font-medium"
            style={{ backgroundColor: tag.color, color: "#fff" }}
          >
            {tag.name}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            {tag.color}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onEdit(tag)}>
            Edit
          </Button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteTag.isPending}
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

export default function TagsPage() {
  const { data: tags, isLoading, error } = useTags();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(tag: Tag) {
    setEditing(tag);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setDialogOpen(false);
    setEditing(null);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize monitors with colored labels.
          </p>
        </div>
        <Button onClick={openCreate}>New Tag</Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load tags"}
        </p>
      )}

      {!isLoading && !error && tags?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No tags yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create tags to organize and filter your monitors.
            </p>
            <Button className="mt-4" onClick={openCreate}>
              New Tag
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && tags && tags.length > 0 && (
        <div className="space-y-3">
          {tags.map((tag) => (
            <TagRow key={tag.id} tag={tag} onEdit={openEdit} />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Tag" : "New Tag"}</DialogTitle>
          </DialogHeader>
          <TagForm tag={editing ?? undefined} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
