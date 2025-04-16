import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Home, 
  CreditCard, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Search,
  X
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";

export default function StudentPayments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock payment data
  const payments = [
    {
      id: "INV-20230815",
      course: "Guitar Lessons",
      amount: 12000,
      status: "paid",
      date: new Date(2023, 7, 15), // August 15, 2023
      dueDate: new Date(2023, 7, 22),
      paymentMethod: "Credit Card",
      receiptUrl: "#"
    },
    {
      id: "INV-20230915",
      course: "Guitar Lessons",
      amount: 12000,
      status: "paid",
      date: new Date(2023, 8, 15), // September 15, 2023
      dueDate: new Date(2023, 8, 22),
      paymentMethod: "Bank Transfer",
      receiptUrl: "#"
    },
    {
      id: "INV-20231015",
      course: "Guitar Lessons",
      amount: 12000,
      status: "upcoming",
      date: new Date(2023, 9, 1), // October 1, 2023
      dueDate: new Date(2023, 9, 7),
      paymentMethod: "",
      receiptUrl: ""
    },
    {
      id: "INV-20230820",
      course: "Music Theory",
      amount: 5000,
      status: "paid",
      date: new Date(2023, 7, 20), // August 20, 2023
      dueDate: new Date(2023, 7, 27),
      paymentMethod: "Credit Card",
      receiptUrl: "#"
    },
    {
      id: "INV-20230920",
      course: "Music Theory",
      amount: 5000,
      status: "paid",
      date: new Date(2023, 8, 20), // September 20, 2023
      dueDate: new Date(2023, 8, 27),
      paymentMethod: "Credit Card",
      receiptUrl: "#"
    },
    {
      id: "INV-20231020",
      course: "Music Theory",
      amount: 5000,
      status: "overdue",
      date: new Date(2023, 9, 1), // October 1, 2023
      dueDate: new Date(2023, 9, 7),
      paymentMethod: "",
      receiptUrl: ""
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

  // Filter payments by tab and search query
  const filteredPayments = payments
    .filter(payment => {
      // Filter by tab
      if (activeTab === "upcoming" && payment.status !== "upcoming" && payment.status !== "overdue") {
        return false;
      }
      if (activeTab === "history" && (payment.status === "upcoming" || payment.status === "overdue")) {
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
      if (activeTab === "upcoming") {
        // Sort by due date for upcoming tab
        return a.dueDate.getTime() - b.dueDate.getTime();
      } else {
        // Sort by payment date (most recent first) for history tab
        return b.date.getTime() - a.date.getTime();
      }
    });

  // Calculate summary statistics
  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalUpcoming = payments
    .filter(p => p.status === "upcoming")
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalOverdue = payments
    .filter(p => p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  // Define breadcrumbs for the page
  const breadcrumbs = [
    {
      title: "Home",
      href: "/student/dashboard",
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
        description="Manage your course payments and invoices"
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
            <CardTitle className="text-sm font-medium text-gray-500">Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalUpcoming)}</div>
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

      <Card>
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
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
              {activeTab === "upcoming" 
                ? "View upcoming payments and due dates" 
                : "Track your past payment history"}
            </CardDescription>
          </CardHeader>
          <TabsContent value="upcoming">
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.id}</TableCell>
                        <TableCell>{payment.course}</TableCell>
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
                            <Button size="sm" variant="outline" disabled>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Paid
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
                          <h3 className="text-lg font-medium">No upcoming payments</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchQuery 
                              ? "Try a different search query" 
                              : "You don't have any pending payments at the moment"}
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
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.id}</TableCell>
                        <TableCell>{payment.course}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{format(payment.date, 'MMM d, yyyy')}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell className="text-right">
                          {payment.receiptUrl && (
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
                          <h3 className="text-lg font-medium">No payment history</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchQuery 
                              ? "Try a different search query" 
                              : "You haven't made any payments yet"}
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
            {activeTab === "history" && (
              <div className="text-sm">
                <Button variant="link" size="sm" className="text-primary">
                  View All Invoices
                </Button>
              </div>
            )}
          </CardFooter>
        </Tabs>
      </Card>
    </AppShell>
  );
}