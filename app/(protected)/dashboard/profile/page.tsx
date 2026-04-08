import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { ProfilePageClient, type ProfileViewUser } from "./ProfilePageClient";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { I18nText } from "@/components/i18n/I18nText";

export const unstable_dynamicStaleTime = 30;

export default async function ProfilePage() {
  const session = await auth();
  await connectDB();
  const user = (await User.findById(session!.user!.id)
    .select("name image profile profileUpdateRequest email")
    .lean()) as {
    name: string;
    image?: string;
    email: string;
    profile?: Record<string, unknown>;
    profileUpdateRequest?: { status: string; requestedAt: string; data?: Record<string, unknown> };
  } | null;

  if (!user) return null;

  const pending = user.profileUpdateRequest?.status === "pending";
  const pendingData = pending ? (user.profileUpdateRequest?.data ?? {}) : {};
  const mergedProfile = {
    ...(user.profile ?? {}),
    ...pendingData,
  } as Record<string, string | number | undefined>;

  const pendingImage =
    pending && typeof (pendingData as { image?: unknown }).image === "string"
      ? (pendingData as { image: string }).image
      : undefined;
  const displayImage = pendingImage && pendingImage.length > 0 ? pendingImage : user.image;

  const viewUser: ProfileViewUser = {
    name: user.name,
    email: user.email,
    image: displayImage,
    profile: mergedProfile,
    pendingProfile: pending,
  };

  return (
    <PageShell narrow className="px-0">
      <PageHeader
        title={<I18nText id="dashboard.myProfileTitle" fallback="My profile" />}
        description={<I18nText id="dashboard.publicProfileDetails" fallback="Your public profile and contact details." />}
      />
      <ProfilePageClient user={viewUser} />
    </PageShell>
  );
}
