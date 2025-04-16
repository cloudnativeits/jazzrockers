import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChartCard } from "@/components/ui/chart-card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  className?: string;
}

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export function RevenueChart({ className }: RevenueChartProps) {
  const [period, setPeriod] = useState("12months");
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/revenue-data"],
  });

  if (isLoading) {
    return (
      <ChartCard 
        title="Revenue Overview" 
        period={period}
        onPeriodChange={setPeriod}
        className={className}
      >
        <div className="h-72 w-full flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </ChartCard>
    );
  }

  if (error) {
    return (
      <ChartCard 
        title="Revenue Overview" 
        period={period}
        onPeriodChange={setPeriod}
        className={className}
      >
        <div className="h-72 w-full flex items-center justify-center text-red-500">
          Error loading revenue data: {error.message}
        </div>
      </ChartCard>
    );
  }

  const legendContent = (
    <div className="flex justify-center items-center space-x-6">
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-primary mr-2"></div>
        <span className="text-sm text-neutral-600">Revenue</span>
      </div>
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-secondary mr-2"></div>
        <span className="text-sm text-neutral-600">Expenses</span>
      </div>
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
        <span className="text-sm text-neutral-600">Profit</span>
      </div>
    </div>
  );

  const formatRevenueAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `₹${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  return (
    <ChartCard 
      title="Revenue Overview" 
      period={period}
      onPeriodChange={setPeriod}
      className={className}
      footer={legendContent}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 5,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EB" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9AA5B1' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9AA5B1' }}
              tickFormatter={formatRevenueAmount}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), "Revenue"]}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar dataKey="revenue" fill="#3949AB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
