"use client";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/hooks/use-users";
import type { AppUser, CreateUserDto, UpdateUserDto } from "@/types/user";

type Role = "ADMIN" | "EDITOR" | "VIEWER";

function roleBadge(role: Role) {
  const cls =
    role === "ADMIN"
      ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400"
      : role === "EDITOR"
        ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400";
  return (
    <Badge variant="outline" className={`text-xs ${cls}`}>
      {role}
    </Badge>
  );
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser();
  const [form, setForm] = useState<CreateUserDto>({
    username: "",
    email: "",
    password: "",
    role: "VIEWER",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createUser.mutateAsync(form);
    onClose();
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create User</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cu-username">Username</Label>
          <Input
            id="cu-username"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cu-email">Email</Label>
          <Input
            id="cu-email"
            type="email"
            value={form.email ?? ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cu-password">Password</Label>
          <Input
            id="cu-password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cu-role">Role</Label>
          <Select
            value={form.role}
            onValueChange={(v) => setForm({ ...form, role: v as Role })}
          >
            <SelectTrigger id="cu-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEWER">VIEWER</SelectItem>
              <SelectItem value="EDITOR">EDITOR</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {createUser.error && (
          <p className="text-sm text-destructive">{createUser.error.message}</p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditUserDialog({
  user,
  onClose,
}: {
  user: AppUser;
  onClose: () => void;
}) {
  const updateUser = useUpdateUser(user.id);
  const [form, setForm] = useState<UpdateUserDto>({
    username: user.username,
    email: user.email,
    role: user.role,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateUser.mutateAsync(form);
    onClose();
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="eu-username">Username</Label>
          <Input
            id="eu-username"
            required
            value={form.username ?? ""}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eu-email">Email</Label>
          <Input
            id="eu-email"
            type="email"
            value={form.email ?? ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eu-role">Role</Label>
          <Select
            value={form.role}
            onValueChange={(v) => setForm({ ...form, role: v as Role })}
          >
            <SelectTrigger id="eu-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEWER">VIEWER</SelectItem>
              <SelectItem value="EDITOR">EDITOR</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {updateUser.error && (
          <p className="text-sm text-destructive">{updateUser.error.message}</p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateUser.isPending}>
            {updateUser.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();

  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground text-sm">
          Only administrators can access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage system users and their roles.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create User
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !users?.length ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No users found.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.username}</TableCell>
                <TableCell className="text-muted-foreground">
                  {u.email ?? "—"}
                </TableCell>
                <TableCell>{roleBadge(u.role)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditUser(u)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(u)}
                      disabled={u.id === currentUser?.id}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        {showCreate && (
          <CreateUserDialog onClose={() => setShowCreate(false)} />
        )}
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        {editUser && (
          <EditUserDialog user={editUser} onClose={() => setEditUser(null)} />
        )}
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.username}?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteUser.isPending}
              onClick={async () => {
                if (deleteTarget) {
                  await deleteUser.mutateAsync(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              {deleteUser.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
