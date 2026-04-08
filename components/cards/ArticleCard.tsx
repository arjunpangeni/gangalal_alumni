import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { formatDate, truncate } from "@/lib/utils";
import { buildCloudinaryUrl } from "@/lib/cloudinary-url";

interface ArticleCardProps {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  readTime?: number;
  authorName?: string;
  authorImage?: string;
  createdAt: string | Date;
  /** Smaller footprint for homepage grids */
  variant?: "default" | "compact";
  /** Larger type + spacing for homepage news-style columns */
  editorial?: boolean;
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  coverImage,
  tags,
  readTime,
  authorName,
  authorImage,
  createdAt,
  variant = "default",
  editorial = false,
}: ArticleCardProps) {
  const compact = variant === "compact";
  const news = compact && editorial;
  const imgW = compact ? 480 : 400;
  const imgH = compact ? 176 : 240;
  const imgUrl = coverImage
    ? buildCloudinaryUrl(coverImage, { width: imgW, height: imgH, crop: "fill" })
    : null;

  return (
    <article
      className={
        compact
          ? "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/55 bg-card/95 shadow-sm ring-1 ring-primary/[0.04] transition-surface hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:border-border/45 dark:bg-card/90"
          : "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-card ring-1 ring-primary/[0.05] transition-surface hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_14px_40px_oklch(0.35_0.1_264/0.14)] dark:border-border/45 dark:bg-card/90 sm:rounded-3xl"
      }
    >
      {imgUrl && (
        <Link href={`/articles/${slug}`} className="relative overflow-hidden">
          <Image
            src={imgUrl}
            alt={title}
            width={imgW}
            height={imgH}
            className={
              compact
                ? "aspect-[16/9] h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                : "h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            }
          />
        </Link>
      )}
      <div className={news ? "flex flex-1 flex-col p-4 sm:p-5" : compact ? "flex flex-1 flex-col p-3.5 sm:p-4" : "flex flex-1 flex-col p-6"}>
        {tags && tags.length > 0 && (
          <div className={compact ? "mb-2 flex flex-wrap gap-1.5" : "mb-4 flex flex-wrap gap-2"}>
            {tags.slice(0, compact ? 2 : 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className={
                  compact
                    ? "border-0 bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary dark:bg-primary/18"
                    : "text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30 dark:hover:bg-primary/25"
                }
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <h3
          className={
            news
              ? "font-heading mb-2.5 text-base font-bold leading-[1.45] transition-surface group-hover:text-primary line-clamp-2 sm:text-[1.0625rem] sm:leading-snug"
              : compact
                ? "font-heading mb-2 text-[0.9375rem] font-semibold leading-snug transition-surface group-hover:text-primary line-clamp-2"
                : "font-heading mb-3 text-lg font-bold leading-tight transition-surface group-hover:text-primary line-clamp-2"
          }
        >
          <Link href={`/articles/${slug}`}>{title}</Link>
        </h3>
        {excerpt && (
          <p
            className={
              news
                ? "mb-3 flex-1 line-clamp-3 text-[0.9375rem] leading-[1.6] text-muted-foreground sm:text-[0.96875rem]"
              : compact
                ? "mb-3 flex-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
                : "text-sm text-muted-foreground mb-4 flex-1 line-clamp-3 leading-relaxed"
            }
          >
            {truncate(excerpt, compact ? 110 : 150)}
          </p>
        )}
        <div
          className={
            news
              ? "mt-auto flex items-center justify-between gap-2 text-[12px] leading-normal text-muted-foreground sm:text-[13px]"
              : compact
                ? "mt-auto flex items-center justify-between gap-2 text-[11px] text-muted-foreground"
                : "mt-auto flex items-center justify-between gap-3 text-sm text-muted-foreground"
          }
        >
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className={compact ? "size-6 ring-1 ring-border/50" : "size-7 ring-1 ring-border/50"}>
              <AvatarImage src={authorImage ?? ""} />
              <AvatarFallback className="text-[10px] font-semibold">{authorName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">{authorName}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[10px] sm:gap-3 sm:text-xs">
            {readTime && (
              <span className="flex items-center gap-1">
                <Clock className={compact ? "size-3" : "size-4"} aria-hidden />
                {readTime}m
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className={compact ? "size-3" : "size-4"} aria-hidden />
              {formatDate(createdAt)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
