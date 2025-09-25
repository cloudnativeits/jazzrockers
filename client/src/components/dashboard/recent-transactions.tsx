import { useQuery } from "@tanstack/react-query";
import { ChartCard } from "@/components/ui/chart-card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface RecentTransactionsProps {
  className?: string;
}

interface Transaction {
  studentId: string;
  studentName: string;
  invoiceId: string;
  courseName: string;
  paymentDate: string;
  amount: number;
  status: string;
}

export function RecentTransactions({ className }: RecentTransactionsProps) {
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/recent-transactions"],
  });

  if (isLoading) {
    return (
      <ChartCard 
        title="Recent Transactions" 
        actions={
          <Button variant="link" size="sm">View All</Button>
        }
        className={className}
      >
        <div className="animate-pulse space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-neutral-200 rounded-full mr-3"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                  <div className="h-3 w-16 bg-neutral-200 rounded"></div>
                </div>
              </div>
              <div className="h-4 w-16 bg-neutral-200 rounded"></div>
            </div>
          ))}
        </div>
      </ChartCard>
    );
  }

  if (error) {
    return (
      <ChartCard 
        title="Recent Transactions" 
        actions={
          <Button variant="link" size="sm">View All</Button>
        }
        className={className}
      >
        <div className="p-4 text-red-500">
          Error loading transactions: {error.message}
        </div>
      </ChartCard>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return { variant: "success", label: "Paid" };
      case 'pending':
        return { variant: "warning", label: "Pending" };
      case 'failed':
        return { variant: "destructive", label: "Failed" };
      default:
        return { variant: "outline", label: status };
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getCourseBadgeColor = (courseName: string) => {
    if (courseName.toLowerCase().includes('piano')) return "bg-blue-100 text-blue-800";
    if (courseName.toLowerCase().includes('vocal')) return "bg-purple-100 text-purple-800";
    if (courseName.toLowerCase().includes('guitar')) return "bg-green-100 text-green-800";
    if (courseName.toLowerCase().includes('kathak') || courseName.toLowerCase().includes('dance')) return "bg-orange-100 text-orange-800";
    if (courseName.toLowerCase().includes('drum')) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <ChartCard 
      title="Recent Transactions" 
      actions={
        <Button variant="link" size="sm">View All</Button>
      }
      className={className}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Student</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Invoice ID</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Course</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {data.map((transaction: Transaction, index: number) => (
              <tr key={index} className="hover:bg-neutral-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 rounded-full bg-neutral-200 mr-3">
                      <AvatarFallback className="text-neutral-600 text-xs">
                        {getInitials(transaction.studentName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">{transaction.studentName}</div>
                      <div className="text-xs text-neutral-500">ID: {transaction.studentId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                  {transaction.invoiceId}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge 
                    variant="outline" 
                    className={getCourseBadgeColor(transaction.courseName)}
                  >
                    {transaction.courseName}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                  {format(new Date(transaction.paymentDate), 'MMM dd, yyyy')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 font-medium font-mono">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge 
                    variant={getStatusBadgeVariant(transaction.status).variant as any}
                  >
                    {getStatusBadgeVariant(transaction.status).label}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-neutral-500">
          Showing <span className="font-medium">5</span> of <span className="font-medium">230</span> transactions
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(page > 1 ? page - 1 : 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant={page === 1 ? "default" : "outline"}
            className="h-8 w-8 p-0"
            onClick={() => setPage(1)}
          >
            1
          </Button>
          
          <Button
            variant={page === 2 ? "default" : "outline"}
            className="h-8 w-8 p-0"
            onClick={() => setPage(2)}
          >
            2
          </Button>
          
          <Button
            variant={page === 3 ? "default" : "outline"}
            className="h-8 w-8 p-0"
            onClick={() => setPage(3)}
          >
            3
          </Button>
          
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            disabled
          >
            ...
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </ChartCard>
  );
}
