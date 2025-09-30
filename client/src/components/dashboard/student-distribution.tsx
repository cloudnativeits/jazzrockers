import { useQuery } from "@tanstack/react-query";
import { ChartCard } from "@/components/ui/chart-card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StudentDistributionProps {
  className?: string;
}

const COLORS = ["#3949AB", "#F57C00", "#48BB78", "#E91E63", "#009688", "#9C27B0"];

export function StudentDistribution({ className }: StudentDistributionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/student-distribution"],
  });

  if (isLoading) {
    return (
      <ChartCard title="Student Distribution" className={className}>
        <div className="h-52 w-full flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </ChartCard>
    );
  }

  if (error) {
    return (
      <ChartCard title="Student Distribution" className={className}>
        <div className="h-52 w-full flex items-center justify-center text-red-500">
          Error loading student distribution: {(error as Error).message}
        </div>
      </ChartCard>
    );
  }

  // Transform API response into chartData
  const chartData = Object.entries(data || {})
    .filter(([key]) => key !== "TOTAL")
    .map(([key, value], index) => ({
      name: `${key.charAt(0).toUpperCase()}${key.slice(1).toLowerCase()} Courses`,
      value: value as number,
      color: COLORS[index % COLORS.length],
      key,
    }));

  const calculatePercentage = (value: number) => {
    return data?.TOTAL ? Math.round((value / data.TOTAL) * 100) : 0;
  };

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? "start" : "end"} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartCard title="Student Distribution" className={className}>
      <div className="h-52 w-full flex justify-center items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              innerRadius={30}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value, "Students"]} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-3 mt-4">
        {chartData.map((entry, index) => (
          <div key={entry.key} className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="h-3 w-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm text-neutral-600">{entry.name}</span>
            </div>
            <span className="text-sm font-medium">
              {calculatePercentage(entry.value)}% ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
