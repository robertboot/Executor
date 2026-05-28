// Root-level loading boundary. Triggers on first navigation to any route
// that takes more than a frame to fetch its server data.
export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted">
        <span className="inline-block h-3 w-3 rounded-full bg-forest animate-pulse" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}
