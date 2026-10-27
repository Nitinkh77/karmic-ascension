/** Shown instantly while an admin page loads, so clicks feel responsive. */
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-6">
      <span className="sr-only">Loading…</span>
      <div className="h-9 w-64 rounded-lg bg-sand" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-parchment" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-parchment" />
    </div>
  );
}
