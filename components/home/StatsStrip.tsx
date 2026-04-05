"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  label: string;
  value: number;
  suffix?: string;
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setCount(start);
      if (start >= value) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export function StatsStrip({ stats, bare }: { stats: Stat[]; bare?: boolean }) {
  const grid = (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="rounded-2xl border border-border/60 bg-card/95 px-3 py-4 text-center shadow-card ring-1 ring-primary/[0.06] transition-surface dark:border-border/50 dark:bg-card/85 sm:rounded-3xl sm:px-4 sm:py-5"
        >
          <p className="text-2xl font-bold tabular-nums gradient-text sm:text-3xl md:text-4xl">
            <Counter value={stat.value} suffix={stat.suffix} />
          </p>
          <p className="mt-1.5 text-xs font-medium leading-snug text-muted-foreground sm:text-sm">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );

  if (bare) return grid;

  return (
    <section className="border-y border-border/60 bg-muted/30 py-10 dark:border-border/50 dark:bg-muted/20 sm:py-12">
      <div className="container mx-auto max-w-7xl px-4 lg:px-3">{grid}</div>
    </section>
  );
}
