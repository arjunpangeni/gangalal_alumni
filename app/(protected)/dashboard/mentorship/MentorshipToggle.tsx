"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mentorshipUpdateSchema, type MentorshipUpdateInput } from "@/lib/validations/user";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  initial: { availableForMentorship: boolean; mentorshipBio: string; mentorshipSkills: string[] };
}

export function MentorshipToggle({ initial }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const { register, handleSubmit, watch, setValue } = useForm<MentorshipUpdateInput>({
    resolver: zodResolver(mentorshipUpdateSchema),
    defaultValues: initial,
  });

  const available = watch("availableForMentorship");
  const skills = watch("mentorshipSkills") ?? [];

  function addSkill() {
    const skill = newSkill.trim();
    if (!skill || skills.includes(skill) || skills.length >= 15) return;
    setValue("mentorshipSkills", [...skills, skill]);
    setNewSkill("");
  }

  function removeSkill(skill: string) {
    setValue("mentorshipSkills", skills.filter((s) => s !== skill));
  }

  async function onSubmit(data: MentorshipUpdateInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile/mentorship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Mentorship settings saved.");
      } else {
        toast.error(json.error ?? "Could not update settings.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-base">Availability</CardTitle>
          <CardDescription>Control whether you appear on the public Mentorship directory.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1 pr-2">
              <p className="font-semibold text-foreground">Available as a mentor</p>
              <p className="text-sm leading-snug text-muted-foreground">
                When enabled, members can see your mentor card and email you directly.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
              <span className="text-sm font-medium text-muted-foreground sm:hidden">{available ? "On" : "Off"}</span>
              <Switch
                checked={available}
                onCheckedChange={(val) => setValue("availableForMentorship", val)}
                aria-label="Available as a mentor"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {available ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base">Your mentor profile</CardTitle>
            <CardDescription>Shown on your public mentor card together with your member profile photo and work details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mentorship-bio">Short introduction</Label>
              <Textarea
                id="mentorship-bio"
                rows={4}
                className="min-h-[7rem] resize-y text-base sm:text-sm"
                placeholder="Example: I can help with career changes, interview practice, or study planning in engineering."
                {...register("mentorshipBio")}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">A few sentences are enough. This text is public.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentorship-skill-input">Topics you can help with</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="mentorship-skill-input"
                  className="min-h-11 flex-1"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="e.g. React, medical school applications, civil service prep"
                />
                <Button type="button" onClick={addSkill} variant="outline" className="min-h-11 w-full shrink-0 gap-1.5 sm:w-auto">
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
              {skills.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                      {skill}
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-muted"
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Add at least one topic so people know how you can help.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Button type="submit" disabled={submitting} className="min-h-11 w-full gradient-primary border-0 text-white sm:w-auto">
        {submitting ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
