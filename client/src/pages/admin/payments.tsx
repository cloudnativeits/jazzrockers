import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, FileText, Download, Receipt, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Payment } from "@shared/schema";
import { formatCurrency, generateInvoiceId } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema
const paymentFormSchema = z.object({
  studentId: z.number({
    required_error: "Please select a student",
  }),
  amount: z.number({
    required_error: "Amount is required",
  }).min(1, "Amount must be greater than 0"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  status: z.string({
    required_error: "Status is required",
  }),
  paymentMethod: z.string().optional(),
  remarks: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function AdminPayments() {
  const [activeTab, setActiveTab] = useState("all");
  const [isNewPaymentDialogOpen, setIsNewPaymentDialogOpen] = useState(false);
  const [isViewPaymentDialogOpen, setIsViewPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  // Fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students"],
  });

  // Payment form
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      status: "pending",
      paymentMethod: undefined,
      remarks: "",
    },
  });

  // Handle view payment
  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewPaymentDialogOpen(true);
  };

  // Submit payment form
  const onSubmitPaymentForm = async (data: PaymentFormValues) => {
    try {
      const invoiceId = generateInvoiceId();
      const paymentData = {
        ...data,
        invoiceId,
        paymentDate: new Date(),
      };
      
      await apiRequest("POST", "/api/payments", paymentData);
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setIsNewPaymentDialogOpen(false);
      paymentForm.reset();
      toast({
        title: "Payment created",
        description: "The payment has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter payments based on active tab
  const filteredPayments = payments.filter((payment: Payment) => {
    if (activeTab === "all") return true;
    return payment.status === activeTab;
  });

  // Apply search filter
  const searchFilteredPayments = searchQuery 
    ? filteredPayments.filter((payment: Payment) => 
        payment.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.studentId.toString().includes(searchQuery.toLowerCase())
      )
    : filteredPayments;

  // Get student name by id
  const getStudentName = (studentId: number): string => {
    const student = students.find((s: any) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : `Student ${studentId}`;
  };

  // Payment table columns
  const paymentColumns: ColumnDef<Payment>[] = [
    {
      accessorKey: "invoiceId",
      header: "Invoice ID",
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
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        return format(new Date(row.original.dueDate), "MMM dd, yyyy");
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeVariant: "default" | "success" | "destructive" | "outline" | "secondary" = "outline";
        
        if (status === "paid") {
          badgeVariant = "success";
        } else if (status === "pending") {
          badgeVariant = "secondary";
        } else if (status === "failed") {
          badgeVariant = "destructive";
        }
        
        return (
          <Badge variant={badgeVariant}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => {
        return row.original.paymentMethod || "-";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const payment = row.original;
        
        return (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleViewPayment(payment)}
          >
            <FileText className="h-4 w-4 mr-2" />
            View
          </Button>
        );
      },
    },
  ];

  return (
    <AppShell>
      <PageHeader 
        title="Payments & Invoices" 
        description="Manage student payments and generate invoices."
        actions={
          <Button onClick={() => setIsNewPaymentDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(823450)}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(145280)}</div>
            <p className="text-xs text-muted-foreground">35 pending invoices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(56700)}</div>
            <p className="text-xs text-muted-foreground">12 overdue invoices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
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
        searchColumn="invoiceId"
        searchPlaceholder="Search payments..."
      />
      
      {/* New Payment Dialog */}
      <Dialog open={isNewPaymentDialogOpen} onOpenChange={setIsNewPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Payment</DialogTitle>
            <DialogDescription>
              Create a new payment record or invoice for a student.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onSubmitPaymentForm)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.firstName} {student.lastName} ({student.studentId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter amount" 
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                        onChange={e => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank transfer">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Additional notes or remarks" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Create Payment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Payment Dialog */}
      {selectedPayment && (
        <Dialog open={isViewPaymentDialogOpen} onOpenChange={setIsViewPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                View and manage payment information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Invoice #{selectedPayment.invoiceId}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedPayment.paymentDate), "MMMM dd, yyyy")}
                  </p>
                </div>
                <Badge 
                  variant={
                    selectedPayment.status === "paid" ? "success" : 
                    selectedPayment.status === "pending" ? "secondary" : 
                    "destructive"
                  }
                  className="text-sm"
                >
                  {selectedPayment.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Billed To</h4>
                  <p className="font-medium">{getStudentName(selectedPayment.studentId)}</p>
                  <p className="text-sm">Student ID: {students.find((s: any) => s.id === selectedPayment.studentId)?.studentId || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Payment Info</h4>
                  <p className="text-sm">
                    <span className="font-medium">Due Date:</span> {format(new Date(selectedPayment.dueDate), "MMMM dd, yyyy")}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Method:</span> {selectedPayment.paymentMethod || "Not specified"}
                  </p>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">
                        Course Fee
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-neutral-900 font-mono">
                        {formatCurrency(Number(selectedPayment.amount))}
                      </td>
                    </tr>
                    {/* We could add more line items here */}
                    <tr className="bg-neutral-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-neutral-900">Total</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-neutral-900 font-mono">
                        {formatCurrency(Number(selectedPayment.amount))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {selectedPayment.remarks && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-1">Remarks</h4>
                  <p className="text-sm p-2 bg-neutral-50 rounded border">{selectedPayment.remarks}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-4">
                {selectedPayment.status === "pending" && (
                  <Button variant="outline" className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
                <Button>
                  <Receipt className="mr-2 h-4 w-4" />
                  Download Invoice
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}
