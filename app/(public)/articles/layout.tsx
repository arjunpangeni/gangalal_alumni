import { Manrope, Source_Serif_4 } from "next/font/google";
import { cn } from "@/lib/utils";

const articleSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-article-serif",
  display: "swap",
});

const articleHeading = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-article-heading",
  display: "swap",
});

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(articleSerif.variable, articleHeading.variable, "articles-typography min-w-0")}>{children}</div>
  );
}
