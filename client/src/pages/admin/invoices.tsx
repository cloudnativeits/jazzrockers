import { useEffect, useState } from "react";
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
import { Link } from "wouter";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const {
    data: invoices,
    isLoading: invoicesLoading,
    error: invoicesError
  } = useQuery({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  const {
    data: students,
    isLoading: studentsLoading
  } = useQuery({
    queryKey: ["/api/students"],
    retry: false,
  });


 const cancelInvoiceMutation = useMutation({
    // The order of arguments has been corrected here
    mutationFn: (invoiceId: number) =>
      apiRequest("PUT", `/api/invoices/cancel/${invoiceId}`),
      
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Invoice has been cancelled successfully.",
      });
      // Invalidate and refetch the invoices query to update the list
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: any) => {
      // It's good practice to parse the error message from the server if available
      const errorMessage = error?.response?.data?.error || error.message || "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Error Cancelling Invoice",
        description: errorMessage,
      });
    },
    onSettled: () => {
      // Close the dialog whether the mutation succeeds or fails
      setIsCancelDialogOpen(false);
      setSelectedInvoiceId(null);
    }
  });

  // Handler to open the confirmation dialog
  const handleOpenCancelDialog = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setIsCancelDialogOpen(true);
  };

  // Handler to confirm and execute the cancellation
  const handleConfirmCancel = () => {
    if (selectedInvoiceId) {
      cancelInvoiceMutation.mutate(selectedInvoiceId);
    }
  };


  const filteredInvoices = invoices ? invoices.filter((invoice: any) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    // ||
    // (invoice.studentId && invoice.studentId().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) : [];

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
          title="Invoices"
          description="Manage student invoices"
        />

        <div>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Invoices</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Invoice Management</CardTitle>
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
                            <TableHead>SL No</TableHead>
                            <TableHead className="w-[170px]">Invoice ID</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Issue Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[130px]">Amount Paid</TableHead>
                            <TableHead className="w-[130px]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInvoices.map((invoice: any, index: number) => {
                            const student = students?.find((s: any) => s.id === invoice.studentId);
                            return (
                              <TableRow key={invoice.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">
                                  <Link to={`/admin/invoice/${invoice.id}`} className="text-primary hover:underline">{invoice.invoiceNumber}</Link>
                                </TableCell>
                                <TableCell>{student?.firstName + " " + student?.middleName + " " + student?.lastName}</TableCell>
                                <TableCell className="font-bold">
                                  {invoice.totalAmount}
                                </TableCell>
                                <TableCell>
                                  {invoice.issueDate ? format(new Date(invoice.issueDate), "MMM dd, yyyy") : "-"}
                                </TableCell>
                                <TableCell className={cn(
                                  new Date(invoice.dueDate) < new Date() && invoice.status === "pending" ? "text-red-500" : ""
                                )}>
                                  {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={invoice.status} />
                                </TableCell>
                                <TableCell className="font-bold text-center">{invoice.amountPaid || "-"}</TableCell>
                                <TableCell className="text-center">
                                  {invoice.status !== 'cancelled' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleOpenCancelDialog(invoice.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                  )}
                              </TableCell>
                              </TableRow>
                            )
                          })}
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
                        `${totalPending.toLocaleString()}`
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
                        `${totalCollected.toLocaleString()}`
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
                              {parseFloat(invoice.amount).toLocaleString()}
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
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently cancel the invoice.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCancelDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              disabled={cancelInvoiceMutation.isPending}
              onClick={handleConfirmCancel}
            >
              {cancelInvoiceMutation.isPending ? "Cancelling..." : "Confirm Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}