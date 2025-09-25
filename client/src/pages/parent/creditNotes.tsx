import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { capitalizeFirstLetter, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Link } from "wouter";
import { FixedFooter } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";

export default function ParentCreditNotes() {
    const [activeTab, setActiveTab] = useState("approved");
    const { user } = useAuth();

    const { data: creditNotes = [] } = useQuery({
        queryKey: ["/api/creditNotes/parent", user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
          const response = await fetch(`/api/creditNotes/parent/${user?.id}?status=approved,open`);
          if (!response.ok) {
            throw new Error("Failed to fetch credit notes");
          }
          return response.json();
        },
      });

    const mappedPayments = useMemo(() => creditNotes.map((p: any) => ({
        id: p.creditNotes.id,
        creditNoteNumber: p.creditNotes.creditNoteNumber,
        studentName: `${p.firstName} ${p.middleName} ${p.lastName}`,
        appliedToType: p.creditNotes.appliedToType,
        invoiceNumber: p.invoiceNumber,
        amount: Number(p.creditNotes.amount),
        generatedMonth: p.creditNotes.generatedMonth,
        reason: p.creditNotes.reason,
        status: p.creditNotes.status,
        createdAt: p.creditNotes.createdAt
      })), [creditNotes]);
    
      const filteredPayments = useMemo(() => {
        if (activeTab === "approved") {
          return mappedPayments.filter((p: any) => p.status === "approved");
        } else {
          return mappedPayments.filter((p: any) => p.status === "open");
        }
      }, [mappedPayments, activeTab]);
    
    const columns: ColumnDef<any>[] = [
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
                        href={`/parent/print-credit-note/${creditNoteNumber}`} 
                        className="text-blue-600 hover:underline"
                    >
                        {creditNoteNumber}
                    </Link>
                );
            },
        },
        {
            accessorKey: "studentName", 
            header: "Student",
            cell: ({ row }) => {
                const student = row.getValue("studentName") as string;
                return student ?
                    <div>{student}</div> :
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
            accessorKey: "invoiceNumber",
            header: "Invoice Number",
            cell: ({ row }) => {
                return row.original.invoiceNumber;
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
                } else if (status === "approved") {
                    badgeVariant = "default";
                }

                return (
                    <Badge variant={badgeVariant}>
                        {capitalizeFirstLetter(status)}
                    </Badge>
                );
            },
        },
    ];

    return (
        <AppShell>
            <PageHeader
                title="Credit Notes"
                description="View credit notes for students."
            />
            <Tabs defaultValue="approved" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="open">Open</TabsTrigger>
                </TabsList>
            </Tabs>
            <DataTable
                columns={columns}
                data={filteredPayments}
                searchColumns={["studentId"]}
                searchPlaceholder="Search credit note..."
            />

            <FixedFooter user={user} />
        </AppShell>
    );
}
