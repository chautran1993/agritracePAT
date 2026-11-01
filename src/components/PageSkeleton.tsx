export default function PageSkeleton() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}
