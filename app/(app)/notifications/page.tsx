"use client";
import { Bell } from "lucide-react";
import { useState } from "react";
import { NotificationForm } from "@/components/notification/notification-form";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function NotificationCard({
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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium truncate">
            {notification.name}
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className="text-xs">
              {TYPE_LABELS[notification.type] ?? notification.type}
            </Badge>
            {notification.isDefault && (
              <Badge variant="default" className="text-xs">
                Default
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {testMessage && (
          <p className="text-xs text-green-600 dark:text-green-400">{testMessage}</p>
        )}
        {testError && (
          <p className="text-xs text-destructive">{testError}</p>
        )}
        <div className="flex items-center gap-2">
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
            <>
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
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive ml-auto"
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
    <div className="space-y-6">
      <PageHeader
        title="Notification Channels"
        description="Manage where alerts are sent when monitors go down or recover."
        action={<Button size="sm" onClick={openCreate}>Add Channel</Button>}
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium">No channels yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add a channel to receive alerts when your monitors change status.
          </p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            Add Channel
          </Button>
        </div>
      )}

      {!isLoading && notifications && notifications.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {notifications.map((n) => (
            <NotificationCard key={n.id} notification={n} onEdit={openEdit} />
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
