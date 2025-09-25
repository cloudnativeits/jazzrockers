import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, Download, Receipt, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Payment, Student, Enrollment } from "@shared/schema";
import { formatCurrency, generateInvoiceId } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import React from "react";

export default function BranchAdminStudentEnrollments() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch payments
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  // Fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch enrollments
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
  });

  // Filter enrollments based on active tab
  const filteredEnrollments = React.useMemo(() => {
    return activeTab === "all"
      ? enrollments
      : enrollments.filter(enrollment => enrollment.status === activeTab);
  }, [enrollments, activeTab]);

 // Get student name by id
  const getStudentName = (studentId: number): string => {
    const student = students.find((s: any) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : `Student ${studentId}`;
  };
  type PaymentWithEnrollmentStatus = Payment & {
    enrollmentStatus?: string; // or better, exact union type from Enrollment.status
  };
  
  const mergedPayments = React.useMemo(() => {
    if (isLoadingPayments || isLoadingEnrollments) return [];

    return payments.map(payment => {
      const enrollment = filteredEnrollments.find(e => e.studentId === payment.studentId);
      return {
        ...payment,
        enrollmentStatus: enrollment?.status ?? "unknown",
      };
    });
  }, [payments, filteredEnrollments, isLoadingPayments, isLoadingEnrollments]);

  const searchFilteredPayments = React.useMemo(() => {
    if (!searchQuery) return mergedPayments;

    const query = searchQuery.toLowerCase();

    return mergedPayments.filter(payment =>
      payment.invoiceId.toLowerCase().includes(query) ||
      payment.studentId.toString().includes(query) ||
      payment.enrollmentStatus?.toLowerCase().includes(query)
    );
  }, [searchQuery, mergedPayments]);
  
  // Payment table columns
  const paymentColumns: ColumnDef<PaymentWithEnrollmentStatus>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ table, row }) => {
        const sortedRows = table.getSortedRowModel().rows;
        const index = sortedRows.findIndex((r) => r.id === row.id);
        return <div>{index + 1}</div>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "invoiceId",
      header: "Invoice ID",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <Link to={`/admin/print-invoice/${invoice.invoiceId}`} className="text-primary hover:underline font-bold">
            {invoice.invoiceId}
          </Link>
        );
      },
    },
    {
      accessorKey: "studentId",
      header: "Student",
      cell: ({ row }) => {
        const studentId = row.original.studentId;
        return getStudentName(studentId);
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        return formatCurrency(Number(row.original.amount));
      },
    },
    // {
    //   accessorKey: "dueDate",
    //   header: "Due Date",
    //   cell: ({ row }) => {
    //     return format(new Date(row.original.dueDate), "MMM dd, yyyy");
    //   },
    // },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.enrollmentStatus;
        let badgeVariant: "default" | "success" | "destructive" | "outline" | "secondary" = "outline";
        
        if (status === "active") {
          badgeVariant = "default";
        } else if (status === "inactive") {
          badgeVariant = "destructive";
        }
        
        return (
          <Badge variant={badgeVariant}>
            {status}
          </Badge>
        );
      },
    }
  ];

  return (
    <AppShell>
      <PageHeader 
        title="Student Enrollments" 
        description="Manage student enrollments"
      />
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2">
            <Input
              placeholder="Search by invoice ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-[300px]"
            />
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
      
      <DataTable 
        columns={paymentColumns} 
        data={searchFilteredPayments} 
        searchColumns={["invoiceId"]}
        searchPlaceholder="Search payments..."
      />
    </AppShell>
  );
}
