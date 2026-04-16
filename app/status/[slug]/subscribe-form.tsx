"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function SubscribeForm({ statusPageId }: { statusPageId: number }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/status-pages/${statusPageId}/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message ?? "Failed to subscribe");
      }
      setStatus("success");
      setMessage("You have been subscribed to updates.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to subscribe");
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">Get Updates</h3>
      <p className="text-sm text-muted-foreground">
        Subscribe to receive email notifications about incidents and
        maintenance.
      </p>
      {status === "success" ? (
        <p className="text-sm text-green-600">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="subscribe-email" className="sr-only">
              Email address
            </Label>
            <Input
              id="subscribe-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      )}
      {status === "error" && (
        <p className="text-sm text-destructive">{message}</p>
      )}
    </div>
  );
}
