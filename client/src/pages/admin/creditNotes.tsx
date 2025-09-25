import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    PlusCircle,
    CalendarRange,
    Download,
    FileText,
    Eye,
    Check,
    CreditCard,
    Calculator,
    TrendingUp,
    ArrowUpDown,
    Minus
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Payroll, Employee, CreditNote, Student, creditNotes } from "@shared/schema";
import { capitalizeFirstLetter, extractMonth, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ReactSelect from "react-select";
import SelectMultiple from "react-select";
import { Link } from "wouter";

const creditNoteFormSchema = z.object({
    creditNoteNumber: z.string(),
    studentId: z.number({
        required_error: "Please select a student",
    }),
    appliedInvoiceId: z.number().optional(),
    amount: z.number({
        required_error: "Amount is required",
    }).min(1, "Amount must be greater than 0"),
    generatedMonth: z.string({
        required_error: "Generated month is required",
    }),
    appliedToType: z.string().optional(),
    reason: z.string({
        required_error: "Reason is required",
    }),
    status: z.string({
        required_error: "Status is required",
    }),
});

type CreditNoteFormValues = z.infer<typeof creditNoteFormSchema>;

export default function CreditNotes() {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
    const [activeTab, setActiveTab] = useState("all");
    const [isViewDialog, setIsViewDialog] = useState(false);
    const [isCreateDialog, setIsCreateDialog] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const { toast } = useToast();

    const queryClient = useQueryClient();

    const { data: creditNotes = [], isLoading } = useQuery<CreditNote[]>({
        queryKey: ["/api/creditNotes"],
    });

    const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
        queryKey: ["/api/students"],
    });

    const creditNoteForm = useForm<CreditNoteFormValues>({
        resolver: zodResolver(creditNoteFormSchema),
        defaultValues: {
            creditNoteNumber: "",
            studentId: 0,
            amount: 0,
            generatedMonth: format(new Date(), "yyyy-MM"),
            appliedInvoiceId: 0,
            appliedToType: "",
            reason: "",
            status: "",
        },
    });

    const appliedToType = creditNoteForm.watch("appliedToType");

    const selectedStudentId = useWatch({
        control: creditNoteForm.control,
        name: "studentId",
    });

    const {
        data: invoices = [],
        isLoading: isLoadingInvoices,
    } = useQuery({
        queryKey: ["invoices", selectedStudentId],
        queryFn: async () => {
            if (!selectedStudentId) return [];
            const res = await fetch(`/api/invoicesByStudent/${selectedStudentId}`);
            return res.json();
        },
        enabled: !!selectedStudentId,
    });

    const getStudentName = (studentId: number | string): string => {
        const student = students?.find((s) => s.id === Number(studentId));
        return student ? `${student.firstName} ${student.lastName}` : "Unknown";
    };

    const currentYear = new Date().getFullYear();
    const monthsOfYear = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ].map((month) => `${month}-${currentYear}`);
    // const monthsOfYear = [
    //     "January", "February", "March", "April", "May", "June",
    //     "July", "August", "September", "October", "November", "December"
    // ];

    // Credit note table columns
    const columns: ColumnDef<CreditNote>[] = [
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
            accessorKey: "creditNoteNumber",
            header: "Credit Note Number",
            cell: ({ row }) => {
                const creditNoteNumber = row.getValue("creditNoteNumber") as string;
                return (
                    <Link 
                        href={`/admin/print-credit-note/${creditNoteNumber}`} 
                        className="text-blue-600 hover:underline"
                    >
                        {creditNoteNumber}
                    </Link>
                );
            },
        },
        {
            accessorKey: "studentId",
            header: "Student",
            cell: ({ row }) => {
                const student = students.find((student) => student.id === row.original.studentId);
                return student ?
                    <div>{getStudentName(student.id)}</div> :
                    <div>Unknown</div>;
            },
        },
        {
            accessorKey: "appliedToType",
            header: "Applied To Type",
            cell: ({ row }) => {
                return capitalizeFirstLetter(row.original.appliedToType || "");
            },
        },
        {
            accessorKey: "appliedInvoiceId",
            header: "Applied Invoice",
            cell: ({ row }) => {
                const invoice = invoices.find((invoice: any) => invoice.id === row.original.appliedInvoiceId);
                return invoice ?
                    <div className="font-medium">{invoice.invoiceNumber}</div> :
                    <div>Unknown</div>;
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
            accessorKey: "generatedMonth",
            header: "Generated Month",
            cell: ({ row }) => {
                return row.original.generatedMonth;
            },
        },
        {
            accessorKey: "reason",
            header: "Reason",
            cell: ({ row }) => {
                return row.original.reason;
            },
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({ row }) => {
                const date = row.original.createdAt;
                return date ? format(new Date(date), "MMM dd, yyyy") : "-";
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                let badgeVariant: "default" | "success" | "secondary" | "destructive" | "outline" | null | undefined = "default";

                if (status === "open") {
                    badgeVariant = "secondary";
                } else if (status === "applied") {
                    badgeVariant = "default";
                }

                return (
                    <Badge variant={badgeVariant}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const payroll = row.original;

                return (
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewPayroll(payroll)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        {payroll.status === "processed" && (
                            <Button variant="ghost" size="icon" className="text-green-600">
                                <Check className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    const onSubmitCreditNoteForm = async (data: CreditNoteFormValues) => {
        if (!data.reason || data.reason.trim().length < 5) {
            toast({
                title: "Validation Error",
                description: "Please provide a valid reason.",
                variant: "destructive",
            });
            return;
        }    
        try {
            const creditNoteData = {
                ...data,
                creditNoteNumber: data.creditNoteNumber,
                studentId: data.studentId,
                appliedInvoiceId: data.appliedInvoiceId,
                amount: data.amount,
                generatedMonth: data.generatedMonth,
                reason: data.reason,
                status: "approved",
            };
            await apiRequest("POST", "/api/creditNotes", creditNoteData);
            queryClient.invalidateQueries({ queryKey: ["/api/creditNotes"] });

            setIsCreateDialog(false);
            creditNoteForm.reset();
            toast({
                title: "Success",
                description: "Credit note created successfully",
            });
            queryClient.invalidateQueries({ queryKey: ['allCreditNotesData'] });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create credit note.",
                variant: "destructive",
            });
        }
    };

    //   const handleViewCreditNote = (creditNote: CreditNote) => {
    //     setSelectedCreditNote(creditNote);
    //     setIsViewDialog(true);
    //   };

    useEffect(() => {
        if (creditNotes.length > 0) {
            const lastNote = creditNotes
                .map(note => parseInt(note.creditNoteNumber?.replace("CN-", "") || "0"))
                .sort((a, b) => b - a)[0];

            const nextNumber = lastNote + 1 || 101;
            creditNoteForm.setValue("creditNoteNumber", `CN-${nextNumber}`);
        } else {
            creditNoteForm.setValue("creditNoteNumber", "CN-101");
        }
    }, [creditNotes]);


    return (
        <AppShell>
            <PageHeader
                title="Credit Notes"
                description="Manage credit notes for students."
                actions={
                    <Button onClick={() => setIsCreateDialog(true)}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Credit Note
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={creditNotes}
                searchColumns={["studentId"]}
                searchPlaceholder="Search credit note..."
            />

            {/* Create Credit Note Dialog */}
            <Dialog open={isCreateDialog} onOpenChange={(open) => {
                setIsCreateDialog(open);
                if (!open) {
                    creditNoteForm.reset();
                }
            }}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Credit Note</DialogTitle>
                        <DialogDescription>
                            Create a new credit note for a student.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...creditNoteForm}>
                        <form onSubmit={creditNoteForm.handleSubmit(onSubmitCreditNoteForm)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={creditNoteForm.control}
                                    name="creditNoteNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Credit Note Number</FormLabel>
                                            <Input {...field} readOnly />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={creditNoteForm.control}
                                    name="studentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Student</FormLabel>
                                            <ReactSelect
                                                options={students.map((student: any) => ({
                                                    label: `${getStudentName(student.id)}`,
                                                    value: student.id.toString(),
                                                }))}
                                                onChange={(option: any) => field.onChange(parseInt(option?.value || "0"))}
                                                value={students
                                                    .map((student: any) => ({
                                                        label: `${getStudentName(student.id)}`,
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
                                    control={creditNoteForm.control}
                                    name="appliedToType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Applied To Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="against invoice">Against Invoice</SelectItem>
                                                    <SelectItem value="own account">Own Account</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {appliedToType === "against invoice" && (
                                    <FormField
                                    control={creditNoteForm.control}
                                    name="appliedInvoiceId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invoice</FormLabel>
                                            <ReactSelect
                                                options={invoices.map((invoice: any) => ({
                                                    label: `${invoice.invoiceNumber}`,
                                                    value: invoice.id.toString(),
                                                }))}
                                                onChange={(option: any) => field.onChange(parseInt(option?.value || "0"))}
                                                value={invoices
                                                    .map((invoice: any) => ({
                                                        label: `${invoice.invoiceNumber}`,
                                                        value: invoice.id.toString(),
                                                    }))
                                                    .find((opt: any) => opt.value === field.value?.toString())}
                                                isSearchable
                                                placeholder="Select an invoice"
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                )}
                                
                                <FormField
                                    control={creditNoteForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount</FormLabel>
                                            <Input {...field} type="number" value={field.value}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={creditNoteForm.control}
                                    name="generatedMonth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Generated Month</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a month" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {monthsOfYear.map((monthYear) => {
                                                        const [month, year] = monthYear.split("-");
                                                        return (
                                                        <SelectItem key={monthYear} value={monthYear}>
                                                            {month} {year}
                                                        </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* <FormField
                                    control={creditNoteForm.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Open</SelectItem>
                                                    <SelectItem value="applied">Applied</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                /> */}
                                <FormField
                                    control={creditNoteForm.control}
                                    name="reason"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reason</FormLabel>
                                            <Input {...field} />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialog(false)}>Cancel</Button>
                                <Button type="submit">Create Credit Note</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
}
