// Skeleton shown while any /(app)/* page is fetching server data.
export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 w-64 bg-cream-soft rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-cream-soft rounded-xl" />
        ))}
      </div>
      <div className="h-5 w-32 bg-cream-soft rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-cream-soft rounded-xl" />
        ))}
      </div>
    </div>
  );
}
