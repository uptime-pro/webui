"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStatusPage } from "@/hooks/use-status-pages";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function NewStatusPagePage() {
  const router = useRouter();
  const createPage = useCreateStatusPage();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await createPage.mutateAsync({
      name,
      slug,
      description: description || undefined,
      published,
    });
    router.push(`/status-pages/${data.id}`);
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/status-pages" />}>← Back</Button>
        <h1 className="text-2xl font-bold">New Status Page</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My Service Status"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="my-service-status"
            required
          />
          <p className="text-xs text-muted-foreground">
            Public URL: /status/{slug || "..."}
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your service..."
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="published"
            checked={published}
            onCheckedChange={setPublished}
          />
          <Label htmlFor="published">Published (publicly accessible)</Label>
        </div>

        {createPage.error && (
          <p className="text-sm text-destructive">
            {createPage.error instanceof Error
              ? createPage.error.message
              : "Failed to create status page"}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={createPage.isPending}>
            {createPage.isPending ? "Creating..." : "Create Status Page"}
          </Button>
          <Button variant="outline" type="button" render={<Link href="/status-pages" />}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
