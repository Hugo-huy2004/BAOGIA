import { Skeleton } from './Skeleton';

export function BioProfileSkeleton() {
  return (
    <main className="min-h-[100dvh] w-full bg-black flex flex-col items-center justify-end pb-12 px-6">
      <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-4 px-4 pb-10">
        <Skeleton className="h-8 w-48 rounded-md mb-2 bg-zinc-800" />
        <Skeleton className="h-4 w-32 rounded-md bg-zinc-800" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-2 w-2 rounded-full bg-zinc-800" />
          <Skeleton className="h-2 w-20 rounded-md bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Navigation Skeleton */}
      <div className="flex items-center justify-between mt-4 md:mt-0">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>

      {/* Main Stats/Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="flex-1 w-full space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    </div>
  );
}

export function TabFallbackSkeleton() {
  return (
    <div className="flex flex-col space-y-4 p-4 h-full">
      <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}
