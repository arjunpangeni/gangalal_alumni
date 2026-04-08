import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FileText, User, Heart, Briefcase } from "lucide-react";
import Job from "@/lib/models/Job";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { I18nText } from "@/components/i18n/I18nText";

export const unstable_dynamicStaleTime = 30;

export default async function DashboardPage() {
  const session = await auth();
  await connectDB();

  const [myArticlesCount, publishedCount, myJobsCount] = await Promise.all([
    Article.countDocuments({ authorId: session!.user!.id, deletedAt: null }),
    Article.countDocuments({ authorId: session!.user!.id, status: "published", deletedAt: null }),
    Job.countDocuments({ authorId: session!.user!.id, deletedAt: null }),
  ]);

  return (
    <PageShell className="px-0">
      <PageHeader
        title={<I18nText id="dashboard.welcomeBack" fallback={`Welcome back, ${session?.user?.name?.split(" ")[0]}!`} values={{ name: session?.user?.name?.split(" ")[0] ?? "" }} />}
        description={<I18nText id="dashboard.quickOverview" fallback="Quick overview of your account and activity." />}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground"><I18nText id="dashboard.yourArticles" fallback="My Articles" /></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{myArticlesCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{publishedCount} <I18nText id="dashboard.published" fallback="published" /></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground"><I18nText id="dashboard.jobs" fallback="Jobs" /></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{myJobsCount}</p>
            <p className="text-xs text-muted-foreground mt-1"><I18nText id="dashboard.yourListings" fallback="Your listings" /></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground"><I18nText id="dashboard.accountStatus" fallback="Account Status" /></CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400 capitalize">{session?.user?.status}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground"><I18nText id="dashboard.role" fallback="Role" /></CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm font-semibold capitalize">{session?.user?.role}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/dashboard/profile", icon: User, labelId: "dashboard.myProfile", labelFallback: "My Profile", descId: "dashboard.yourInformation", descFallback: "Your information" },
          { href: "/dashboard/articles", icon: FileText, labelId: "dashboard.yourArticles", labelFallback: "My Articles", descId: "dashboard.writeAndManagePosts", descFallback: "Write and manage posts" },
          { href: "/dashboard/jobs", icon: Briefcase, labelId: "dashboard.jobs", labelFallback: "Jobs", descId: "dashboard.postAndManageListings", descFallback: "Post and manage listings" },
          { href: "/dashboard/mentorship", icon: Heart, labelId: "dashboard.mentorship", labelFallback: "Mentorship", descId: "dashboard.offerGuidance", descFallback: "Offer guidance" },
        ].map(({ href, icon: Icon, labelId, labelFallback, descId, descFallback }) => (
          <Link key={href} href={href} className={cn(buttonVariants({ variant: "outline" }), "h-auto flex-col items-start gap-1 p-4")}>
            <Icon className="size-5 mb-1" />
            <span className="font-semibold"><I18nText id={labelId} fallback={labelFallback} /></span>
            <span className="text-xs text-muted-foreground font-normal"><I18nText id={descId} fallback={descFallback} /></span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
