"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export function AdminEventsClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [acl, setAcl] = useState<"public" | "member">("public");
  const [showForm, setShowForm] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const venue = String(fd.get("venue") ?? "").trim();
    const startLocal = String(fd.get("startDate") ?? "");
    const endLocal = String(fd.get("endDate") ?? "");
    const capacityRaw = String(fd.get("capacity") ?? "").trim();
    const rsvpUrl = String(fd.get("rsvpUrl") ?? "").trim();
    const tagsRaw = String(fd.get("tags") ?? "").trim();

    if (!title || !description || !venue || !startLocal || !endLocal) {
      toast.error("Fill in title, description, venue, start and end.");
      return;
    }

    const startDate = new Date(startLocal);
    const endDate = new Date(endLocal);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error("Invalid dates.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          venue,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          capacity: capacityRaw ? parseInt(capacityRaw, 10) : undefined,
          rsvpUrl: rsvpUrl || undefined,
          tags: tagsRaw ? tagsRaw.split(",").map((t ) => t.trim()).filter(Boolean) : undefined,
          acl,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Event published.");
        form.reset();
        setAcl("public");
        router.refresh();
      } else toast.error(json.error ?? "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">Create event</h2>
            <p className="text-sm text-muted-foreground">Open the form only when needed.</p>
          </div>
          <Button type="button" variant={showForm ? "outline" : "default"} onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-2 size-4" />
            {showForm ? "Close form" : "Add event"}
          </Button>
        </div>
      </div>
      {showForm ? (
        <form onSubmit={submit} className="rounded-xl border p-4 sm:p-6 space-y-4 bg-card">
          <h2 className="font-semibold text-lg">Add event</h2>
      <div className="space-y-2">
        <Label htmlFor="ev-title">Title</Label>
        <Input id="ev-title" name="title" required minLength={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-desc">Description</Label>
        <Textarea id="ev-desc" name="description" className="min-h-[120px]" required minLength={10} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-venue">Venue</Label>
        <Input id="ev-venue" name="venue" required minLength={2} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ev-start">Start</Label>
          <Input id="ev-start" name="startDate" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-end">End</Label>
          <Input id="ev-end" name="endDate" type="datetime-local" required />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ev-cap">Capacity (optional)</Label>
          <Input id="ev-cap" name="capacity" type="number" min={1} />
        </div>
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select value={acl} onValueChange={(v) => setAcl(v as "public" | "member")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="member">Members only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-rsvp">RSVP URL (optional)</Label>
        <Input id="ev-rsvp" name="rsvpUrl" type="url" placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-tags">Tags (comma-separated)</Label>
        <Input id="ev-tags" name="tags" placeholder="reunion, campus" />
      </div>
      <Button type="submit" disabled={saving} className="gradient-primary text-white border-0">
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Publish event
      </Button>
        </form>
      ) : null}
    </div>
  );
}
