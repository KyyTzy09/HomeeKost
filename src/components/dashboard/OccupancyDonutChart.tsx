import {
	type DonutSegment,
	SvgDonutChart,
} from "../common/charts/SvgDonutChart";

interface OccupancyDonutChartProps {
	occupied?: number;
	vacant?: number;
	maintenance?: number;
}

export function OccupancyDonutChart({
	occupied = 18,
	vacant = 6,
	maintenance = 0,
}: OccupancyDonutChartProps) {
	const segments: DonutSegment[] = [
		{ label: "Terisi", value: occupied, color: "#718b78" },
		{ label: "Kosong", value: vacant, color: "#dce7de" },
		{ label: "Maintenance", value: maintenance, color: "#c8a46b" },
	];

	return (
		<SvgDonutChart
			segments={segments}
			size={148}
			strokeWidth={14}
			centerSubtitle="Terisi"
		/>
	);
}
