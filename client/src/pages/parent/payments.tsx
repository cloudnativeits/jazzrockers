import { useState } from "react";
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
import { formatCurrency } from "@/lib/utils";

export default function ParentPayments() {
  const { user } = useAuth();
  const [tab, setTab] = useState("upcoming");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Mock data
  const students = [
    { id: "all", name: "All Children" },
    { id: "1", name: "Riya Sharma" },
    { id: "2", name: "Arjun Sharma" }
  ];

  // Mock payment data
  const payments = [
    {
      id: "INV-20230923",
      student: "1", // Riya
      course: "Guitar Lessons",
      amount: 12000,
      status: "paid",
      date: new Date(2023, 8, 23), // September 23, 2023
      dueDate: new Date(2023, 8, 30),
      paymentMethod: "Credit Card",
      receiptUrl: "#"
    },
    {
      id: "INV-20231023",
      student: "1", // Riya
      course: "Guitar Lessons",
      amount: 12000,
      status: "upcoming",
      date: new Date(2023, 9, 1), // October 1, 2023
      dueDate: new Date(2023, 9, 7),
      paymentMethod: "",
      receiptUrl: ""
    },
    {
      id: "INV-20230915",
      student: "2", // Arjun
      course: "Piano Lessons",
      amount: 15000,
      status: "paid",
      date: new Date(2023, 8, 15), // September 15, 2023
      dueDate: new Date(2023, 8, 22),
      paymentMethod: "Bank Transfer",
      receiptUrl: "#"
    },
    {
      id: "INV-20231015",
      student: "2", // Arjun
      course: "Piano Lessons",
      amount: 15000,
      status: "overdue",
      date: new Date(2023, 9, 1), // October 1, 2023
      dueDate: new Date(2023, 9, 7),
      paymentMethod: "",
      receiptUrl: ""
    },
    {
      id: "INV-20230815",
      student: "1", // Riya
      course: "Guitar Lessons",
      amount: 12000,
      status: "paid",
      date: new Date(2023, 7, 15), // August 15, 2023
      dueDate: new Date(2023, 7, 22),
      paymentMethod: "Credit Card",
      receiptUrl: "#"
    },
    {
      id: "INV-20230815-A",
      student: "2", // Arjun
      course: "Piano Lessons",
      amount: 15000,
      status: "paid",
      date: new Date(2023, 7, 15), // August 15, 2023
      dueDate: new Date(2023, 7, 22),
      paymentMethod: "Credit Card",
      receiptUrl: "#"
    }
  ];

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

  // Filter and sort payments
  const filteredPayments = payments
    .filter(payment => {
      // Filter by selected student
      if (selectedStudent !== "all" && payment.student !== selectedStudent) {
        return false;
      }
      
      // Filter by active tab
      if (tab === "upcoming" && payment.status !== "upcoming") {
        return false;
      }
      if (tab === "history" && payment.status === "upcoming") {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && 
          !payment.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !payment.course.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected column
      if (sortColumn === "date") {
        return sortDirection === "asc" 
          ? a.date.getTime() - b.date.getTime()
          : b.date.getTime() - a.date.getTime();
      }
      if (sortColumn === "amount") {
        return sortDirection === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      if (sortColumn === "dueDate") {
        return sortDirection === "asc"
          ? a.dueDate.getTime() - b.dueDate.getTime()
          : b.dueDate.getTime() - a.dueDate.getTime();
      }
      return 0;
    });

  // Calculate summary statistics
  const totalPaid = payments
    .filter(p => p.status === "paid" && (selectedStudent === "all" || p.student === selectedStudent))
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalPending = payments
    .filter(p => (p.status === "upcoming" || p.status === "overdue") && (selectedStudent === "all" || p.student === selectedStudent))
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalOverdue = payments
    .filter(p => p.status === "overdue" && (selectedStudent === "all" || p.student === selectedStudent))
    .reduce((sum, p) => sum + p.amount, 0);

  // Handle sort change
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to descending
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
        description="Manage tuition payments and invoices"
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
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
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
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">Course</TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center">
                        Amount
                        <SortIcon column="amount" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("dueDate")}
                    >
                      <div className="flex items-center">
                        Due Date
                        <SortIcon column="dueDate" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {students.find(s => s.id === payment.student)?.name.split(' ')[0]}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{payment.course}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{format(payment.dueDate, 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getStatusIcon(payment.status)}
                            <Badge variant="outline" className={`ml-2 ${getStatusColor(payment.status)}`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.status === "upcoming" || payment.status === "overdue" ? (
                            <Button size="sm">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Receipt
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
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
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">Course</TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center">
                        Amount
                        <SortIcon column="amount" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center">
                        Payment Date
                        <SortIcon column="date" />
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Method</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {students.find(s => s.id === payment.student)?.name.split(' ')[0]}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{payment.course}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{format(payment.date, 'MMM d, yyyy')}</TableCell>
                        <TableCell className="hidden md:table-cell">{payment.paymentMethod}</TableCell>
                        <TableCell className="text-right">
                          {payment.status === "paid" && (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <FileText className="h-10 w-10 text-gray-300 mb-2" />
                          <h3 className="text-lg font-medium">No payment history found</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchQuery 
                              ? "Try a different search query" 
                              : "There are no past payments to display"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
          <CardFooter className="border-t p-4 flex justify-between">
            <div className="text-sm text-gray-500">
              Showing {filteredPayments.length} of {payments.length} payments
            </div>
            <div className="text-sm">
              <Button variant="link" size="sm" className="text-primary">
                View All Invoices
              </Button>
            </div>
          </CardFooter>
        </Tabs>
      </Card>
    </AppShell>
  );
}