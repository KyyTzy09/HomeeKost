import {
	type ChartDataPoint,
	SvgAreaSplineChart,
} from "../common/charts/SvgAreaSplineChart";

interface RevenueExpenseChartProps {
	period?: string;
}

export function RevenueExpenseChart({
	period = "6 Bulan",
}: RevenueExpenseChartProps) {
	const isTwelveMonths = period === "12 Bulan";

	const data: ChartDataPoint[] = isTwelveMonths
		? [
				{
					label: "Sep",
					primaryValue: 12.5,
					secondaryValue: 7.5,
					tooltipLabel: "September 2025",
				},
				{
					label: "Okt",
					primaryValue: 13.0,
					secondaryValue: 7.8,
					tooltipLabel: "Oktober 2025",
				},
				{
					label: "Nov",
					primaryValue: 14.1,
					secondaryValue: 8.2,
					tooltipLabel: "November 2025",
				},
				{
					label: "Des",
					primaryValue: 14.8,
					secondaryValue: 8.5,
					tooltipLabel: "Desember 2025",
				},
				{
					label: "Jan",
					primaryValue: 15.0,
					secondaryValue: 8.0,
					tooltipLabel: "Januari 2026",
				},
				{
					label: "Feb",
					primaryValue: 14.5,
					secondaryValue: 8.3,
					tooltipLabel: "Februari 2026",
				},
				{
					label: "Mar",
					primaryValue: 14.2,
					secondaryValue: 8.1,
					tooltipLabel: "Maret 2026",
				},
				{
					label: "Apr",
					primaryValue: 15.8,
					secondaryValue: 8.5,
					tooltipLabel: "April 2026",
				},
				{
					label: "Mei",
					primaryValue: 15.1,
					secondaryValue: 9.2,
					tooltipLabel: "Mei 2026",
				},
				{
					label: "Jun",
					primaryValue: 17.5,
					secondaryValue: 8.8,
					tooltipLabel: "Juni 2026",
				},
				{
					label: "Jul",
					primaryValue: 16.8,
					secondaryValue: 9.5,
					tooltipLabel: "Juli 2026",
				},
				{
					label: "Agu",
					primaryValue: 19.4,
					secondaryValue: 10.2,
					tooltipLabel: "Agustus 2026",
				},
			]
		: [
				{
					label: "Mar",
					primaryValue: 14.2,
					secondaryValue: 8.1,
					tooltipLabel: "Maret 2026",
				},
				{
					label: "Apr",
					primaryValue: 15.8,
					secondaryValue: 8.5,
					tooltipLabel: "April 2026",
				},
				{
					label: "Mei",
					primaryValue: 15.1,
					secondaryValue: 9.2,
					tooltipLabel: "Mei 2026",
				},
				{
					label: "Jun",
					primaryValue: 17.5,
					secondaryValue: 8.8,
					tooltipLabel: "Juni 2026",
				},
				{
					label: "Jul",
					primaryValue: 16.8,
					secondaryValue: 9.5,
					tooltipLabel: "Juli 2026",
				},
				{
					label: "Agu",
					primaryValue: 19.4,
					secondaryValue: 10.2,
					tooltipLabel: "Agustus 2026",
				},
			];

	return (
		<SvgAreaSplineChart
			data={data}
			height={215}
			maxValue={20}
			yAxisUnit="jt"
			yAxisSteps={[20, 15, 10, 5]}
			primaryColor="#718b78"
			secondaryColor="#c7d0c8"
			showSecondary={true}
		/>
	);
}
