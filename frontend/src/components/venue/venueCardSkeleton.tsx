
import { Skeleton } from "../../components/ui/skeleton";

export default function VenueCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      {/* Image */}
      <div className="relative">
        <Skeleton className="h-44 w-full rounded-none sm:h-48" />

        {/* Category badge */}
        <Skeleton className="absolute left-3 top-3 h-6 w-20 rounded-full bg-white/40" />
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Name */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>

        {/* Location, resource count, rating */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
        </div>

        {/* Facilities */}
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>

        {/* Price and detail */}
        <div className="flex items-end justify-between border-t border-line pt-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-32" />
          </div>

          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
