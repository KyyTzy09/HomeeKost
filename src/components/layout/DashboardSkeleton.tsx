export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-6">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-[#e8f0ea] rounded-lg" />
          <div className="h-4 w-48 bg-[#edf3ee] rounded-md" />
        </div>
        <div className="h-9 w-36 bg-[#e8f0ea] rounded-lg" />
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#e4e9e4] rounded-[10px] p-4 space-y-3 shadow-xs"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-[#edf3ee] rounded" />
              <div className="h-7 w-7 bg-[#e8f0ea] rounded-lg" />
            </div>
            <div className="h-7 w-24 bg-[#e8f0ea] rounded-md" />
            <div className="h-3 w-32 bg-[#edf3ee] rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid: Chart & Occupancy Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4">
        <div className="bg-white border border-[#e4e9e4] rounded-[10px] p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <div className="h-4 w-44 bg-[#e8f0ea] rounded" />
              <div className="h-3 w-32 bg-[#edf3ee] rounded" />
            </div>
            <div className="h-6 w-20 bg-[#edf3ee] rounded-md" />
          </div>
          <div className="h-[215px] bg-[#f5f8f5] rounded-xl flex items-center justify-center">
            <div className="text-xs text-[#8a958d] font-medium">
              Memuat grafik pendapatan...
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e4e9e4] rounded-[10px] p-5 space-y-4 shadow-xs">
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-[#e8f0ea] rounded" />
            <div className="h-3 w-24 bg-[#edf3ee] rounded" />
          </div>
          <div className="flex items-center gap-4 py-3">
            <div className="w-32 h-32 rounded-full bg-[#e8f0ea] mx-auto" />
            <div className="flex-1 space-y-3">
              <div className="h-3 bg-[#edf3ee] rounded w-full" />
              <div className="h-3 bg-[#edf3ee] rounded w-4/5" />
              <div className="h-3 bg-[#edf3ee] rounded w-3/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-4">
        <div className="bg-white border border-[#e4e9e4] rounded-[10px] p-5 space-y-4 shadow-xs">
          <div className="h-4 w-36 bg-[#e8f0ea] rounded" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 bg-[#f8faf8] border border-[#eef2ee] rounded-lg"
              />
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e4e9e4] rounded-[10px] p-5 space-y-4 shadow-xs">
          <div className="h-4 w-36 bg-[#e8f0ea] rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 bg-[#f8faf8] rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-[#e8f0ea] shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-[#e8f0ea] rounded" />
                  <div className="h-2.5 w-1/2 bg-[#edf3ee] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
