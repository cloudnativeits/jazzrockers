// components/InvoiceReport.tsx
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ReactSelect from "react-select";
import { Batch, Course, Department, Employee, Student, Brand, Branch } from "@shared/schema";
import { Input } from "@/components/ui/input";

interface FilterCondition {
    id: string;
    field: string;
    operator: string;
    value: string | string[]; // Changed to string | string[]
}

interface InvoiceReportProps {
    invoiceData: any[];
    isLoading: boolean;
    brands: Brand[];
    departments: Department[];
    courses: Course[];
    teachers: Employee[];
    batches: Batch[];
    students: Student[];
    branches: Branch[];
    onFiltersChange: (filters: FilterCondition[]) => void;
    onDateRangeChange: (dates: { startDate: string | null; endDate: string | null }) => void;
    filterConditions: FilterCondition[];
}

export function InvoiceReport({
    invoiceData,
    isLoading,
    brands,
    departments,
    courses,
    teachers,
    batches,
    students,
    branches,
    onFiltersChange,
    onDateRangeChange,
    filterConditions,
}: InvoiceReportProps) {

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [dateField, setDateField] = useState<'issueDate' | 'dueDate'>('issueDate');

    const operatorOptions = [
        { label: "Equals", value: "equals" },
        { label: "Not Equals", value: "notEquals" },
        { label: "Contains", value: "contains" },
        { label: "Not Contains", value: "notContains" },
        { label: "Starts With", value: "startsWith" },
        { label: "Ends With", value: "endsWith" },
        { label: "Is Empty", value: "isEmpty" },
        { label: "Is Not Empty", value: "isNotEmpty" },
        { label: "Greater Than", value: "greaterThan" },
        { label: "Less Than", value: "lessThan" },
    ];

    const fieldOptions = [
        { label: "Invoice Number", value: "invoice_number" },
        { label: "Student Name", value: "student_name" },
        { label: "Registration Type", value: "is_re_registering" },
        { label: "Branch", value: "branch_name" },
        { label: "Brand", value: "brand_name" },
        { label: "Department", value: "department_name" },
        { label: "Course", value: "course_name" },
        { label: "Batch", value: "batch_name" },
        { label: "Teacher", value: "teacher_name" },
        { label: "Total Amount", value: "totalAmount" },
        { label: "Amount Paid", value: "amountPaid" },
        { label: "Balance Due", value: "balanceDue" },
        { label: "Status", value: "status" },
    ];

    const statusOptions = [
        { label: "Paid", value: "paid" },
        { label: "Partially Paid", value: "partially_paid" },
        { label: "Unpaid", value: "unpaid" },
    ];

    const sortedData = useMemo(() => {
        if (!invoiceData) return [];
        return [...invoiceData].sort((a, b) =>
            (a.student_name || "").localeCompare(b.student_name || "")
        );
    }, [invoiceData]);

    const getValueOptions = (fieldValue: string) => {
        switch (fieldValue) {
            case 'branch_name':
                return branches.map(b => ({ label: b.name, value: b.name }));
            case 'brand_name':
                return brands.map(b => ({ label: b.name, value: b.name }));
            case 'department_name':
                return departments.map(d => ({ label: d.name, value: d.name }));
            case 'course_name':
                return courses.map(c => ({ label: c.name, value: c.name }));
            case 'batch_name':
                return batches.map(b => ({ label: b.name, value: b.name }));
            case 'teacher_name':
                return teachers.map(t => ({ label: `${t.firstName} ${t.lastName}`, value: `${t.firstName} ${t.lastName}` }));
            case 'student_name':
                return students.map(s => ({ label: s.fullName || `${s.firstName} ${s.lastName}`, value: s.fullName || `${s.firstName} ${s.lastName}` }));
            case 'is_re_registering':
                return [{ label: "New Registration", value: "false" }, { label: "Re-Registration", value: "true" }];
            case 'status':
                return statusOptions;
            default:
                return [];
        }
    };

    const isValueInputDisabled = (operator: string) => {
        return operator === 'isEmpty' || operator === 'isNotEmpty';
    };

    const isDropdownField = (field: string) => {
        return [
            'branch_name',
            'brand_name',
            'department_name',
            'course_name',
            'batch_name',
            'teacher_name',
            'student_name',
            'is_re_registering',
            'status'
        ].includes(field);
    };

    const isNumericField = (field: string) => {
        return ['totalAmount', 'amountPaid', 'balanceDue'].includes(field);
    };

    // New helper function to determine if the operator allows multi-select
    const isMultiSelectOperator = (operator: string) => {
        return operator === "equals" || operator === "notEquals"; // Or any other operators you deem appropriate for multi-select
    };

    const addFilterCondition = () => {
        const newConditions = [...filterConditions, {
            id: Date.now().toString(),
            field: '',
            operator: 'equals',
            value: '' // Default to empty string for single select, can be [] for multi-select if desired
        }];
        onFiltersChange(newConditions); // Update parent state
    };

    const removeFilterCondition = (id: string) => {
        if (filterConditions.length > 1) {
            const newConditions = filterConditions.filter(c => c.id !== id);
            onFiltersChange(newConditions);
        }
    };

    const updateFilterCondition = (id: string, field: keyof FilterCondition, value: any) => { // Changed type to any for flexibility
        const newConditions = filterConditions.map(c => {
            if (c.id === id) {
                const updated = { ...c, [field]: value };
                if (field === 'field') {
                    updated.value = ''; // Reset value when field changes
                    updated.operator = 'equals'; // Reset operator to default
                }
                return updated;
            }
            return c;
        });
        onFiltersChange(newConditions);
    };

    const handleDateChange = (dateValue: string, type: 'start' | 'end') => {
        const newStartDate = type === 'start' ? (dateValue || null) : startDate;
        const newEndDate = type === 'end' ? (dateValue || null) : endDate;

        if (type === 'start') setStartDate(dateValue);
        if (type === 'end') setEndDate(dateValue);

        onDateRangeChange({ startDate: newStartDate, endDate: newEndDate });
    };

    const getStatusBadge = (status: string) => {
        const lowerStatus = status?.toLowerCase();
        if (lowerStatus === 'paid') {
            return <Badge variant="default" className="bg-green-500">Paid</Badge>;
        }
        if (lowerStatus === 'partially_paid') {
            return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Partially Paid</Badge>;
        }
        if (lowerStatus === 'unpaid') {
            return <Badge variant="destructive">Unpaid</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invoice Report</CardTitle>
                <CardDescription>
                    View and filter all student invoices.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Date Range Section */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium mb-1">From Date</label>
                        <Input
                            type="date"
                            id="start-date"
                            value={startDate}
                            onChange={(e) => handleDateChange(e.target.value, 'start')}
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium mb-1">To Date</label>
                        <Input
                            type="date"
                            id="end-date"
                            value={endDate}
                            onChange={(e) => handleDateChange(e.target.value, 'end')}
                        />
                    </div>
                </div>

                {/* Advanced Filter Section */}
                <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Advanced Filters</h4>
                        <Button type="button" variant="outline" size="sm" onClick={addFilterCondition} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add Filter
                        </Button>
                    </div>
                    {filterConditions.map((condition) => (
                        <div key={condition.id} className="flex items-center gap-2">
                            <div className="w-40">
                                <ReactSelect
                                    placeholder="Select Field..."
                                    options={fieldOptions}
                                    isClearable
                                    value={fieldOptions.find(opt => opt.value === condition.field) || null}
                                    onChange={(opt) => updateFilterCondition(condition.id, 'field', opt?.value || '')}
                                />
                            </div>
                            <div className="w-32">
                                <ReactSelect
                                    placeholder="Operator"
                                    options={operatorOptions}
                                    isClearable
                                    value={operatorOptions.find(opt => opt.value === condition.operator) || null}
                                    onChange={(opt) => updateFilterCondition(condition.id, 'operator', opt?.value || 'equals')}
                                />
                            </div>
                            <div className="flex-1">
                                {!isValueInputDisabled(condition.operator) && isDropdownField(condition.field) ? (
                                    <ReactSelect
                                        placeholder={`Select ${fieldOptions.find(f => f.value === condition.field)?.label || 'value'}`}
                                        options={getValueOptions(condition.field)}
                                        isClearable
                                        isSearchable
                                        isMulti={isMultiSelectOperator(condition.operator)} // Added isMulti prop
                                        value={
                                            isMultiSelectOperator(condition.operator) && Array.isArray(condition.value)
                                                ? getValueOptions(condition.field).filter(opt =>
                                                    condition.value.includes(opt.value)
                                                )
                                                : getValueOptions(condition.field).find(opt => opt.value === condition.value) || null
                                        }
                                        onChange={(selectedOptions) => {
                                            if (isMultiSelectOperator(condition.operator)) {
                                                // Handle multi-select
                                                const optionsArray = selectedOptions as any[];
                                                const values = optionsArray
                                                    ? optionsArray.map(opt => opt.value)
                                                    : [];
                                                updateFilterCondition(condition.id, 'value', values);
                                            } else {
                                                // Handle single select
                                                const option = selectedOptions as any;
                                                updateFilterCondition(condition.id, 'value', option?.value || '');
                                            }
                                        }}
                                    />
                                ) : (
                                    <Input
                                        type={isNumericField(condition.field) ? 'number' : 'text'}
                                        placeholder={
                                            isValueInputDisabled(condition.operator)
                                                ? "N/A"
                                                : `Enter ${fieldOptions.find(f => f.value === condition.field)?.label || 'value'}`
                                        }
                                        value={typeof condition.value === 'string' ? condition.value : ''} // Ensure value is a string for Input
                                        onChange={(e) => updateFilterCondition(condition.id, 'value', e.target.value)}
                                        disabled={isValueInputDisabled(condition.operator)}
                                        min={isNumericField(condition.field) ? "0" : undefined}
                                        step={isNumericField(condition.field) ? "0.01" : undefined}
                                    />
                                )}
                            </div>
                            {filterConditions.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeFilterCondition(condition.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Table and other components remain the same */}
                {isLoading ? (
                    <div className="text-center py-8">Loading invoice data...</div>
                ) : (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr. No</TableHead>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Amount Paid</TableHead>
                                    <TableHead>Balance Due</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead>Due Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedData?.map((invoice, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{index + 1}</TableCell> {/* Serial number */}
                                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                        <TableCell>
                                            {invoice.student_name}
                                            {invoice.is_re_registering && (
                                                <Badge variant="outline" className="ml-2">Re-Reg</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{invoice.branch_name}</TableCell>
                                        <TableCell>{invoice.course_name}</TableCell>
                                        <TableCell>{invoice.totalAmount}</TableCell>
                                        <TableCell>{invoice.amountPaid}</TableCell>
                                        <TableCell className={invoice.balanceDue > 0 ? "font-semibold text-red-600" : ""}>
                                            {invoice.balanceDue}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                        <TableCell>
                                            {invoice.issueDate && isValid(new Date(invoice.issueDate))
                                                ? format(new Date(invoice.issueDate), "MMM d, yyyy")
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {invoice.dueDate && isValid(new Date(invoice.dueDate))
                                                ? format(new Date(invoice.dueDate), "MMM d, yyyy")
                                                : "N/A"}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {/* ✅ Auto-sum row */}
                                {invoiceData?.length > 0 && (
                                    <TableRow className="font-semibold bg-gray-100">
                                        <TableCell colSpan={5} className="text-right">Total</TableCell>
                                        <TableCell>
                                            {sortedData.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            {sortedData.reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            {sortedData.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell colSpan={3}></TableCell>
                                    </TableRow>
                                )}

                                {sortedData?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center py-4">
                                            No invoices found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                    </div>
                )}
            </CardContent>
        </Card>
    );
}