export function TaskCardSkeleton() {
  return (
    <div className="mx-4 mb-3 rounded-2xl glass p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded-full shimmer-bg mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 shimmer-bg rounded-lg w-3/4" />
          <div className="h-3 shimmer-bg rounded-lg w-1/2" />
        </div>
        <div className="w-7 h-7 rounded-xl shimmer-bg" />
      </div>
    </div>
  );
}
