import { Skeleton } from "@/components/ui/skeleton";

export const ChatSkeleton = () => (
  <div className="p-3 flex items-center gap-3">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2 flex-1">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
);
