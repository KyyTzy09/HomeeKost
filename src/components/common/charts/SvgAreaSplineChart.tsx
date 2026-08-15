import { useId, useState } from "react";

export interface ChartDataPoint {
	label: string;
	primaryValue: number;
	secondaryValue?: number;
	tooltipLabel?: string;
}

export interface SvgAreaSplineChartProps {
	data: ChartDataPoint[];
	width?: number;
	height?: number;
	maxValue?: number;
	yAxisUnit?: string;
	yAxisSteps?: number[];
	primaryColor?: string;
	secondaryColor?: string;
	showSecondary?: boolean;
	className?: string;
}

export function SvgAreaSplineChart({
	data,
	width = 700,
	height = 215,
	maxValue = 20,
	yAxisUnit = "jt",
	yAxisSteps = [20, 15, 10, 5],
	primaryColor = "#718b78",
	secondaryColor = "#c7d0c8",
	showSecondary = true,
	className = "",
}: SvgAreaSplineChartProps) {
	const gradientId = useId().replace(/:/g, "_");
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const paddingLeft = 45;
	const paddingRight = 20;
	const paddingTop = 25;
	const paddingBottom = 55;

	const plotWidth = width - paddingLeft - paddingRight;
	const plotHeight = height - paddingTop - paddingBottom;

	// Coordinate mapping helpers
	const getX = (index: number) => {
		if (data.length <= 1) return paddingLeft + plotWidth / 2;
		return paddingLeft + (index / (data.length - 1)) * plotWidth;
	};

	const getY = (val: number) => {
		const normalized = Math.min(Math.max(val / maxValue, 0), 1);
		return paddingTop + plotHeight - normalized * plotHeight;
	};

	// Generate smooth cubic bezier SVG path
	const generateSplinePath = (
		getValue: (d: ChartDataPoint) => number | undefined,
	) => {
		if (data.length === 0) return "";
		const points = data.map((d, i) => ({
			x: getX(i),
			y: getY(getValue(d) ?? 0),
		}));

		if (points.length === 1) {
			return `M ${points[0].x},${points[0].y}`;
		}

		let path = `M ${points[0].x},${points[0].y}`;

		for (let i = 1; i < points.length; i++) {
			const prev = points[i - 1];
			const curr = points[i];
			const dx = curr.x - prev.x;
			const cp1x = prev.x + dx * 0.45;
			const cp1y = prev.y;
			const cp2x = curr.x - dx * 0.45;
			const cp2y = curr.y;
			path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
		}

		return path;
	};

	const primaryLinePath = generateSplinePath((d) => d.primaryValue);
	const baselineY = paddingTop + plotHeight;
	const areaPath =
		data.length > 0
			? `${primaryLinePath} L ${getX(data.length - 1)},${baselineY} L ${getX(0)},${baselineY} Z`
			: "";

	const secondaryPoints = data
		.filter((d) => d.secondaryValue !== undefined)
		.map((d, i) => `${getX(i)},${getY(d.secondaryValue ?? 0)}`)
		.join(" ");

	return (
		<div className={`relative w-full h-[${height}px] select-none ${className}`}>
			<svg
				className="w-full h-full overflow-visible"
				viewBox={`0 0 ${width} ${height}`}
				preserveAspectRatio="none"
				aria-label="Area and Line Chart"
			>
				<defs>
					<linearGradient
						id={`areaGrad_${gradientId}`}
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop offset="0%" stopColor={primaryColor} stopOpacity="0.22" />
						<stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
					</linearGradient>
				</defs>

				{/* Horizontal Gridlines & Y-Axis Labels */}
				{yAxisSteps.map((step) => {
					const y = getY(step);
					return (
						<g key={step}>
							<line
								x1={paddingLeft}
								y1={y}
								x2={width - paddingRight}
								y2={y}
								stroke="#edf0ed"
								strokeWidth="1"
							/>
							<text
								x={paddingLeft - 10}
								y={y + 4}
								textAnchor="end"
								fill="#8a908b"
								fontSize="9"
								fontFamily="Inter, sans-serif"
							>
								{step}
								{yAxisUnit}
							</text>
						</g>
					);
				})}

				{/* Primary Area Fill */}
				{areaPath && (
					<path d={areaPath} fill={`url(#areaGrad_${gradientId})`} />
				)}

				{/* Primary Smooth Curve Line */}
				{primaryLinePath && (
					<path
						d={primaryLinePath}
						fill="none"
						stroke={primaryColor}
						strokeWidth="2.75"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				)}

				{/* Secondary Dashed Polyline (e.g. Pengeluaran) */}
				{showSecondary && secondaryPoints && (
					<polyline
						points={secondaryPoints}
						fill="none"
						stroke={secondaryColor}
						strokeWidth="2"
						strokeDasharray="4 5"
					/>
				)}

				{/* X-Axis Month / Date Labels */}
				{data.map((d, i) => {
					const x = getX(i);
					return (
						<text
							key={d.label}
							x={x}
							y={height - 30}
							textAnchor="middle"
							fill="#8a908b"
							fontSize="9.5"
							fontFamily="Inter, sans-serif"
						>
							{d.label}
						</text>
					);
				})}

				{/* Interactive Hover Dots */}
				{data.map((d, i) => {
					const x = getX(i);
					const y = getY(d.primaryValue);
					const isHovered = hoveredIndex === i;

					return (
						<g
							key={d.label}
							onMouseEnter={() => setHoveredIndex(i)}
							onMouseLeave={() => setHoveredIndex(null)}
							style={{ cursor: "pointer" }}
						>
							{/* Invisible wider target for easier hover */}
							<rect
								x={x - 15}
								y={paddingTop}
								width={30}
								height={plotHeight}
								fill="transparent"
							/>
							{/* Visible Dot */}
							<circle
								cx={x}
								cy={y}
								r={isHovered ? 5.5 : 3.5}
								fill={isHovered ? "#3d5445" : primaryColor}
								stroke="#ffffff"
								strokeWidth={isHovered ? 2.5 : 1.5}
								className="transition-all duration-150"
							/>
						</g>
					);
				})}
			</svg>

			{/* Floating Tooltip when hovering over a point */}
			{hoveredIndex !== null && data[hoveredIndex] && (
				<div
					className="absolute top-2 z-20 bg-[#253129] border border-[#3b4c40] text-white py-2 px-3 rounded-lg shadow-xl text-xs pointer-events-none transition-all duration-100 -translate-x-1/2"
					style={{
						left: `${(getX(hoveredIndex) / width) * 100}%`,
					}}
				>
					<div className="font-semibold text-[#c7d5c9] mb-1">
						{data[hoveredIndex].tooltipLabel || data[hoveredIndex].label}
					</div>
					<div className="text-[#a4cca8] flex items-center justify-between gap-3">
						<span>Pendapatan:</span>
						<strong className="text-white">
							Rp{data[hoveredIndex].primaryValue} jt
						</strong>
					</div>
					{data[hoveredIndex].secondaryValue !== undefined && (
						<div className="text-[#c7d0c8] flex items-center justify-between gap-3">
							<span>Pengeluaran:</span>
							<strong className="text-[#edf1ed]">
								Rp{data[hoveredIndex].secondaryValue} jt
							</strong>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
