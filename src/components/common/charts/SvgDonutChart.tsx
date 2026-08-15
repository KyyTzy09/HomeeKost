export interface DonutSegment {
	label: string;
	value: number;
	color: string;
}

export interface SvgDonutChartProps {
	segments: DonutSegment[];
	size?: number;
	strokeWidth?: number;
	centerTitle?: string;
	centerSubtitle?: string;
	className?: string;
}

export function SvgDonutChart({
	segments,
	size = 148,
	strokeWidth = 14,
	centerTitle,
	centerSubtitle = "Terisi",
	className = "",
}: SvgDonutChartProps) {
	const total = segments.reduce((sum, s) => sum + s.value, 0);
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const center = size / 2;

	// Calculate percentage for center title if not provided
	const firstSegment = segments[0];
	const percentage =
		centerTitle ??
		(total > 0 && firstSegment
			? `${Math.round((firstSegment.value / total) * 100)}%`
			: "0%");

	let accumulatedOffset = 0;

	return (
		<div
			className={`relative inline-flex items-center justify-center select-none ${className}`}
			style={{ width: size, height: size }}
		>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				className="transform -rotate-90"
				aria-label="Donut Chart"
			>
				{/* Background track circle */}
				<circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					stroke="#f0f4f0"
					strokeWidth={strokeWidth}
				/>

				{/* Colored Donut Segments */}
				{segments.map((segment) => {
					if (total === 0 || segment.value === 0) return null;
					const segmentRatio = segment.value / total;
					const strokeDasharray = `${segmentRatio * circumference} ${circumference}`;
					const strokeDashoffset = -accumulatedOffset;
					accumulatedOffset += segmentRatio * circumference;

					return (
						<circle
							key={segment.label}
							cx={center}
							cy={center}
							r={radius}
							fill="none"
							stroke={segment.color}
							strokeWidth={strokeWidth}
							strokeDasharray={strokeDasharray}
							strokeDashoffset={strokeDashoffset}
							strokeLinecap="butt"
							className="transition-all duration-300 ease-out"
						/>
					);
				})}
			</svg>

			{/* Center Text Display */}
			<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
				<strong className="text-[23px] font-bold text-[#26372c] leading-tight">
					{percentage}
				</strong>
				<span className="text-[10.5px] text-[#737873] font-medium">
					{centerSubtitle}
				</span>
			</div>
		</div>
	);
}
