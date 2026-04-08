"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations/user";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { postFormDataWithUploadProgress } from "@/lib/form-upload-progress";
import { UploadProgressBar } from "@/components/ui/UploadProgressBar";
import { useI18n } from "@/components/i18n/I18nProvider";

interface Props {
  currentProfile: Record<string, string | number | undefined>;
  userName: string;
  userImage?: string;
  onSaved?: () => void;
}

export function ProfileEditForm({ currentProfile, userName, userImage, onSaved }: Props) {
  const { messages } = useI18n();
  const { update } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);
  const [photoIndeterminate, setPhotoIndeterminate] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(userImage ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: userName,
      bio: (currentProfile.bio as string) ?? "",
      slcSeeBatch: currentProfile.slcSeeBatch as number | undefined,
      schoolPeriod: (currentProfile.schoolPeriod as string) ?? "",
      profession: (currentProfile.profession as string) ?? "",
      company: (currentProfile.company as string) ?? "",
      permanentAddress: (currentProfile.permanentAddress as string) ?? "",
      city: (currentProfile.city as string) ?? "",
      country: (currentProfile.country as string) ?? "",
      linkedin: (currentProfile.linkedin as string) ?? "",
      facebook: (currentProfile.facebook as string) ?? "",
      phone: (currentProfile.phone as string) ?? "",
    },
  });

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setPhotoProgress(0);
    setPhotoIndeterminate(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await postFormDataWithUploadProgress("/api/profile/photo", formData, (pct, known) => {
        if (known) {
          setPhotoIndeterminate(false);
          setPhotoProgress(pct);
        }
      });
      const json = (await res.json()) as { success?: boolean; error?: string; url?: string };
      if (res.ok && json.success) {
        setPhotoUrl(json.url ?? "");
        toast.success(messages.dashboard.profilePhotoUpdated);
        await update();
      } else {
        toast.error(json.error ?? messages.dashboard.failedUploadPhoto);
      }
    } catch {
      toast.error(messages.dashboard.uploadPhotoError);
    } finally {
      setUploadingPhoto(false);
      setPhotoProgress(null);
      setPhotoIndeterminate(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(data: ProfileUpdateInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        await update();
        toast.success(messages.dashboard.profileSaved);
        onSaved?.();
      } else {
        toast.error(json.error ?? messages.dashboard.failedUpdateProfile);
      }
    } catch {
      toast.error(messages.dashboard.somethingWentWrong);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border bg-card p-4 sm:p-6 w-full">

      <div className="space-y-2">
        <Label>{messages.dashboard.profilePhoto}</Label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative group shrink-0">
            <Avatar className="size-20 ring-2 ring-border">
              <AvatarImage src={photoUrl} alt={userName} />
              <AvatarFallback className="text-2xl font-bold">{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploadingPhoto
                ? <Loader2 className="size-5 text-white animate-spin" />
                : <Camera className="size-5 text-white" />
              }
            </button>
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
              {uploadingPhoto ? messages.dashboard.uploading : messages.dashboard.changePhoto}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">{messages.dashboard.photoHint}</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoChange} />
        </div>
        {uploadingPhoto ? (
          <UploadProgressBar
            indeterminate={photoIndeterminate}
            value={photoIndeterminate ? undefined : (photoProgress ?? 0)}
            label={messages.dashboard.uploadingProfilePhoto}
            className="max-w-md"
          />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{messages.dashboard.displayName} <span className="text-destructive">*</span></Label>
        <Input id="name" placeholder={messages.dashboard.fullNamePlaceholder} {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        <p className="text-xs text-muted-foreground">
          {messages.dashboard.displayNameHelp}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{messages.dashboard.bioLabel} <span className="text-destructive">*</span></Label>
        <Textarea id="bio" rows={3} placeholder={messages.dashboard.bioPlaceholder} {...register("bio")} />
        {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slcSeeBatch">{messages.dashboard.slcBatchYear}</Label>
          <Input id="slcSeeBatch" type="number" placeholder={messages.dashboard.slcBatchPlaceholder} {...register("slcSeeBatch", { valueAsNumber: true })} />
          {errors.slcSeeBatch && <p className="text-xs text-destructive">{errors.slcSeeBatch.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolPeriod">{messages.dashboard.schoolYears}</Label>
          <Input id="schoolPeriod" placeholder={messages.dashboard.schoolYearsPlaceholder} {...register("schoolPeriod")} />
          {errors.schoolPeriod && <p className="text-xs text-destructive">{errors.schoolPeriod.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profession">{messages.dashboard.professionLabel} <span className="text-destructive">*</span></Label>
          <Input id="profession" placeholder={messages.dashboard.professionPlaceholder} {...register("profession")} />
          {errors.profession && <p className="text-xs text-destructive">{errors.profession.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">{messages.dashboard.companyOrg}</Label>
          <Input id="company" placeholder={messages.dashboard.companyPlaceholder} {...register("company")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="permanentAddress">{messages.dashboard.permanentAddressLabel} <span className="text-destructive">*</span></Label>
        <Input id="permanentAddress" placeholder={messages.dashboard.permanentAddressPlaceholder} {...register("permanentAddress")} />
        {errors.permanentAddress && <p className="text-xs text-destructive">{errors.permanentAddress.message}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">{messages.dashboard.currentCityLabel}</Label>
          <Input id="city" placeholder={messages.dashboard.currentCityPlaceholder} {...register("city")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">{messages.dashboard.countryLabel}</Label>
          <Input id="country" placeholder={messages.dashboard.countryPlaceholder} {...register("country")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{messages.dashboard.phoneNumberLabel} <span className="text-destructive">*</span></Label>
        <Input id="phone" placeholder={messages.dashboard.phonePlaceholder} {...register("phone")} />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="linkedin">{messages.dashboard.linkedinUrl}</Label>
          <Input id="linkedin" placeholder="https://linkedin.com/in/..." {...register("linkedin")} />
          {errors.linkedin && <p className="text-xs text-destructive">{errors.linkedin.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="facebook">{messages.dashboard.facebookUrl}</Label>
          <Input id="facebook" placeholder="https://facebook.com/..." {...register("facebook")} />
          {errors.facebook && <p className="text-xs text-destructive">{errors.facebook.message}</p>}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {messages.dashboard.requiredFieldsHelp}
      </p>

      <Button type="submit" disabled={submitting} className="gradient-primary text-white border-0">
        {submitting ? messages.dashboard.saving : messages.dashboard.saveProfile}
      </Button>
    </form>
  );
}
