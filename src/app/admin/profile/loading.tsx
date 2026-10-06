import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="mt-3 h-8 w-52" />
        <Skeleton className="mt-2.5 h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="h-96 rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-60 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
