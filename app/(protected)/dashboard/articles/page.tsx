import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PenLine, FileText, Calendar, Sparkles, FileEdit, Archive } from "lucide-react";
import { MyArticlesActions } from "./MyArticlesActions";
import { formatDate, cn } from "@/lib/utils";
import { PageShell, PageHeader, PageEmptyState } from "@/components/layout/Page";

interface ArticleRow {
  _id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: Date | string;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending: "secondary",
  published: "default",
  archived: "destructive",
};

const statusHelp: Record<string, string> = {
  draft: "Only you can see this. Submit for review when ready.",
  pending: "Waiting for an admin to approve or request changes.",
  published: "Live on the site. Edits need approval again.",
  archived: "No longer shown publicly.",
};

function cardTone(status: string) {
  switch (status) {
    case "published":
      return "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-card to-card shadow-sm ring-emerald-500/10 dark:from-emerald-500/[0.09] dark:via-card";
    case "pending":
      return "border-amber-500/20 bg-gradient-to-br from-amber-500/[0.05] via-card to-card shadow-sm ring-amber-500/10 dark:from-amber-500/[0.08]";
    case "archived":
      return "border-border/80 bg-muted/20 opacity-95 shadow-sm";
    default:
      return "border-border/80 bg-card shadow-sm";
  }
}

function StatusIcon({ status }: { status: string }) {
  const cls = "size-4 shrink-0";
  switch (status) {
    case "published":
      return <Sparkles className={cn(cls, "text-emerald-600 dark:text-emerald-400")} />;
    case "pending":
      return <FileEdit className={cn(cls, "text-amber-600 dark:text-amber-400")} />;
    case "archived":
      return <Archive className={cn(cls, "text-muted-foreground")} />;
    default:
      return <FileText className={cn(cls, "text-muted-foreground")} />;
  }
}

export default async function MyArticlesPage() {
  const session = await auth();
  const isStaff = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  await connectDB();
  const raw = await Article.find({ authorId: session!.user!.id, deletedAt: null })
    .sort({ createdAt: -1 })
    .select("title slug status createdAt")
    .lean<
      Array<{
        _id: unknown;
        title: string;
        slug: string;
        status: string;
        createdAt: Date;
      }>
    >();

  const articles: ArticleRow[] = raw.map((a) => ({
    _id: String(a._id),
    title: a.title,
    slug: a.slug,
    status: a.status,
    createdAt: a.createdAt,
  }));

  return (
    <PageShell className="max-w-4xl px-0">
      <PageHeader
        title="Your articles"
        description="Write new posts, edit drafts or published stories, and manage removal when needed. Published edits from members go through review again."
        action={
          <Link
            href="/content/new"
            className={`${buttonVariants({})} gradient-primary text-white border-0 shrink-0 inline-flex justify-center w-full sm:w-auto`}
          >
            <PenLine className="mr-2 size-4" />
            Write new
          </Link>
        }
      />

      {articles.length === 0 ? (
        <PageEmptyState
          icon={<FileText className="size-10" />}
          title="No articles yet"
          description='Start with "Write new" to create a draft or submit your first story.'
        />
      ) : (
        <ul className="flex flex-col gap-5">
          {articles.map((a) => (
            <li key={a._id}>
              <Card
                size="sm"
                className={cn(
                  "py-0 transition-[box-shadow,transform] duration-200 hover:shadow-md hover:-translate-y-px ring-1",
                  cardTone(a.status)
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-stretch">
                  <CardHeader className="flex-1 gap-3 border-b border-border/50 pb-4 pt-5 lg:border-b-0 lg:border-r lg:pb-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <div
                          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/80 ring-1 ring-border/60 shadow-sm"
                          aria-hidden
                        >
                          <StatusIcon status={a.status} />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <CardTitle className="text-base font-semibold leading-snug tracking-tight sm:text-lg">
                            {a.title}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={statusVariant[a.status] ?? "outline"}
                              className="h-5 px-2 text-[10px] font-semibold uppercase tracking-wide"
                            >
                              {a.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="pl-[2.875rem] text-xs leading-relaxed sm:text-[13px]">
                      {statusHelp[a.status] ?? ""}
                    </CardDescription>
                    <div className="flex items-center gap-2 pl-[2.875rem] text-xs text-muted-foreground">
                      <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
                      <span>Created {formatDate(a.createdAt)}</span>
                    </div>
                  </CardHeader>

                  <CardFooter className="flex flex-col justify-center border-0 bg-muted/40 p-4 sm:p-5 lg:w-[min(100%,17.5rem)] lg:shrink-0 lg:border-l lg:border-border/50 lg:bg-muted/25">
                    <MyArticlesActions slug={a.slug} status={a.status} isStaff={!!isStaff} />
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
