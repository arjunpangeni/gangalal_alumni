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
        title={`Welcome back, ${session?.user?.name?.split(" ")[0]}!`}
        description="Quick overview of your account and activity."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{myArticlesCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{publishedCount} published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{myJobsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Your listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400 capitalize">{session?.user?.status}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm font-semibold capitalize">{session?.user?.role}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/dashboard/profile", icon: User, label: "Profile", desc: "Your information" },
          { href: "/dashboard/articles", icon: FileText, label: "Articles", desc: "Write and manage posts" },
          { href: "/dashboard/jobs", icon: Briefcase, label: "Jobs", desc: "Post and manage listings" },
          { href: "/dashboard/mentorship", icon: Heart, label: "Mentorship", desc: "Offer guidance" },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href} className={cn(buttonVariants({ variant: "outline" }), "h-auto flex-col items-start gap-1 p-4")}>
            <Icon className="size-5 mb-1" />
            <span className="font-semibold">{label}</span>
            <span className="text-xs text-muted-foreground font-normal">{desc}</span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
