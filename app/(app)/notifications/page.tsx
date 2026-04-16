"use client";
import { useState } from "react";
import { NotificationForm } from "@/components/notification/notification-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteNotification,
  useNotifications,
  useTestNotification,
} from "@/hooks/use-notifications";
import type { Notification } from "@/types/notification";

const TYPE_LABELS: Record<string, string> = {
  discord: "Discord",
  slack: "Slack",
  email: "Email",
  webhook: "Webhook",
  teams: "Teams",
  telegram: "Telegram",
  pushover: "Pushover",
  gotify: "Gotify",
  ntfy: "ntfy",
};

function NotificationRow({
  notification,
  onEdit,
}: {
  notification: Notification;
  onEdit: (n: Notification) => void;
}) {
  const deleteNotif = useDeleteNotification();
  const testNotif = useTestNotification();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  async function handleTest() {
    setTestMessage(null);
    setTestError(null);
    try {
      const result = await testNotif.mutateAsync(notification.id);
      setTestMessage(result.message ?? "Test sent successfully");
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Test failed");
    }
  }

  async function handleDelete() {
    await deleteNotif.mutateAsync(notification.id);
    setConfirmDelete(false);
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="font-medium truncate">{notification.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {TYPE_LABELS[notification.type] ?? notification.type}
              </Badge>
              {notification.isDefault && (
                <Badge variant="default" className="text-xs">
                  Default
                </Badge>
              )}
            </div>
            {testMessage && (
              <p className="text-xs text-green-600 mt-1">{testMessage}</p>
            )}
            {testError && (
              <p className="text-xs text-destructive mt-1">{testError}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testNotif.isPending}
          >
            {testNotif.isPending ? "Testing…" : "Test"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(notification)}
          >
            Edit
          </Button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteNotif.isPending}
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

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Notification | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(notification: Notification) {
    setEditing(notification);
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
          <h1 className="text-2xl font-bold">Notification Channels</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage where alerts are sent when monitors go down or recover.
          </p>
        </div>
        <Button onClick={openCreate}>Add Notification</Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No notification channels configured.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Add one to receive alerts when your monitors change status.
            </p>
            <Button className="mt-4" onClick={openCreate}>
              Add Notification
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && notifications && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onEdit={openEdit} />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Notification" : "Add Notification"}
            </DialogTitle>
          </DialogHeader>
          <NotificationForm
            notification={editing ?? undefined}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
