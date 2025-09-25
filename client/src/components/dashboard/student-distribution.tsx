import { useQuery } from "@tanstack/react-query";
import { ChartCard } from "@/components/ui/chart-card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StudentDistributionProps {
  className?: string;
}

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
          Error loading student distribution: {error.message}
        </div>
      </ChartCard>
    );
  }

  const chartData = [
    { name: "Music Courses", value: data?.music || 0, color: "#3949AB" },
    { name: "Dance Courses", value: data?.dance || 0, color: "#F57C00" },
    { name: "Art Courses", value: data?.art || 0, color: "#48BB78" }
  ];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const calculatePercentage = (value: number) => {
    return data?.total ? Math.round((value / data.total) * 100) : 0;
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

      {/* <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center mt-24">
          <p className="text-3xl font-bold text-neutral-900">{data?.total || 0}</p>
          <p className="text-xs text-neutral-500">Total Students</p>
        </div>
      </div> */}
      
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-primary mr-2"></div>
            <span className="text-sm text-neutral-600">Music Courses</span>
          </div>
          <span className="text-sm font-medium">{calculatePercentage(data?.music || 0)}% ({data?.music || 0})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-secondary mr-2"></div>
            <span className="text-sm text-neutral-600">Dance Courses</span>
          </div>
          <span className="text-sm font-medium">{calculatePercentage(data?.dance || 0)}% ({data?.dance || 0})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-neutral-600">Art Courses</span>
          </div>
          <span className="text-sm font-medium">{calculatePercentage(data?.art || 0)}% ({data?.art || 0})</span>
        </div>
      </div>
    </ChartCard>
  );
}
