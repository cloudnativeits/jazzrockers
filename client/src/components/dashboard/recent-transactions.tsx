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

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  // ... other student fields
}

interface Payment {
  id: number;
  paymentId: string;
  studentId: number;
  amount: number;
  paymentDate: string;
  status: string;
  paymentMethod?: string;
  remarks?: string;
}

export function RecentTransactions({ className }: RecentTransactionsProps) {
  const [page, setPage] = useState(1);
  
  // Fetch payments and students data
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/studentPayments"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Transform payments data into transactions
  const transactions: Transaction[] = payments
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 10)
    .map(payment => {
      const student = students.find(s => s.id === payment.studentId);
      
      return {
        studentId: student?.studentId || 'N/A',
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
        invoiceId: payment.paymentId, // Using paymentId as invoiceId for display
        courseName: 'General Payment', // You might want to get this from invoices
        paymentDate: payment.paymentDate,
        amount: Number(payment.amount),
        status: payment.status
      };
    });

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return { variant: "success", label: "Paid" };
      case 'pending':
        return { variant: "warning", label: "Pending" };
      case 'failed':
        return { variant: "destructive", label: "Failed" };
      case 'partially_paid':
        return { variant: "outline", label: "Partially Paid" };
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
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Payment ID</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Course</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {transactions.map((transaction, index) => (
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
          Showing <span className="font-medium">{transactions.length}</span> recent transactions
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