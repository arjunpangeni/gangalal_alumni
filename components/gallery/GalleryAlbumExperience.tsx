"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Images,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { buildCloudinaryUrl } from "@/lib/cloudinary-url";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type GalleryPhoto = { url: string; caption?: string };

function thumbSrc(url: string) {
  return buildCloudinaryUrl(url, { width: 640, height: 640, crop: "fill", quality: "auto" });
}

function lightboxSrc(url: string) {
  return buildCloudinaryUrl(url, { width: 2400, crop: "limit", quality: "auto" });
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.35;

export function GalleryAlbumExperience({
  title,
  description,
  photos,
}: {
  title: string;
  description?: string;
  photos: GalleryPhoto[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<{ dist: number; baseScale: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (open === null || photos.length === 0) return;
      setOpen((i) => {
        if (i === null) return i;
        const n = photos.length;
        return (i + dir + n) % n;
      });
    },
    [open, photos.length]
  );

  const resetZoom = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => {
      const n = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s + delta));
      if (n === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return n;
    });
  }, []);

  useEffect(() => {
    resetZoom();
  }, [open, resetZoom]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomBy(ZOOM_STEP);
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomBy(-ZOOM_STEP);
      }
      if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go, zoomBy, resetZoom]);

  useEffect(() => {
    if (open === null) return;
    const el = viewerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoomBy(delta * 1.2);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, zoomBy]);

  useEffect(() => {
    if (open === null || !thumbStripRef.current) return;
    const thumb = thumbStripRef.current.querySelector(`[data-thumb-index="${open}"]`);
    thumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [open]);

  const progressPct = open !== null && photos.length ? ((open + 1) / photos.length) * 100 : 0;

  function onPointerDownPan(e: React.PointerEvent) {
    if (scale <= 1) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragRef.current = { px: e.clientX, py: e.clientY, ox: pan.x, oy: pan.y };
  }

  function onPointerMovePan(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    setPan({ x: d.ox + dx, y: d.oy + dy });
  }

  function onPointerUpPan(e: React.PointerEvent) {
    dragRef.current = null;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onImageDoubleClick() {
    setScale((s) => {
      if (s > MIN_ZOOM) {
        setPan({ x: 0, y: 0 });
        return MIN_ZOOM;
      }
      return 2;
    });
  }

  function touchDistance(t: React.TouchList) {
    if (t.length < 2) return 0;
    const a = t[0];
    const b = t[1];
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  }

  if (photos.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Images className="mx-auto mb-4 size-14 text-muted-foreground/40" />
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
        <p className="mt-6 text-sm text-muted-foreground">No photos in this album yet.</p>
        <Button
          variant="outline"
          className="mt-8"
          nativeButton={false}
          render={<Link href="/gallery">← All albums</Link>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh]">
      <div className="border-b border-border/60 bg-gradient-to-b from-muted/50 to-background dark:from-muted/25">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            className="-ml-2 mb-5 text-muted-foreground hover:text-foreground"
            render={
              <Link href="/gallery" className="inline-flex items-center gap-1">
                <ChevronLeft className="size-4" />
                Gallery
              </Link>
            }
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p> : null}
          <p className="mt-3 text-xs text-muted-foreground sm:text-sm">
            {photos.length} photo{photos.length === 1 ? "" : "s"} · Tap to view · Pinch or scroll to zoom · Drag when zoomed
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <button
              key={`${photo.url}-${i}`}
              type="button"
              onClick={() => setOpen(i)}
              className={cn(
                "group relative aspect-square w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60 transition-all",
                "hover:z-[1] hover:ring-2 hover:ring-primary/50 hover:shadow-lg",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              )}
              aria-label={`Open photo ${i + 1} of ${photos.length}`}
            >
              <Image
                src={thumbSrc(photo.url)}
                alt={photo.caption || `Photo ${i + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              {photo.caption ? (
                <p className="absolute bottom-0 left-0 right-0 line-clamp-2 bg-black/55 px-2 py-1.5 text-left text-[11px] font-medium text-white backdrop-blur-sm sm:text-xs">
                  {photo.caption}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open !== null ? (
          <motion.div
            key="gallery-lightbox"
            role="dialog"
            aria-modal={true}
            aria-label="Photo viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col bg-zinc-950/95 backdrop-blur-md"
          >
            <div className="h-0.5 w-full bg-zinc-800">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/70"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-2 py-2 sm:px-4 sm:py-3">
              <div className="min-w-0 flex-1 px-1">
                <p className="truncate text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-zinc-400">
                  {open + 1} / {photos.length}
                  {scale > 1 ? <span className="ml-2 tabular-nums text-zinc-500">· {Math.round(scale * 100)}%</span> : null}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => zoomBy(-ZOOM_STEP)}
                  className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
                  aria-label="Zoom out"
                  disabled={scale <= MIN_ZOOM}
                >
                  <ZoomOut className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => zoomBy(ZOOM_STEP)}
                  className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
                  aria-label="Zoom in"
                  disabled={scale >= MAX_ZOOM}
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="hidden items-center justify-center rounded-lg bg-white/10 px-2 py-2 text-xs font-medium text-white transition hover:bg-white/20 sm:flex"
                  aria-label="Reset zoom"
                  title="Reset zoom"
                >
                  <Maximize2 className="size-4" />
                </button>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={() => setOpen(null)}
                  className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div
              className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center"
              onClick={() => setOpen(null)}
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  pinchRef.current = { dist: touchDistance(e.touches), baseScale: scale };
                  return;
                }
                pinchRef.current = null;
                touchStartX.current = e.changedTouches[0]?.clientX ?? null;
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 2 && pinchRef.current) {
                  e.preventDefault();
                  const d = touchDistance(e.touches);
                  if (d > 0 && pinchRef.current.dist > 0) {
                    const ratio = d / pinchRef.current.dist;
                    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchRef.current.baseScale * ratio));
                    setScale(next);
                    if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
                  }
                  return;
                }
              }}
              onTouchEnd={(e) => {
                pinchRef.current = null;
                const start = touchStartX.current;
                touchStartX.current = null;
                if (scale > MIN_ZOOM) return;
                if (start === null) return;
                const end = e.changedTouches[0]?.clientX ?? start;
                const dx = end - start;
                if (dx > 70) go(-1);
                else if (dx < -70) go(1);
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-1 z-10 flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 sm:left-3"
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-1 z-10 flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 sm:right-3"
                aria-label="Next photo"
              >
                <ChevronRight className="size-6" />
              </button>

              <div
                ref={viewerRef}
                className={cn(
                  "flex max-h-full max-w-full flex-col items-center justify-center overflow-hidden p-2 sm:p-4",
                  scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                )}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={onPointerDownPan}
                onPointerMove={onPointerMovePan}
                onPointerUp={onPointerUpPan}
                onPointerCancel={onPointerUpPan}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={open}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.18 }}
                    className="relative flex max-h-[min(72dvh,100%)] max-w-full items-center justify-center"
                  >
                    <div
                      className="flex max-h-[min(72dvh,100%)] max-w-full items-center justify-center will-change-transform"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        transition: dragging ? "none" : "transform 0.1s ease-out",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic Cloudinary URL */}
                      <img
                        src={lightboxSrc(photos[open]!.url)}
                        alt={photos[open]?.caption || `Photo ${open + 1}`}
                        className="h-auto max-h-[min(72dvh,100%)] w-auto max-w-[min(calc(100vw-5rem),1400px)] object-contain select-none shadow-2xl lg:max-w-[min(calc(100vw-8rem),1700px)]"
                        draggable={false}
                        onDoubleClick={onImageDoubleClick}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
                {photos[open]?.caption ? (
                  <p className="mt-3 max-w-xl text-center text-sm text-zinc-300">{photos[open]?.caption}</p>
                ) : null}
                <p className="mt-2 hidden text-center text-[11px] text-zinc-500 sm:block">
                  Scroll to zoom · double-click image to reset or 2× · +/- keys
                </p>
              </div>
            </div>

            <div
              ref={thumbStripRef}
              className="flex gap-2 overflow-x-auto border-t border-white/10 bg-black/40 px-3 py-3 sm:px-4"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((p, i) => (
                <button
                  key={`thumb-${i}`}
                  type="button"
                  data-thumb-index={i}
                  onClick={() => setOpen(i)}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition sm:h-16 sm:w-16",
                    i === open ? "ring-primary opacity-100" : "ring-transparent opacity-55 hover:opacity-90"
                  )}
                  aria-label={`Show photo ${i + 1}`}
                >
                  <Image src={thumbSrc(p.url)} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
