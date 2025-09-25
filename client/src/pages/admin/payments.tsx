import { useEffect, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, FileText, Download, CheckCircle2, CreditCard } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { StudentPayment, Student, Receipt } from "@shared/schema";
import { extractMonth, formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { string, z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import SelectMultiple from "react-select";
import ReactSelect from "react-select";

// Form schema
const paymentFormSchema = z.object({
  paymentId: z.string(),
  invoiceNumber: z.array(z.string()).min(1, {
    message: "You must select at least one invoice to pay.",
  }),
  studentId: z.number({
    required_error: "Please select a student",
  }),
  invoiceAmount: z.string().optional(),
  amount: z.number({
    required_error: "Amount is required",
  }).min(1, "Amount must be greater than 0"),
  paymentDate: z.date({
    required_error: "Payment date is required",
  }),
  status: z.string({
    required_error: "Status is required",
  }),
  paymentMethod: z.string().optional(),
  remarks: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const receiptFormSchema = z.object({
  receiptNumber: z.string({
    required_error: "Receipt number is required",
  }),
  paymentId: z.string({
    required_error: "Payment ID is required",
  }),
  receiptDate: z.date({
    required_error: "Receipt date is required",
  }),
  invoiceDate: z.string({
    required_error: "Invoice date is required",
  }),
  amount: z.number({
    required_error: "Amount is required",
  }).min(1, "Amount must be greater than 0"),
  paymentMethod: z.string({
    required_error: "Payment method is required",
  }),
  remarks: z.string().optional(),
});

type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

interface DashboardStats {
  totalRevenue: number;
  pendingPayments: number;
  activeStudents: number;
  activeBatches: number;
}

export default function AdminPayments() {
  const [activeTab, setActiveTab] = useState("all");
  const [activeTabReceipts, setActiveTabReceipts] = useState("payments");
  const [isNewPaymentDialogOpen, setIsNewPaymentDialogOpen] = useState(false);
  const [isNewReceiptDialogOpen, setIsNewReceiptDialogOpen] = useState(false);
  const [isViewPaymentDialogOpen, setIsViewPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<StudentPayment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [paymentId, setPaymentId] = useState("");
  const [receiptId, setReceiptId] = useState("");

  // Fetch payments
  const { data: payments = [], isLoading } = useQuery<StudentPayment[]>({
    queryKey: ["/api/studentPayments"],
  });

  // Fetch receipts
  const { data: receipts = [], isLoading: isLoadingReceipts } = useQuery<Receipt[]>({
    queryKey: ["/api/receipts"],
  });

  // Fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: stats, isLoading: isLoadingStats, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    staleTime: 5 * 60 * 1000,
  });

  // Payment form
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      invoiceNumber: [],
      studentId: undefined,
      invoiceAmount: undefined,
      amount: 0,
      paymentDate: new Date(),
      status: "",
      paymentMethod: undefined,
      remarks: "",
    },
  });

  // Receipt form
  const receiptForm = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      receiptNumber: "",
      paymentId: "",
      receiptDate: new Date(),
      invoiceDate: "",
      amount: 0,
      paymentMethod: "",
      remarks: "",
    },
  });

  const selectedStudentId = useWatch({
    control: paymentForm.control,
    name: "studentId",
  });

  const {
    data: unpaidInvoices = [],
    isLoading: isLoadingUnpaidInvoices,
  } = useQuery({
    queryKey: ["unpaidInvoicesByStudent", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const res = await fetch(`/api/unpaidInvoicesByStudent/${selectedStudentId}`);
      return res.json();
    },
    enabled: !!selectedStudentId,
  });

  const selectedInvoiceId = useWatch({
    control: paymentForm.control,
    name: "invoiceNumber",
  });

  // useEffect(() => {
  //   if (selectedInvoiceId && unpaidInvoices.length) {
  //     const selected = unpaidInvoices.find((inv: any) => inv.invoiceNumber === selectedInvoiceId);
  //     if (selected) {
  //       paymentForm.setValue("invoiceAmount", selected.totalAmount);
  //     }
  //   }
  // }, [selectedInvoiceId, unpaidInvoices]);
  useEffect(() => {
    if (Array.isArray(selectedInvoiceId) && unpaidInvoices.length) {
      const selectedInvoices = unpaidInvoices.filter((inv: any) =>
        selectedInvoiceId.includes(inv.invoiceNumber)
      );
  
      const totalAmount = selectedInvoices.reduce((sum: any, inv: any) => {
        const amount = Number(inv.totalAmount) || 0;
        return sum + amount;
      }, 0);
  
      paymentForm.setValue("invoiceAmount", formatCurrency(totalAmount));
    }
  }, [selectedInvoiceId, unpaidInvoices]);

  const selectedPaymentId = useWatch({
    control: receiptForm.control,
    name: "paymentId",
  });

  useEffect(() => {
    if (selectedPaymentId) {
      const selected = payments.find((payment: any) => payment.paymentId === selectedPaymentId);
      if (selected) {
        receiptForm.setValue("amount", Number(selected.amount));
      }
    }
  }, [selectedPaymentId, payments, receiptForm]);

  useEffect(() => {
    if (isNewPaymentDialogOpen) {
      fetch("/api/generate-payment-id")
        .then((res) => res.json())
        .then((data) => {
          setPaymentId(data.paymentId);
          paymentForm.reset({
            ...paymentForm.getValues(),
            paymentId: data.paymentId,
          });
        });
    }
  }, [isNewPaymentDialogOpen]);

  useEffect(() => {
    if (isNewReceiptDialogOpen) {
      fetch("/api/generate-receipt-number")
        .then((res) => res.json())
        .then((data) => {
          setReceiptId(data.receiptNumber);
          receiptForm.reset({
            ...receiptForm.getValues(),
            receiptNumber: data.receiptNumber,
          });
        });
    }
  }, [isNewReceiptDialogOpen]);

  const createLabel = (invoice: any) => {
    try {
      const { monthName } = extractMonth(invoice.invoiceNumber);
      return `${invoice.invoiceNumber}, ${monthName}`;
    } catch {
      return invoice.invoiceNumber; // fallback for invalid format
    }
  };

  // Handle view payment
  const handleViewPayment = (payment: StudentPayment) => {
    setSelectedPayment(payment);
    setIsViewPaymentDialogOpen(true);
  };

  // Submit payment form
  const onSubmitPaymentForm = async (data: PaymentFormValues) => {
    try {
      const isPayingAgainstInvoices = Array.isArray(data.invoiceNumber) && data.invoiceNumber.length > 0;
      let paymentId = "";
      const totalPaymentAmount = Number(data.amount);
      let remainingPayment = totalPaymentAmount;
  
      if (isNaN(remainingPayment) || remainingPayment <= 0) {
        throw new Error("Invalid payment amount.");
      }
  
      if (isPayingAgainstInvoices) {
        toast({
          title: "Processing Payment",
          description: `Distributing ${remainingPayment} across ${data.invoiceNumber.length} invoice(s)...`,
        });
  
        const invoiceUpdates = data.invoiceNumber.map((singleInvoice) => {
          const invoiceDetails = unpaidInvoices.find((inv: any) => inv.invoiceNumber === singleInvoice);
          if (!invoiceDetails) {
            throw new Error(`Invoice ${singleInvoice} not found. Please refresh.`);
          }
  
          const alreadyPaid = Number(invoiceDetails.amountPaid) || 0;
          const invoiceTotal = Number(invoiceDetails.totalAmount);
  
          return {
            invoiceNumber: singleInvoice,
            alreadyPaid,
            invoiceTotal,
          };
        });
  
        const paymentResponse = await apiRequest("POST", "/api/studentPayments", {
          studentId: data.studentId,
          amount: totalPaymentAmount,
          paymentDate: new Date(),
          paymentMethod: data.paymentMethod || "Cash",
          remarks: data.remarks,
          status: "paid",
          advanceAmount: 0,
          state: "active",
        });

        queryClient.invalidateQueries({ queryKey: ['allReceiptsData'] });
  
        const paymentJson = await paymentResponse.json();
        paymentId = paymentJson.paymentId;
        if (!paymentId) throw new Error("Payment creation failed.");
  
        for (const invoice of invoiceUpdates) {
          const { invoiceNumber, alreadyPaid, invoiceTotal } = invoice;
          const amountDue = invoiceTotal - alreadyPaid;
  
          if (amountDue <= 0) continue;
  
          const allocatedAmount = Math.min(remainingPayment, amountDue);
          const newAmountPaid = alreadyPaid + allocatedAmount;
          const newStatus = newAmountPaid >= invoiceTotal ? "paid" : "partially_paid";
  
          await apiRequest("PATCH", `/api/invoices/${invoiceNumber}`, {
            amount_paid: newAmountPaid,
            status: newStatus,
          });
  
          await apiRequest("POST", "/api/paymentItems", {
            paymentId,
            invoiceNumber,
            amount: allocatedAmount,
          });
  
          const receiptResponse = await fetch("/api/generate-receipt-number");
          const receiptData = await receiptResponse.json();
  
          await apiRequest("POST", "/api/receipts", {
            receiptNumber: receiptData.receiptNumber,
            paymentId,
            invoiceNumber,
            receiptDate: new Date(),
            invoiceDate: new Date().toISOString().slice(0, 10),
            amount: allocatedAmount,
            paymentMethod: data.paymentMethod || "Cash",
            remarks: data.remarks,
          });
  
          remainingPayment -= allocatedAmount;
          if (remainingPayment <= 0) break;
        }
      } else {
        const advanceResponse = await apiRequest("POST", "/api/studentPayments", {
          studentId: data.studentId,
          amount: totalPaymentAmount,
          paymentDate: new Date(),
          paymentMethod: data.paymentMethod || "Cash",
          remarks: data.remarks,
          status: "paid",
          advanceAmount: totalPaymentAmount,
          state: "active",
        });
  
        const advanceJson = await advanceResponse.json();
        paymentId = advanceJson.paymentId;
        if (!paymentId) throw new Error("Advance payment creation failed.");
  
        const receiptResponse = await fetch("/api/generate-receipt-number");
        const receiptData = await receiptResponse.json();
  
        await apiRequest("POST", "/api/receipts", {
          receiptNumber: receiptData.receiptNumber,
          paymentId,
          invoiceNumber: null,
          receiptDate: new Date(),
          invoiceDate: new Date().toISOString().slice(0, 10),
          amount: totalPaymentAmount,
          paymentMethod: data.paymentMethod || "Cash",
          remarks: data.remarks,
        });
      }
  
      queryClient.invalidateQueries({ queryKey: ["/api/studentPayments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
  
      setIsNewPaymentDialogOpen(false);
      paymentForm.reset();
  
      toast({
        title: "Payment Success",
        description: "The payment and receipts have been created successfully.",
      });
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };  
  
  const onSubmitReceiptForm = async (data: ReceiptFormValues) => {
    console.log("Form submitted with data:", data);
    try {
      const receiptData = {
        ...data,
        paymentId: data.paymentId,
        receiptNumber: data.receiptNumber,
        receiptDate: data.receiptDate,
        invoiceDate: data.invoiceDate,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        remarks: data.remarks,
      };

      await apiRequest("POST", "/api/receipts", receiptData);
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });

      setIsNewReceiptDialogOpen(false);
      receiptForm.reset();
      toast({
        title: "Receipt created",
        description: "The receipt has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter payments based on status and search query
  const filteredPayments = payments?.filter((payment) => {
    const matchesStatus =
      activeTab === "all" ||
      (activeTab === "paid" && payment.status === "paid") ||
      (activeTab === "partially_paid" && payment.status === "partially_paid");

    const matchesSearch =
      searchQuery === "" ||
      (payment.paymentId && payment.paymentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (payment.studentId && payment.studentId.toString().includes(searchQuery));

    return matchesStatus && matchesSearch;
  });

  // Filter receipts (only show paid payments)
  const filteredReceipts = receipts?.filter((receipt) => {
    const matchesSearch =
      searchQuery === "" ||
      (receipt.paymentId && receipt.paymentId.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch;
  });

  // Get student name by id
  const getStudentName = (studentId: number | string): string => {
    const student = students?.find((s) => s.id === Number(studentId));
    return student ? `${student.firstName} ${student.lastName}` : "Unknown";
  };

  // Payment table columns
  const paymentColumns: ColumnDef<StudentPayment>[] = [
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
      accessorKey: "paymentId",
      header: "Payment ID",
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
      accessorKey: "paymentDate",
      header: "Payment Date",
      cell: ({ row }) => {
        return format(new Date(row.original.paymentDate), "MMM dd, yyyy");
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeVariant: "default" | "success" | "destructive" | "outline" | "secondary" = "outline";

        if (status === "paid") {
          badgeVariant = "default";
        } else if (status === "pending") {
          badgeVariant = "secondary";
        } else if (status === "failed") {
          badgeVariant = "destructive";
        } else if (status === "partially_paid") {
          badgeVariant = "outline";
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
      header: "Payment Method",
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

  // Receipt columns
  const receiptColumns: ColumnDef<Receipt>[] = [
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
      accessorKey: "receiptNumber",
      header: "Receipt Number",
      cell: ({ row }) => {
        const receiptNumber = row.getValue("receiptNumber") as string;
        return (
          <Link 
            href={`/admin/print-receipt/${receiptNumber}`} 
            className="text-blue-600 hover:underline"
          >
            {receiptNumber}
          </Link>
        );
      },
    },
    {
      accessorKey: "paymentId",
      header: "Payment ID",
    },
    {
      accessorKey: "receiptDate",
      header: "Date",
    },
    {
      accessorKey: "invoiceDate",
      header: "Invoice Date",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(Number(row.original.amount)),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            window.print();
          }}
        >
        </Button>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Payments & Receipts"
          description="Manage student payments and receipts"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.pendingPayments || 0)}</div>
              <p className="text-xs text-muted-foreground">35 pending invoices</p>
            </CardContent>
          </Card>

          {/* <Card>
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
          </Card> */}
        </div>

        <div>
          <div className="mb-6">
            <div className="flex flex-col gap-4">
              <Tabs value={activeTabReceipts} onValueChange={setActiveTabReceipts} className="w-full">
                <TabsList>
                  <TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger>
                  <TabsTrigger value="receipts" className="flex-1">Receipts</TabsTrigger>
                </TabsList>
              </Tabs>

              {activeTabReceipts === 'payments' ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="paid">Paid</TabsTrigger>
                      <TabsTrigger value="partially_paid">Partially Paid</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex gap-2">
                    {/* <Input
                      placeholder="Search by Payment ID or Student ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-[300px]"
                    /> */}
                    {/* <Button
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                      className="px-3"
                    >
                      Clear
                    </Button> */}
                    <Button onClick={() => setIsNewPaymentDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New Payment
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  {/* <Button onClick={() => setIsNewReceiptDialogOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Receipt
                  </Button> */}
                  {/* <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Receipts
                  </Button> */}
                </div>
              )}
            </div>
          </div>
          
          {activeTabReceipts === 'payments' ? (
          <DataTable
            columns={paymentColumns}
            data={filteredPayments}
            searchColumns={["paymentId", "studentId"]}
            searchPlaceholder="Search payments..."
          />

          ) : (
          <DataTable
            columns={receiptColumns}
            data={filteredReceipts}
            searchColumns={["receiptNumber", "paymentId"]}
            searchPlaceholder="Search receipts..."
          />
          )}

          {/* New Payment Dialog */}
          <Dialog open={isNewPaymentDialogOpen} onOpenChange={(open) => {
            setIsNewPaymentDialogOpen(open);
            if (!open) {
              paymentForm.reset();
            }
          }}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Payment</DialogTitle>
                <DialogDescription>
                  Create a new payment record for a student.
                </DialogDescription>
              </DialogHeader>

              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onSubmitPaymentForm)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={paymentForm.control}
                      name="paymentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment ID</FormLabel>
                          <FormControl>
                            <Input
                              // placeholder="Enter payment ID" 
                              {...field}
                              readOnly
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <ReactSelect
                            options={students.map((student: any) => ({
                              label: `${student.firstName} ${student.middleName} ${student.lastName} (${student.studentId})`,
                              value: student.id.toString(),
                            }))}
                            onChange={(option: any) => field.onChange(parseInt(option?.value || "0"))}
                            value={students
                              .map((student: any) => ({
                                label: `${student.firstName} ${student.middleName} ${student.lastName} (${student.studentId})`,
                                value: student.id.toString(),
                              }))
                              .find(opt => opt.value === field.value?.toString())}
                            isSearchable
                            placeholder="Select a student"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Numbers</FormLabel>
                          <FormControl>
                            <Controller
                              control={paymentForm.control}
                              name="invoiceNumber"
                              render={({ field: controllerField }) => (
                                <SelectMultiple
                                  isMulti
                                  options={unpaidInvoices.map((invoice: any) => ({
                                    label: createLabel(invoice),
                                    value: invoice.invoiceNumber,
                                  }))}
                                  value={unpaidInvoices
                                    .filter((inv: any) => controllerField.value?.includes(inv.invoiceNumber))
                                    .map((inv: any) => ({
                                      label: createLabel(inv),
                                      value: inv.invoiceNumber,
                                    }))}
                                  onChange={(selected) =>
                                    controllerField.onChange(selected.map((item) => item.value))
                                  }
                                  placeholder="Select invoices"
                                />
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* <FormField
  control={paymentForm.control}
  name="invoiceNumber"
  render={({ field }) => ( // Use this 'field' object directly
    <FormItem>
      <FormLabel>Invoice Numbers</FormLabel>
      <FormControl>
        <SelectMultiple
          isMulti
          options={unpaidInvoices.map((invoice: any) => ({
            label: createLabel(invoice),
            value: invoice.invoiceNumber,
          }))}
          // The `field.value` will be an array of strings, e.g., ['INV-001']
          value={unpaidInvoices
            .filter((inv: any) => field.value?.includes(inv.invoiceNumber))
            .map((inv: any) => ({
              label: createLabel(inv),
              value: inv.invoiceNumber,
            }))}
          // The `field.onChange` expects the final value (an array of strings)
          onChange={(selectedOptions) =>
            field.onChange(selectedOptions.map((item: any) => item.value))
          }
          placeholder="Select invoices"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/> */}
                    <FormField
                      control={paymentForm.control}
                      name="invoiceAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Amount</FormLabel>
                          <FormControl>
                            <Input
                              // type="number"
                              readOnly
                              // placeholder="Enter invoice amount" 
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
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Received Amount</FormLabel>
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
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Date</FormLabel>
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
                              <SelectItem value="partially_paid">Partially Paid</SelectItem>
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
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="stripe">Stripe</SelectItem>
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
                  </div>

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
                      <h3 className="text-lg font-bold">{selectedPayment.paymentId}</h3>
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
                        <span className="font-medium">Payment Date:</span> {format(new Date(selectedPayment.paymentDate), "MMMM dd, yyyy")}
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
                        {/* <tr>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">
                            Course Fee
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-neutral-900 font-mono">
                            {formatCurrency(Number(selectedPayment.amount))}
                          </td>
                        </tr> */}
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
                    {/* <Button>
                      <Receipt className="mr-2 h-4 w-4" />
                      Download Invoice
                    </Button> */}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* New Receipt Dialog */}
          <Dialog open={isNewReceiptDialogOpen} onOpenChange={setIsNewReceiptDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Receipt</DialogTitle>
                <DialogDescription>
                  Add a new receipt.
                </DialogDescription>
              </DialogHeader>
              <Form {...receiptForm}>
                <form onSubmit={receiptForm.handleSubmit(onSubmitReceiptForm)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={receiptForm.control}
                      name="receiptNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receipt Number</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={receiptForm.control}
                      name="receiptDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receipt Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field}
                              value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                              onChange={e => field.onChange(new Date(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={receiptForm.control}
                      name="invoiceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field}
                              value={field.value ? field.value : ""}
                              onChange={(e) => field.onChange(e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={receiptForm.control}
                      name="paymentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment ID</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Payment ID" />
                              </SelectTrigger>
                              <SelectContent>
                                {payments.map((payment) => (
                                  <SelectItem key={payment.id} value={String(payment.paymentId)}>
                                    {payment.paymentId}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={receiptForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={receiptForm.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Payment Method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="online">Online Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={receiptForm.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Receipt</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppShell>
  );
}
