import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, Search, ArrowDown, ArrowUp, Download, CreditCard, FileText, CheckCircle, AlertCircle, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { capitalizeFirstLetter, formatCurrency } from "@/lib/utils";
import { FixedFooter } from "@/components/layout/footer";
import { useQuery } from "@tanstack/react-query";
import { Student } from "@shared/schema";
import { Link } from "wouter";

export default function ParentPayments() {
  const { user } = useAuth();
  const [tab, setTab] = useState("upcoming");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students-with-parents", user?.id],
    enabled: !!user,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["/api/invoices/parent", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // const statusQuery = tab === "history" ? "paid" : "unpaid,partially_paid";
      // const response = await fetch(`/api/invoices/parent/${user?.id}?status=${statusQuery}`);
      const response = await fetch(`/api/invoices/parent/${user?.id}?status=paid,partially_paid,unpaid`);
      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }
      return response.json();
    },
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "upcoming":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const mappedPayments = useMemo(() => payments.map((p: any) => ({
    id: p.invoices.id,
    studentName: `${p.firstName} ${p.middleName} ${p.lastName}`,
    invoiceNumber: p.invoices.invoiceNumber,
    amount: Number(p.invoices.totalAmount),
    amountPaid: Number(p.invoices.amountPaid),
    issueDate: p.invoices.issueDate,
    dueDate: p.invoices.dueDate,
    status: p.invoices.status
  })), [payments]);

  const filteredPayments = useMemo(() => {
    if (tab === "upcoming") {
      return mappedPayments.filter((p: any) => p.status === "unpaid");
    } else {
      return mappedPayments.filter((p: any) => p.status === "paid" || p.status === "partially_paid");
    }
  }, [mappedPayments, tab]);

  // Calculate summary statistics
  const totalPaid = payments
  .filter(
    (p: any) =>
      (p.invoices.status === "paid" || p.invoices.status === "partially_paid") &&
      (selectedStudent === "all" || p.studentId === selectedStudent)
  )
  .reduce((sum: number, p: any) => {
    const amountPaid = parseFloat(p.invoices.amountPaid || "0");
    return sum + (isNaN(amountPaid) ? 0 : amountPaid);
  }, 0);

const totalPending = payments
  .filter(
    (p: any) =>
      p.invoices.status === "unpaid" &&
      (selectedStudent === "all" || p.studentId === selectedStudent)
  )
  .reduce((sum: any, p: any) => sum + parseFloat(p.invoices.totalAmount), 0);

  const today = new Date();

  const totalOverdue = payments
    .filter((p: any) => {
      const dueDate = new Date(p.invoices.dueDate);
      return (
        p.invoices.status === "unpaid" &&
        dueDate < today && // due date passed => overdue
        (selectedStudent === "all" || p.studentId === selectedStudent)
      );
    })
    .reduce((sum: number, p: any) => sum + parseFloat(p.invoices.totalAmount), 0);

  // Handle sort change
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Sort icon component
  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === "asc"
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Define breadcrumbs for the page
  const breadcrumbs = [
    {
      title: "Home",
      href: "/parent/dashboard",
      icon: <Home className="h-4 w-4" />
    },
    {
      title: "Payments"
    }
  ];

  return (
    <AppShell>
      <PageHeader
        title="Payments"
        description="View student invoices"
        breadcrumbs={breadcrumbs}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overdue Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student: any) => (
                <SelectItem key={student.studentId} value={student.studentId}>
                  {student.studentFirstName} {student.studentMiddleName} {student.studentLastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number or course..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1.5 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card>
        <Tabs defaultValue="upcoming" value={tab} onValueChange={setTab}>
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <CardTitle>Payment History</CardTitle>
              <TabsList className="mt-3 md:mt-0">
                <TabsTrigger value="upcoming">
                  <Clock className="h-4 w-4 mr-2" />
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="history">
                  <FileText className="h-4 w-4 mr-2" />
                  Payment History
                </TabsTrigger>
              </TabsList>
            </div>
            <CardDescription className="mt-2">
              {tab === "upcoming"
                ? "Manage upcoming payments and due dates"
                : "View your past payment history"}
            </CardDescription>
          </CardHeader>
          <TabsContent value="upcoming">
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL NO.</TableHead>
                    <TableHead>STUDENT</TableHead>
                    <TableHead className="hidden md:table-cell">INVOICE NO.</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center">
                        AMOUNT
                        <SortIcon column="amount" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("dueDate")}
                    >
                      <div className="flex items-center">
                        ISSUE DATE
                        <SortIcon column="dueDate" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("dueDate")}
                    >
                      <div className="flex items-center">
                        DUE DATE
                        <SortIcon column="dueDate" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment: any, index: number) => (
                      <TableRow key={payment.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{payment.studentName}</TableCell>
                        <TableCell><Link className="hover:underline font-medium" href={`/parent/invoice/${payment.id}`}>{payment.invoiceNumber || "-"}</Link></TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{payment.dueDate}</TableCell>
                        <TableCell>{payment.issueDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getStatusIcon(payment.status)}
                            <Badge variant="outline" className={`ml-2 ${getStatusColor(payment.status)}`}>
                              {capitalizeFirstLetter(payment.status)}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <FileText className="h-10 w-10 text-gray-300 mb-2" />
                          <h3 className="text-lg font-medium">No payments found</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchQuery
                              ? "Try a different search query"
                              : "There are no upcoming payments scheduled"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>

          <TabsContent value="history">
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL NO.</TableHead>
                    <TableHead>STUDENT</TableHead>
                    <TableHead className="hidden md:table-cell">INVOICE NO.</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center">
                        AMOUNT
                        <SortIcon column="amount" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("dueDate")}
                    >
                      <div className="flex items-center">
                        ISSUE DATE
                        <SortIcon column="dueDate" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("dueDate")}
                    >
                      <div className="flex items-center">
                        DUE DATE
                        <SortIcon column="dueDate" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment: any, index: number) => (
                      <TableRow key={payment.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{payment.studentName}</TableCell>
                        <TableCell><Link className="hover:underline font-medium" href={`/parent/invoice/${payment.id}`}>{payment.invoiceNumber || "-"}</Link></TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{payment.dueDate}</TableCell>
                        <TableCell>{payment.issueDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getStatusIcon(payment.status)}
                            <Badge variant="outline" className={`ml-2 ${getStatusColor(payment.status)}`}>
                              {capitalizeFirstLetter(payment.status)}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <FileText className="h-10 w-10 text-gray-300 mb-2" />
                          <h3 className="text-lg font-medium">No payments found</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchQuery
                              ? "Try a different search query"
                              : "There are no upcoming payments scheduled"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
      <FixedFooter user={user} />
    </AppShell>
  );
}