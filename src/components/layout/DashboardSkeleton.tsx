import { Card } from "../../common/shadcn/card.tsx";
import { Skeleton } from "../../common/shadcn/skeleton.tsx";

export function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header Skeleton */}
			<div className="flex justify-between items-end mb-6">
				<div className="space-y-2">
					<Skeleton className="h-7 w-64 rounded-lg" />
					<Skeleton className="h-4 w-48 rounded-md" />
				</div>
				<Skeleton className="h-9 w-36 rounded-lg" />
			</div>

			{/* 4 Stat Cards Skeleton */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i} className="p-4 space-y-3 shadow-xs border-[#e4e9e4]">
						<div className="flex justify-between items-center">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-7 w-7 rounded-lg" />
						</div>
						<Skeleton className="h-7 w-24 rounded-md" />
						<Skeleton className="h-3 w-32" />
					</Card>
				))}
			</div>

			{/* Main Grid: Chart & Occupancy Skeleton */}
			<div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4">
				<Card className="p-5 space-y-4 shadow-xs border-[#e4e9e4]">
					<div className="flex justify-between items-start">
						<div className="space-y-1.5">
							<Skeleton className="h-4 w-44" />
							<Skeleton className="h-3 w-32" />
						</div>
						<Skeleton className="h-6 w-20 rounded-md" />
					</div>
					<div className="h-[215px] bg-[#f5f8f5] rounded-xl flex items-center justify-center">
						<div className="text-xs text-[#8a958d] font-medium">
							Memuat grafik pendapatan...
						</div>
					</div>
				</Card>

				<Card className="p-5 space-y-4 shadow-xs border-[#e4e9e4]">
					<div className="space-y-1.5">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-24" />
					</div>
					<div className="flex items-center gap-4 py-3">
						<Skeleton className="w-32 h-32 rounded-full mx-auto" />
						<div className="flex-1 space-y-3">
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-4/5" />
							<Skeleton className="h-3 w-3/5" />
						</div>
					</div>
				</Card>
			</div>

			{/* Bottom Grid: Tables Skeleton */}
			<div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-4">
				<Card className="p-5 space-y-4 shadow-xs border-[#e4e9e4]">
					<Skeleton className="h-4 w-36" />
					<div className="space-y-2.5">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-10 w-full rounded-lg" />
						))}
					</div>
				</Card>

				<Card className="p-5 space-y-4 shadow-xs border-[#e4e9e4]">
					<Skeleton className="h-4 w-36" />
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="flex items-center gap-3 p-2 bg-[#f8faf8] rounded-lg"
							>
								<Skeleton className="w-8 h-8 rounded-lg shrink-0" />
								<div className="flex-1 space-y-1.5">
									<Skeleton className="h-3 w-3/4" />
									<Skeleton className="h-2.5 w-1/2" />
								</div>
							</div>
						))}
					</div>
				</Card>
			</div>
		</div>
	);
}
