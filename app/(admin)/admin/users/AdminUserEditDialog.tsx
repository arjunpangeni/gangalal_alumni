"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminUserProfilePutSchema, type AdminUserProfilePutInput } from "@/lib/validations/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type ApiUser = {
  name: string;
  email: string;
  image?: string;
  profile?: {
    bio?: string;
    slcSeeBatch?: number;
    schoolPeriod?: string;
    profession?: string;
    company?: string;
    permanentAddress?: string;
    city?: string;
    country?: string;
    linkedin?: string;
    facebook?: string;
    phone?: string;
  };
};

function toFormDefaults(u: ApiUser): AdminUserProfilePutInput {
  const p = u.profile ?? {};
  return {
    name: u.name,
    image: u.image ?? "",
    bio: (p.bio as string) ?? "",
    slcSeeBatch: p.slcSeeBatch,
    schoolPeriod: (p.schoolPeriod as string) ?? "",
    profession: (p.profession as string) ?? "",
    company: (p.company as string) ?? "",
    permanentAddress: (p.permanentAddress as string) ?? "",
    city: (p.city as string) ?? "",
    country: (p.country as string) ?? "",
    linkedin: (p.linkedin as string) ?? "",
    facebook: (p.facebook as string) ?? "",
    phone: (p.phone as string) ?? "",
  };
}

export function AdminUserEditDialog({
  userId,
  open,
  onOpenChange,
  onSaved,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (data: { userId: string; name: string; image?: string }) => void;
}) {
  const [loadingUser, setLoadingUser] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminUserProfilePutInput>({
    resolver: zodResolver(adminUserProfilePutSchema),
    defaultValues: {
      name: "",
      image: "",
      bio: "",
      schoolPeriod: "",
      profession: "",
      company: "",
      permanentAddress: "",
      city: "",
      country: "",
      linkedin: "",
      facebook: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoadingUser(true);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        const json = (await res.json()) as { success?: boolean; data?: ApiUser; error?: string };
        if (cancelled) return;
        if (!res.ok || !json.success || !json.data) {
          toast.error(json.error ?? "Could not load user.");
          onOpenChange(false);
          return;
        }
        setUserEmail(json.data.email);
        reset(toFormDefaults(json.data));
      } catch {
        if (!cancelled) toast.error("Could not load user.");
        if (!cancelled) onOpenChange(false);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId, reset, onOpenChange]);

  async function onSubmit(data: AdminUserProfilePutInput) {
    if (!userId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Profile updated.");
        onSaved({
          userId,
          name: data.name,
          image: (data.image ?? "").trim() || undefined,
        });
        onOpenChange(false);
      } else {
        toast.error(json.error ?? "Update failed.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton>
        <DialogHeader className="shrink-0 border-b px-4 py-4 sm:px-6">
          <DialogTitle>Edit member profile</DialogTitle>
          <DialogDescription>
            Correct mistakes or fill in details for members who need help. Login email cannot be changed here.
          </DialogDescription>
        </DialogHeader>

        {loadingUser ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
              <div className="space-y-1 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account email</span>
                <p className="break-all font-medium">{userEmail || "—"}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adm-name">Display name *</Label>
                <Input id="adm-name" className="min-h-10" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adm-image">Profile image URL (optional)</Label>
                <Input id="adm-image" className="min-h-10" placeholder="https://…" {...register("image")} />
                {errors.image && <p className="text-xs text-destructive">{errors.image.message}</p>}
                <p className="text-xs text-muted-foreground">Paste a Cloudinary or other HTTPS image URL. Leave empty to clear.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adm-bio">Bio *</Label>
                <Textarea id="adm-bio" rows={3} className="min-h-[5rem] resize-y" {...register("bio")} />
                {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adm-batch">SLC / SEE batch year</Label>
                  <Input
                    id="adm-batch"
                    type="number"
                    {...register("slcSeeBatch", {
                      setValueAs: (v) => {
                        if (v === "" || v === null || v === undefined) return undefined;
                        const n = Number(v);
                        return Number.isFinite(n) ? n : undefined;
                      },
                    })}
                  />
                  {errors.slcSeeBatch && <p className="text-xs text-destructive">{errors.slcSeeBatch.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adm-school">Years at school</Label>
                  <Input id="adm-school" {...register("schoolPeriod")} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adm-prof">Profession *</Label>
                  <Input id="adm-prof" {...register("profession")} />
                  {errors.profession && <p className="text-xs text-destructive">{errors.profession.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adm-company">Company</Label>
                  <Input id="adm-company" {...register("company")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adm-addr">Permanent address *</Label>
                <Input id="adm-addr" {...register("permanentAddress")} />
                {errors.permanentAddress && <p className="text-xs text-destructive">{errors.permanentAddress.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adm-city">City</Label>
                  <Input id="adm-city" {...register("city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adm-country">Country</Label>
                  <Input id="adm-country" {...register("country")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adm-phone">Phone *</Label>
                <Input id="adm-phone" {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adm-li">LinkedIn</Label>
                  <Input id="adm-li" {...register("linkedin")} />
                  {errors.linkedin && <p className="text-xs text-destructive">{errors.linkedin.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adm-fb">Facebook</Label>
                  <Input id="adm-fb" {...register("facebook")} />
                  {errors.facebook && <p className="text-xs text-destructive">{errors.facebook.message}</p>}
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t bg-muted/20 px-4 py-3 sm:px-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gradient-primary border-0 text-white">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save profile"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
