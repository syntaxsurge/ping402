import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div id="content" tabIndex={-1} className="container-page py-10 sm:py-12">
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
