"use client";

import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import { NETWORK_NAME } from "@/lib/brand";

export function HeroSection({ className }: { className?: string }) {
  const { data: session, status } = useSession();

  return (
    <section className={cn("relative overflow-hidden py-20 md:py-28 lg:py-36", className)}>
      {/* Background gradients */}
      <div className="absolute inset-0 gradient-hero-bg" />
      <div className="absolute -top-40 -right-40 size-96 rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-500/10" />
      <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-500/10" />

      <div className="relative container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-4 py-1.5 text-sm font-medium text-foreground shadow-card backdrop-blur-md transition-surface dark:border-border/55 dark:bg-card/80"
        >
          <Sparkles className="size-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
          <span>Nepal · Connect · Grow</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-heading mx-auto max-w-4xl leading-tight"
        >
          {NETWORK_NAME}{" "}
          <span className="gradient-text">Network Awaits</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Reconnect, mentor, and discover opportunities in one trusted network.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {status === "loading" ? (
            <div className="h-11 w-44 rounded-lg bg-muted animate-pulse" />
          ) : session?.user ? (
            <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "gradient-primary text-white border-0 shadow-lg shadow-violet-500/25")}>
              Go to Dashboard <ArrowRight className="ml-2 size-4" />
            </Link>
          ) : (
            <Button
              size="lg"
              onClick={() => signIn("google")}
              className="gradient-primary text-white border-0 shadow-lg shadow-violet-500/25"
            >
              <GraduationCap className="mr-2 size-5" />
              Join with Google
            </Button>
          )}
          <Link href="/members" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Browse Members <ArrowRight className="ml-2 size-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
