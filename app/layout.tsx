import type { Metadata } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { NETWORK_NAME, NETWORK_TAGLINE } from "@/lib/brand";
import "./globals.css";

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: NETWORK_NAME, template: `%s | ${NETWORK_NAME}` },
  description: NETWORK_TAGLINE,
  openGraph: { type: "website", siteName: NETWORK_NAME },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ne"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={notoDevanagari.variable}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
