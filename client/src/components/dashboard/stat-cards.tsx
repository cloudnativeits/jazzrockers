import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/ui/stat-card";
import { CreditCard, DollarSign, Users, Layers } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardStats {
  totalRevenue: number;
  pendingPayments: number;
  activeStudents: number;
  activeBatches: number;
}

export function StatCards() {
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                <div className="h-8 w-32 bg-neutral-200 rounded"></div>
              </div>
              <div className="rounded-full p-2 bg-neutral-200 h-10 w-10"></div>
            </div>
            <div className="h-4 w-36 bg-neutral-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-600">Error loading dashboard stats: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatCard
        title="Total Revenue"
        value={formatCurrency(data?.totalRevenue || 0)}
        icon={DollarSign}
        iconColor="text-green-600"
        iconBgColor="bg-green-100"
        trend={{
          value: 12.5,
          label: "vs last month",
          positive: true
        }}
      />
      
      <StatCard
        title="Active Students"
        value={data?.activeStudents || 0}
        icon={Users}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
        trend={{
          value: 3.2,
          label: "vs last month",
          positive: true
        }}
      />
      
      <StatCard
        title="Active Batches"
        value={data?.activeBatches || 0}
        icon={Layers}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-100"
        trend={{
          value: 5.7,
          label: "vs last month",
          positive: true
        }}
      />
      
      <StatCard
        title="Pending Payments"
        value={formatCurrency(data?.pendingPayments || 0)}
        icon={CreditCard}
        iconColor="text-amber-600"
        iconBgColor="bg-amber-100"
        trend={{
          value: 8.3,
          label: "vs last month",
          positive: false
        }}
      />
    </div>
  );
}