"use client";
import { ClipboardCopy, Key, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from "@/hooks/use-api-keys";
import type { ApiKey, CreateApiKeyDto } from "@/types/api-key";

function permissionBadge(permission: ApiKey["permission"]) {
  const cls =
    permission === "read-write"
      ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
      : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400";
  return (
    <Badge variant="outline" className={`text-xs ${cls}`}>
      {permission}
    </Badge>
  );
}

function CreateKeyDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (key: string) => void;
}) {
  const createKey = useCreateApiKey();
  const [form, setForm] = useState<CreateApiKeyDto>({
    name: "",
    permission: "read",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await createKey.mutateAsync(form);
    onCreated(result.key);
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create API Key</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ak-name">Name</Label>
          <Input
            id="ak-name"
            required
            placeholder="e.g. CI/CD pipeline"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ak-perm">Permission</Label>
          <Select
            value={form.permission}
            onValueChange={(v) =>
              setForm({
                ...form,
                permission: v as CreateApiKeyDto["permission"],
              })
            }
          >
            <SelectTrigger id="ak-perm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">read</SelectItem>
              <SelectItem value="read-write">read-write</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ak-expires">Expiry (optional)</Label>
          <Input
            id="ak-expires"
            type="date"
            value={form.expiresAt ?? ""}
            onChange={(e) =>
              setForm({ ...form, expiresAt: e.target.value || undefined })
            }
          />
        </div>
        {createKey.error && (
          <p className="text-sm text-destructive">{createKey.error.message}</p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createKey.isPending}>
            {createKey.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function NewKeyDialog({
  apiKey,
  onClose,
}: {
  apiKey: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Your new API key</DialogTitle>
        <DialogDescription className="text-destructive font-medium">
          Save this key now — it will never be shown again.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input readOnly value={apiKey} className="font-mono text-xs" />
          <Button size="sm" variant="outline" onClick={handleCopy}>
            <ClipboardCopy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function ApiKeysPage() {
  const { data: apiKeys, isLoading } = useApiKeys();
  const deleteKey = useDeleteApiKey();

  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6" />
            API Keys
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage programmatic access to your account.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create API Key
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !apiKeys?.length ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Key className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No API keys yet.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell>{permissionBadge(k.permission)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(k.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {k.expires
                    ? new Date(k.expires).toLocaleDateString()
                    : "Never"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      k.active
                        ? "text-xs bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                        : "text-xs"
                    }
                  >
                    {k.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(k)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        {showCreate && (
          <CreateKeyDialog
            onClose={() => setShowCreate(false)}
            onCreated={(key) => {
              setShowCreate(false);
              setNewKey(key);
            }}
          />
        )}
      </Dialog>

      {/* New key reveal dialog */}
      <Dialog open={!!newKey} onOpenChange={(o) => !o && setNewKey(null)}>
        {newKey && (
          <NewKeyDialog apiKey={newKey} onClose={() => setNewKey(null)} />
        )}
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke &quot;{deleteTarget?.name}&quot;?</DialogTitle>
            <DialogDescription>
              This key will be permanently deleted and can no longer be used.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteKey.isPending}
              onClick={async () => {
                if (deleteTarget) {
                  await deleteKey.mutateAsync(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              {deleteKey.isPending ? "Revoking…" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
