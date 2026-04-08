"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { scheduleRouterRefresh } from "@/lib/schedule-router-refresh";
import { ProfileEditForm } from "./ProfileEditForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

export type ProfileViewUser = {
  name: string;
  email: string;
  image?: string;
  profile?: Record<string, string | number | undefined>;
  pendingProfile: boolean;
};

function Row({ label, value }: { label: string; value: string | number | undefined }) {
  const v = value !== undefined && value !== null && String(value).trim() !== "" ? String(value) : "—";
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm whitespace-pre-wrap">{v}</p>
    </div>
  );
}

function getProfile(p: Record<string, string | number | undefined> | undefined, key: string) {
  return p?.[key];
}

export function ProfilePageClient({ user }: { user: ProfileViewUser }) {
  const { messages } = useI18n();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const profile = user.profile ?? {};

  if (editing) {
    return (
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">{messages.dashboard.editProfile}</h2>
          <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto shrink-0" onClick={() => setEditing(false)}>
            {messages.dashboard.cancel}
          </Button>
        </div>
        <ProfileEditForm
          key={`profile-edit-${user.pendingProfile ? "pending" : "live"}`}
          currentProfile={profile}
          userName={user.name}
          userImage={user.image}
          onSaved={() => {
            setEditing(false);
            scheduleRouterRefresh(() => router.refresh());
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      {user.pendingProfile && (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-50"
        >
          <p className="font-semibold text-amber-950 dark:text-amber-50">Changes awaiting approval</p>
          <p className="mt-1.5 text-amber-900/90 dark:text-amber-100/90">
            An older submission is still in the admin queue. Open <span className="font-medium">Edit profile</span> and save once to publish your current details immediately, or wait for an admin to approve or reject the queued version.
          </p>
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex flex-row items-start gap-4 w-full">
            <Avatar className="size-16 sm:size-20 ring-2 ring-border shrink-0">
              <AvatarImage src={user.image ?? ""} alt={user.name} />
              <AvatarFallback className="text-xl font-semibold">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-1">
              <CardTitle className="text-xl leading-tight break-words">{user.name}</CardTitle>
              <CardDescription className="break-all text-sm">{user.email}</CardDescription>
            </div>
          </div>
          <Button type="button" className="w-full sm:w-auto shrink-0 gradient-primary text-white border-0" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 size-4" />
            {messages.dashboard.editProfile}
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 pt-0 px-4 sm:px-6 sm:grid-cols-2">
          <Row label={messages.profile.bio} value={getProfile(profile, "bio") as string | undefined} />
          <Row label={messages.profile.profession} value={getProfile(profile, "profession") as string | undefined} />
          <Row label={messages.profile.company} value={getProfile(profile, "company") as string | undefined} />
          <Row label={messages.profile.slcSeeBatch} value={getProfile(profile, "slcSeeBatch") as number | undefined} />
          <Row label={messages.profile.schoolPeriod} value={getProfile(profile, "schoolPeriod") as string | undefined} />
          <Row label={messages.profile.permanentAddress} value={getProfile(profile, "permanentAddress") as string | undefined} />
          <Row label={messages.profile.city} value={getProfile(profile, "city") as string | undefined} />
          <Row label={messages.profile.country} value={getProfile(profile, "country") as string | undefined} />
          <Row label={messages.profile.phone} value={getProfile(profile, "phone") as string | undefined} />
          <Row label={messages.profile.linkedin} value={getProfile(profile, "linkedin") as string | undefined} />
          <Row label={messages.profile.facebook} value={getProfile(profile, "facebook") as string | undefined} />
        </CardContent>
      </Card>

    </div>
  );
}
