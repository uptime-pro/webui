"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LoginModal() {
  const router = useRouter();

  function handleClose() {
    router.back();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
        </DialogHeader>
        <LoginForm onSuccess={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
