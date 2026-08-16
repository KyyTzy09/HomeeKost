import {
	type ChartDataPoint,
	SvgAreaSplineChart,
} from "../common/charts/SvgAreaSplineChart.tsx";

interface DashboardChartSeries {
	labels: string[];
	income: number[];
	expense: number[];
}

interface RevenueExpenseChartProps {
	period?: string;
	chartData?: {
		sixMonths: DashboardChartSeries;
		twelveMonths: DashboardChartSeries;
	};
}

export function RevenueExpenseChart({
	period = "6 Bulan",
	chartData,
}: RevenueExpenseChartProps) {
	const isTwelveMonths = period === "12 Bulan";
	const activeSeries = isTwelveMonths
		? chartData?.twelveMonths
		: chartData?.sixMonths;

	let data: ChartDataPoint[] = [];
	let maxValue = 20;

	if (activeSeries && activeSeries.labels.length > 0) {
		data = activeSeries.labels.map((lbl, idx) => {
			const incJt = Number(
				((activeSeries.income[idx] || 0) / 1_000_000).toFixed(1),
			);
			const expJt = Number(
				((activeSeries.expense[idx] || 0) / 1_000_000).toFixed(1),
			);
			return {
				label: lbl.split(" ")[0] || lbl,
				primaryValue: incJt,
				secondaryValue: expJt,
				tooltipLabel: lbl,
			};
		});

		const maxInDataset = Math.max(
			...activeSeries.income.map((v) => v / 1_000_000),
			...activeSeries.expense.map((v) => v / 1_000_000),
			10,
		);
		maxValue = Math.ceil(maxInDataset / 5) * 5;
	} else {
		// Fallback clean points
		data = isTwelveMonths
			? [
					{
						label: "Jan",
						primaryValue: 6.8,
						secondaryValue: 2.1,
						tooltipLabel: "Januari",
					},
					{
						label: "Feb",
						primaryValue: 7.2,
						secondaryValue: 2.3,
						tooltipLabel: "Februari",
					},
					{
						label: "Mar",
						primaryValue: 7.0,
						secondaryValue: 2.0,
						tooltipLabel: "Maret",
					},
					{
						label: "Apr",
						primaryValue: 7.5,
						secondaryValue: 2.5,
						tooltipLabel: "April",
					},
					{
						label: "Mei",
						primaryValue: 8.0,
						secondaryValue: 2.8,
						tooltipLabel: "Mei",
					},
					{
						label: "Jun",
						primaryValue: 8.5,
						secondaryValue: 3.0,
						tooltipLabel: "Juni",
					},
					{
						label: "Jul",
						primaryValue: 8.2,
						secondaryValue: 2.6,
						tooltipLabel: "Juli",
					},
					{
						label: "Agu",
						primaryValue: 9.0,
						secondaryValue: 3.1,
						tooltipLabel: "Agustus",
					},
				]
			: [
					{
						label: "Mar",
						primaryValue: 7.0,
						secondaryValue: 2.0,
						tooltipLabel: "Maret",
					},
					{
						label: "Apr",
						primaryValue: 7.5,
						secondaryValue: 2.5,
						tooltipLabel: "April",
					},
					{
						label: "Mei",
						primaryValue: 8.0,
						secondaryValue: 2.8,
						tooltipLabel: "Mei",
					},
					{
						label: "Jun",
						primaryValue: 8.5,
						secondaryValue: 3.0,
						tooltipLabel: "Juni",
					},
					{
						label: "Jul",
						primaryValue: 8.2,
						secondaryValue: 2.6,
						tooltipLabel: "Juli",
					},
					{
						label: "Agu",
						primaryValue: 9.0,
						secondaryValue: 3.1,
						tooltipLabel: "Agustus",
					},
				];
	}

	const step = maxValue / 4;
	const yAxisSteps = [maxValue, step * 3, step * 2, step];

	return (
		<SvgAreaSplineChart
			data={data}
			height={215}
			maxValue={maxValue}
			yAxisUnit="jt"
			yAxisSteps={yAxisSteps}
			primaryColor="#718b78"
			secondaryColor="#c7d0c8"
			showSecondary={true}
		/>
	);
}
