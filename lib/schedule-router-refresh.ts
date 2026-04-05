import { startTransition } from "react";

/**
 * Defers `router.refresh()` so it runs after the App Router is ready.
 * Prevents: "Internal Next.js error: Router action dispatched before initialization"
 * when refreshing in the same tick as next-auth `update()` or right after `router.push()`.
 */
export function scheduleRouterRefresh(refresh: () => void) {
  startTransition(() => {
    requestAnimationFrame(() => {
      setTimeout(() => refresh(), 0);
    });
  });
}
