import { Source_Sans_3 } from "next/font/google";
import { cn } from "@/lib/utils";

/** Single readable sans stack (similar to major news portals) + Noto Devanagari from root. */
const homeNews = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-home-news",
  display: "swap",
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <div className={cn(homeNews.variable, "home-typography min-w-0")}>{children}</div>;
}
