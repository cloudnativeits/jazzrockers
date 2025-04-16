import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Download, Filter, Search, ArrowUpDown, FileText, CreditCard, Banknote, CheckCircle, XCircle, AlertCircle, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

// Form schema for creating/editing invoices
const invoiceFormSchema = z.object({
  studentId: z.number({
    required_error: "Please select a student",
  }),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  status: z.string({
    required_error: "Please select a status",
  }),
  paymentMethod: z.string().optional(),
  paymentDate: z.date().optional(),
  remarks: z.string().optional(),
});

// Payment status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
    paid: { variant: "default", label: "Paid" },
    pending: { variant: "secondary", label: "Pending" },
    failed: { variant: "destructive", label: "Failed" },
    cancelled: { variant: "outline", label: "Cancelled" },
  };
  
  const { variant, label } = variants[status] || { variant: "outline", label: status };
  
  return <Badge variant={variant}>{label}</Badge>;
};

export default function InvoicesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Get invoices
  const { 
    data: invoices, 
    isLoading: invoicesLoading, 
    error: invoicesError 
  } = useQuery({
    queryKey: ["/api/payments"],
    retry: false,
  });
  
  // Get students for dropdown
  const { 
    data: students, 
    isLoading: studentsLoading 
  } = useQuery({
    queryKey: ["/api/students"],
    retry: false,
  });
  
  // Create invoice form
  const form = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      amount: "",
      status: "pending",
      remarks: "",
    },
  });
  
  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (values: z.infer<typeof invoiceFormSchema>) => {
      // Generate invoice ID with format INV-YYYYMMDD-XXX (random 3 digits)
      const today = new Date();
      const dateStr = format(today, "yyyyMMdd");
      const randomNum = Math.floor(Math.random() * 900) + 100; // 3-digit random number
      const invoiceId = `INV-${dateStr}-${randomNum}`;
      
      const invoiceData = {
        ...values,
        invoiceId,
        paymentDate: values.paymentDate || today,
      };
      
      const response = await apiRequest("POST", "/api/payments", invoiceData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (values: z.infer<typeof invoiceFormSchema> & { id: number }) => {
      const { id, ...updateData } = values;
      const response = await apiRequest("PUT", `/api/payments/${id}`, updateData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setSelectedInvoice(null);
      form.reset();
      toast({
        title: "Invoice updated",
        description: "The invoice has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle creating or updating an invoice
  const onSubmit = (values: z.infer<typeof invoiceFormSchema>) => {
    if (selectedInvoice) {
      updateInvoiceMutation.mutate({ ...values, id: selectedInvoice.id });
    } else {
      createInvoiceMutation.mutate(values);
    }
  };
  
  // Open edit dialog with selected invoice data
  const handleEditInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    
    // Set form values from invoice data
    form.reset({
      studentId: invoice.studentId,
      amount: invoice.amount.toString(),
      dueDate: new Date(invoice.dueDate),
      status: invoice.status,
      paymentMethod: invoice.paymentMethod || undefined,
      paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate) : undefined,
      remarks: invoice.remarks || "",
    });
  };
  
  // Filter invoices by search term and status
  const filteredInvoices = invoices ? invoices.filter((invoice: any) => {
    const matchesSearch = 
      invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.studentName && invoice.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];
  
  // Group invoices by status for dashboard display
  const invoiceStats = {
    paid: invoices ? invoices.filter((i: any) => i.status === "paid").length : 0,
    pending: invoices ? invoices.filter((i: any) => i.status === "pending").length : 0,
    failed: invoices ? invoices.filter((i: any) => i.status === "failed").length : 0,
    cancelled: invoices ? invoices.filter((i: any) => i.status === "cancelled").length : 0,
    total: invoices ? invoices.length : 0,
  };
  
  // Calculate total amounts
  const totalPending = invoices 
    ? invoices
        .filter((i: any) => i.status === "pending")
        .reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0)
    : 0;
    
  const totalCollected = invoices 
    ? invoices
        .filter((i: any) => i.status === "paid")
        .reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0)
    : 0;
  
  return (
    <AppShell>
      <div className="flex flex-col min-h-screen">
        <PageHeader 
          title="Invoices & Payments" 
          description="Manage student invoices and payment records"
          breadcrumbs={[
            { title: "Dashboard", href: "/admin/dashboard", icon: <FileText className="h-4 w-4" /> },
            { title: "Invoices", icon: <Receipt className="h-4 w-4" /> }
          ]}
          actions={
            <Button onClick={() => {
              setSelectedInvoice(null);
              form.reset({
                amount: "",
                status: "pending",
                remarks: "",
              });
              setIsCreateDialogOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          }
        />
        
        <div className="flex-1 space-y-4 p-6 pt-2">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Invoices</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Invoice Management</CardTitle>
                  <CardDescription>View and manage all financial transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search by invoice ID or student name..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                  
                  {invoicesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : invoicesError ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Error loading invoices.
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <FileText className="mx-auto h-10 w-10 mb-2 text-muted-foreground/60" />
                      <p className="mb-2">No invoices found</p>
                      <p className="text-sm text-muted-foreground/60">Try changing the filters or create a new invoice.</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Invoice ID</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-right">Amount (₹)</TableHead>
                            <TableHead>Payment Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInvoices.map((invoice: any) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoiceId}</TableCell>
                              <TableCell>{invoice.studentName || `Student #${invoice.studentId}`}</TableCell>
                              <TableCell className="text-right">
                                {parseFloat(invoice.amount).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {invoice.paymentDate ? format(new Date(invoice.paymentDate), "MMM dd, yyyy") : "-"}
                              </TableCell>
                              <TableCell className={cn(
                                new Date(invoice.dueDate) < new Date() && invoice.status === "pending" ? "text-red-500" : ""
                              )}>
                                {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={invoice.status} />
                              </TableCell>
                              <TableCell>{invoice.paymentMethod || "-"}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditInvoice(invoice)}
                                >
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Invoices
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoicesLoading ? <Skeleton className="h-8 w-20" /> : invoiceStats.total}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All-time total invoices
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pending Payment
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-500">
                      {invoicesLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        `₹${totalPending.toLocaleString()}`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {invoiceStats.pending} pending invoice(s)
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Collected Payment
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">
                      {invoicesLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        `₹${totalCollected.toLocaleString()}`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {invoiceStats.paid} paid invoice(s)
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Collection Rate
                    </CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoicesLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        invoiceStats.total > 0 
                          ? `${Math.round((invoiceStats.paid / invoiceStats.total) * 100)}%` 
                          : "0%"
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Payment collection rate
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest 5 payment transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {invoicesLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : invoices && invoices.length > 0 ? (
                      <div className="space-y-4">
                        {invoices.slice(0, 5).map((invoice: any) => (
                          <div key={invoice.id} className="flex items-center space-x-4 border-b pb-3">
                            <div className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center",
                              invoice.status === "paid" ? "bg-green-100" : 
                              invoice.status === "pending" ? "bg-amber-100" : 
                              invoice.status === "failed" ? "bg-red-100" : "bg-gray-100"
                            )}>
                              {invoice.status === "paid" ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : invoice.status === "pending" ? (
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                              ) : invoice.status === "failed" ? (
                                <XCircle className="h-5 w-5 text-red-500" />
                              ) : (
                                <CreditCard className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">
                                {invoice.studentName || `Student #${invoice.studentId}`}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <span>{invoice.invoiceId}</span>
                                <span className="mx-1">•</span>
                                <span>{format(new Date(invoice.paymentDate || invoice.dueDate), "MMM dd, yyyy")}</span>
                              </div>
                            </div>
                            <div className="font-medium">
                              ₹{parseFloat(invoice.amount).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No transactions found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods Distribution</CardTitle>
                    <CardDescription>Overview of payment methods used</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {invoicesLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : invoices && invoices.filter((i: any) => i.status === "paid").length > 0 ? (
                      <div className="space-y-4">
                        {["cash", "card", "bank transfer", "upi"].map((method) => {
                          const count = invoices.filter((i: any) => 
                            i.status === "paid" && 
                            i.paymentMethod?.toLowerCase() === method
                          ).length;
                          
                          const total = invoices.filter((i: any) => i.status === "paid").length;
                          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                          
                          return (
                            <div key={method} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {method === "cash" ? (
                                    <Banknote className="h-4 w-4 mr-2 text-green-500" />
                                  ) : method === "card" ? (
                                    <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                                  ) : method === "bank transfer" ? (
                                    <FileText className="h-4 w-4 mr-2 text-purple-500" />
                                  ) : (
                                    <CreditCard className="h-4 w-4 mr-2 text-orange-500" />
                                  )}
                                  <span className="text-sm capitalize">{method}</span>
                                </div>
                                <span className="text-sm font-medium">{percentage}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full",
                                    method === "cash" ? "bg-green-500" : 
                                    method === "card" ? "bg-blue-500" : 
                                    method === "bank transfer" ? "bg-purple-500" : 
                                    "bg-orange-500"
                                  )}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-center">
                        <CreditCard className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No payment method data</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Create/Edit Invoice Dialog */}
      <Dialog open={isCreateDialogOpen || !!selectedInvoice} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setSelectedInvoice(null);
        }
      }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{selectedInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
            <DialogDescription>
              {selectedInvoice 
                ? `Edit details for invoice ${selectedInvoice.invoiceId}` 
                : "Fill in the details to create a new invoice"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select 
                      disabled={studentsLoading} 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students?.map((student: any) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.firstName} {student.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
              </div>
              
              {form.watch("status") === "paid" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
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
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Payment Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Input placeholder="Add any notes or details here" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional notes about this invoice
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}>
                  {(createInvoiceMutation.isPending || updateInvoiceMutation.isPending) ? (
                    <>Saving...</>
                  ) : selectedInvoice ? (
                    <>Update Invoice</>
                  ) : (
                    <>Create Invoice</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}