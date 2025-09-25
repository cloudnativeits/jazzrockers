import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { LocationSelector } from "@/components/dashboard/location-selector";
import { StatCards } from "@/components/dashboard/stat-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StudentDistribution } from "@/components/dashboard/student-distribution";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { TodaysClasses } from "@/components/dashboard/todays-classes";
import { useAuth } from "@/hooks/use-auth";
import { Home } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  const handleLocationChange = (location: string) => {
    console.log("Location changed to:", location);
    // Would trigger a data refresh based on location in a real app
  };

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    console.log("Date range changed:", range);
    // Would trigger a data refresh based on date range in a real app
  };

  const handleExport = () => {
    console.log("Exporting data...");
    // Would handle data export in a real app
  };

  // Define breadcrumbs for the dashboard
  const breadcrumbs = [
    {
      title: "Home",
      href: "/admin/dashboard",
      icon: <Home className="h-4 w-4" />
    },
    {
      title: "Dashboard"
    }
  ];

  return (
    <AppShell>
      <PageHeader 
        title="Dashboard" 
        description={`Welcome back, ${user?.fullName || 'Admin'}. Here's what's happening with Jazzrockers today.`}
        breadcrumbs={breadcrumbs}
      />
      
      <LocationSelector 
        onLocationChange={handleLocationChange}
        onDateRangeChange={handleDateRangeChange}
        onExport={handleExport}
      />
      
      <StatCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <RevenueChart className="lg:col-span-2" />
        <StudentDistribution />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentTransactions className="lg:col-span-2" />
        <TodaysClasses />
      </div>
    </AppShell>
  );
}
