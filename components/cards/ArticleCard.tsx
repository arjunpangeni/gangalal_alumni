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
}

export function ArticleCard({ title, slug, excerpt, coverImage, tags, readTime, authorName, authorImage, createdAt }: ArticleCardProps) {
  const imgUrl = coverImage
    ? buildCloudinaryUrl(coverImage, { width: 400, height: 240, crop: "fill" })
    : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/95 backdrop-blur-sm shadow-sm ring-1 ring-border/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:ring-primary/20 hover:bg-card dark:bg-card/90 dark:border-border/30 dark:ring-border/5">
      {imgUrl && (
        <Link href={`/articles/${slug}`} className="overflow-hidden">
          <Image
            src={imgUrl}
            alt={title}
            width={400}
            height={240}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col p-6">
        {tags && tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30 dark:hover:bg-primary/25">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <h3 className="mb-3 text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          <Link href={`/articles/${slug}`}>{title}</Link>
        </h3>
        {excerpt && (
          <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3 leading-relaxed">
            {truncate(excerpt, 150)}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Avatar className="size-7 ring-1 ring-border/50">
              <AvatarImage src={authorImage ?? ""} />
              <AvatarFallback className="text-xs font-semibold">{authorName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium line-clamp-1">{authorName}</span>
          </div>
          <div className="flex items-center gap-4 whitespace-nowrap text-xs">
            {readTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" />{readTime}m
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />{formatDate(createdAt)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
