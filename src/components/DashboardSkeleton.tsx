import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-foreground">
      <div className="container max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <div className="flex gap-3"><Skeleton className="h-9 w-9" /><Skeleton className="h-9 w-9" /><Skeleton className="h-9 w-9" /></div>
      </div>
    </header>
    <main className="container max-w-7xl mx-auto px-6 py-12 space-y-10">
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-[420px] lg:col-span-2" />
        <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
    </main>
  </div>
);