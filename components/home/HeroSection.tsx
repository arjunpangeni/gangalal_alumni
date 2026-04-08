"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

const heroImage = "/gangalalfinal.jpg";

const containerMotion = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const itemMotion = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

export function HeroSection({ className }: { className?: string }) {
  const { messages } = useI18n();
  const { data: session, status } = useSession();

  return (
    <section
      className={cn(
        "relative isolate min-h-[min(88svh,56rem)] overflow-hidden md:min-h-[min(90svh,44rem)] lg:min-h-[32rem]",
        className
      )}
    >
      <Image
        src={heroImage}
        alt={messages.brand.name}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Lighter overlay so photo stays visible; stronger tint only at bottom for text contrast */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/15 dark:from-background dark:via-background/55 dark:to-background/20"
        aria-hidden
      />
      <div
        className="absolute inset-0 hidden bg-gradient-to-r from-background/65 via-background/25 to-transparent dark:from-background/70 dark:via-background/30 dark:to-transparent md:block"
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex min-h-[min(88svh,56rem)] flex-col justify-end px-4 pb-10 pt-28 sm:px-6 sm:pb-12 sm:pt-32 md:min-h-[min(90svh,44rem)] md:justify-center md:pb-16 md:pt-20 lg:min-h-[32rem] lg:py-16"
        variants={containerMotion}
        initial="hidden"
        animate="show"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center md:mx-0 md:max-w-[34rem] md:text-left">
            <motion.div
              variants={itemMotion}
              className="mb-5 inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/70 px-3 py-1.5 text-[13px] font-semibold leading-snug text-foreground shadow-sm backdrop-blur-md sm:mb-6 sm:px-3.5 sm:py-2 sm:text-sm dark:border-white/12 dark:bg-background/55"
            >
              <Sparkles className="size-3.5 shrink-0 text-primary sm:size-4" aria-hidden />
              <span>{messages.home.heroBadge}</span>
            </motion.div>

            <motion.h1
              variants={itemMotion}
              className="font-heading text-[clamp(1.75rem,2vw+1.2rem,2.35rem)] font-bold leading-[1.2] tracking-tight text-foreground sm:leading-[1.18]"
            >
              <span className="block text-balance">{messages.brand.name}</span>
              <span className="mt-2 block text-balance text-primary sm:mt-2.5">{messages.home.heroTitleSuffix}</span>
            </motion.h1>

            <motion.p
              variants={itemMotion}
              className="mx-auto mt-5 max-w-xl text-pretty text-[0.95rem] leading-[1.7] text-muted-foreground sm:mt-6 sm:text-[1.05rem] sm:leading-[1.72] md:mx-0"
            >
              {messages.home.heroSubtitle}
            </motion.p>

            <motion.div variants={itemMotion} className="mt-9 flex flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
              {status === "loading" ? (
                <div className="h-11 w-full max-w-xs rounded-xl bg-muted/80 animate-pulse sm:h-12" />
              ) : session?.user ? (
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 w-full justify-center gap-2 rounded-xl gradient-primary border-0 text-base text-white shadow-lg shadow-primary/25 sm:w-auto sm:min-w-[11rem]"
                  )}
                >
                  {messages.home.goToDashboard} <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <Button
                  size="lg"
                  onClick={() => signIn("google")}
                  className="h-12 w-full justify-center gap-2 rounded-xl text-base gradient-primary border-0 text-white shadow-lg shadow-primary/25 sm:w-auto sm:min-w-[11rem]"
                >
                  <GraduationCap className="size-5 shrink-0" aria-hidden />
                  {messages.home.joinWithGoogle}
                </Button>
              )}
              <Link
                href="/members"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 w-full justify-center gap-2 rounded-xl border-border/70 bg-background/70 text-base backdrop-blur-sm sm:w-auto sm:min-w-[11rem] dark:bg-background/50"
                )}
              >
                {messages.home.browseMembers} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
