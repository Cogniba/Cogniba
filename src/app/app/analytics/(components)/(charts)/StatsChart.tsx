import AnalyticsChart from "../AnalyticsChart";
import { ChartConfig } from "@/components/ui/chart";
import { DailyGamesData } from "@/database/queries/games/getDailyGamesData";

const chartConfig = {
  correctHits: {
    label: "Correct",
    color: "var(--green-500)",
  },
  incorrectHits: {
    label: "Incorrect",
    color: "var(--red-500)",
  },
  missedHits: {
    label: "Missed",
    color: "var(--yellow-500)",
  },
} satisfies ChartConfig;

interface StatsChartProps {
  data: DailyGamesData | null;
}

export default function StatsChart({ data }: StatsChartProps) {
  return (
    <AnalyticsChart
      data={data}
      chartConfig={chartConfig}
      title="Average game stats"
      description="Showing the average stats per day"
      names={["correctHits", "incorrectHits", "missedHits"]}
    />
  );
}