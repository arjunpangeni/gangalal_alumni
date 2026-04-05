/**
 * Shown from route `loading.tsx` while dashboard/admin server components resolve.
 */
export function DashboardMainSkeleton() {
  return (
    <div className="max-w-6xl animate-pulse space-y-8 px-0" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <div className="h-8 w-44 rounded-lg bg-muted" />
        <div className="h-4 max-w-lg rounded-md bg-muted/70" />
        <div className="h-4 max-w-md rounded-md bg-muted/50" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl border border-border/50 bg-muted/25" />
        ))}
      </div>
    </div>
  );
}
