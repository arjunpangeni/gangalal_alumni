import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, cn } from "@/lib/utils";
import { Briefcase, Pencil, Plus, MapPin, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { PageShell, PageHeader, PageEmptyState } from "@/components/layout/Page";
import { MyJobDeleteButton } from "./MyJobDeleteButton";

export const unstable_dynamicStaleTime = 30;

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending: "secondary",
  published: "default",
  archived: "destructive",
};

function cardTone(status: string) {
  switch (status) {
    case "published":
      return "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-card to-card ring-emerald-500/10 dark:from-emerald-500/[0.09]";
    case "pending":
      return "border-amber-500/20 bg-gradient-to-br from-amber-500/[0.05] via-card to-card ring-amber-500/10 dark:from-amber-500/[0.08]";
    case "archived":
      return "border-border/80 bg-muted/20 opacity-95";
    default:
      return "border-border/80 bg-card";
  }
}

export default async function MyJobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.status !== "approved") redirect("/auth/pending");

  await connectDB();
  const raw = await Job.find({ authorId: session.user.id, deletedAt: null })
    .sort({ createdAt: -1 })
    .select("title slug status company location type createdAt expiresAt")
    .lean();

  const jobs = raw.map((j) => ({
    _id: String(j._id),
    title: j.title as string,
    slug: j.slug as string,
    status: j.status as string,
    company: j.company as string,
    location: j.location as string,
    type: j.type as string,
    createdAt: (j.createdAt as Date).toISOString(),
    expiresAt: j.expiresAt ? (j.expiresAt as Date).toISOString() : null as string | null,
  }));

  return (
    <PageShell className="max-w-4xl px-0">
      <PageHeader
        title="Jobs"
        description="Post listings and manage drafts. Pending jobs are reviewed by an admin before they appear on the public board."
        action={
          <Link
            href="/dashboard/jobs/new"
            className={`${buttonVariants({})} gradient-primary text-white border-0 shrink-0 gap-2 justify-center w-full sm:w-auto`}
          >
            <Plus className="size-4" />
            Post a job
          </Link>
        }
      />

      {jobs.length === 0 ? (
        <PageEmptyState
          icon={<Briefcase className="size-10" />}
          title="You have not posted any jobs yet"
          description="Create your first listing to get started."
          className="text-muted-foreground"
        />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0 sm:gap-5">
          {jobs.map((j) => (
            <li key={j._id}>
              <Card
                size="sm"
                className={cn(
                  "py-0 shadow-sm ring-1 transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-md",
                  cardTone(j.status)
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-stretch">
                  <CardHeader className="flex-1 gap-3 border-b border-border/50 pb-4 pt-5 sm:border-b-0 sm:border-r sm:pb-5">
                    <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
                      <Badge
                        variant={statusVariant[j.status] ?? "outline"}
                        className="h-5 shrink-0 px-2 text-[10px] font-semibold uppercase tracking-wide"
                      >
                        {j.status}
                      </Badge>
                      <span className="text-xs capitalize text-muted-foreground">{j.type.replace("-", " ")}</span>
                    </div>
                    <CardTitle className="text-base font-semibold leading-snug tracking-tight text-pretty sm:text-lg">
                      {j.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{j.company}</span>
                      <span className="mx-1.5 text-border">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        {j.location}
                      </span>
                    </p>
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        Posted {formatDate(j.createdAt)}
                      </span>
                      {j.expiresAt ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
                          Deadline {formatDate(j.expiresAt)}
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardFooter className="flex flex-col justify-center gap-2 border-0 bg-muted/40 p-4 sm:w-[min(100%,11rem)] sm:shrink-0 sm:border-l sm:border-border/50 sm:bg-muted/25 sm:p-5">
                    <Link
                      href={`/dashboard/jobs/edit/${j.slug}`}
                      className={`${buttonVariants({ variant: "outline" })} min-h-11 w-full gap-2 justify-center sm:min-h-10`}
                    >
                      <Pencil className="size-4 shrink-0" />
                      Edit
                    </Link>
                    <MyJobDeleteButton slug={j.slug} title={j.title} />
                  </CardFooter>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
