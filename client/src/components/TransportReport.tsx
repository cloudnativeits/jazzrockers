// components/TransportReport.tsx
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ReactSelect from "react-select";
import { Batch, Course, Brand, Branch, Student } from "@shared/schema";
import { Input } from "@/components/ui/input";

interface FilterCondition {
    id: string;
    field: string;
    operator: string;
    value: string | string[];
}

interface TransportReportProps {
    transportData: any[];
    isLoading: boolean;
    brands: Brand[];
    branches: Branch[];
    batches: Batch[];
    courses: Course[];
    students: Student[];
    onFiltersChange: (filters: FilterCondition[]) => void;
    onDateRangeChange: (dates: { startDate: string | null; endDate: string | null }) => void;
    filterConditions: FilterCondition[];
}

export function TransportReport({
    transportData,
    isLoading,
    brands,
    branches,
    batches,
    courses,
    students,
    onFiltersChange,
    onDateRangeChange,
    filterConditions,
}: TransportReportProps) {

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

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
        { label: "Branch", value: "branch_name" },
        { label: "Brand", value: "brand_name" },
        { label: "Batch", value: "batch_name" },
        { label: "Course", value: "course_name" },
        { label: "Student", value: "student_name" },
        { label: "day", value: "picking_day"},
        { label: "Transport Mode", value: "mode" },
        { label: "Picking Point", value: "picking_point" },
        { label: "Dropping Point", value: "dropping_point" },
        { label: "Amount", value: "totalAmount" },
    ];
    const daysOptions = [
        {label: "Monday", value: "Monday"},
        {label: "Tuesday", value: "Tuesday"},
        {label: "Wednesday", value: "Wednesday"},
        {label: "Thuesday", value: "Thuesday"},
        {label: "Friday", value: "Friday"},
        {label: "Saturday", value: "Saturday"},
        {label: "Sunday", value: "Sunday"},
    ]

    const sortedTransportData = useMemo(() => {
        if (!transportData) return [];
        return [...transportData].sort((a, b) =>
            (a.student_name || "").localeCompare(b.student_name || "")
        );
        }, [transportData]);


    const getValueOptions = (fieldValue: string) => {
        switch (fieldValue) {
            case 'branch_name':
                return branches.map(b => ({ label: b.name, value: b.name }));
            case 'brand_name':
                return brands.map(b => ({ label: b.name, value: b.name }));
            case 'batch_name':
                return batches.map(b => ({ label: b.name, value: b.name }));
            case 'course_name':
                return courses.map(c => ({ label: c.name, value: c.name }));
            case 'student_name':
                return students.map(s => ({
                    label: s.fullName || `${s.firstName} ${s.lastName}`,
                    value: s.fullName || `${s.firstName} ${s.lastName}`
                }));
            case 'mode':
                // Get unique modes from the data
                const modes = [...new Set(transportData.map(item => item.mode))].filter(Boolean);
                return modes.map(m => ({ label: m, value: m }));
            case 'picking_point':
                // Get unique picking points from the data
                const pickingPoints = [...new Set(transportData.map(item => item.picking_point))].filter(Boolean);
                return pickingPoints.map(p => ({ label: p, value: p }));
            case 'dropping_point':
                // Get unique dropping points from the data
                const droppingPoints = [...new Set(transportData.map(item => item.dropping_point))].filter(Boolean);
                return droppingPoints.map(d => ({ label: d, value: d }));
            case 'picking_day':   // ✅ add this
                return daysOptions;
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
            'batch_name',
            'course_name',
            'student_name',
            'mode',
            'picking_point',
            'dropping_point',
            'picking_day'
        ].includes(field);
    };

    const isMultiSelectOperator = (operator: string) => {
        return operator === "equals" || operator === "notEquals";
    };

    const addFilterCondition = () => {
        const newConditions = [...filterConditions, {
            id: Date.now().toString(),
            field: '',
            operator: 'equals',
            value: ''
        }];
        onFiltersChange(newConditions);
    };

    const removeFilterCondition = (id: string) => {
        if (filterConditions.length > 1) {
            const newConditions = filterConditions.filter(c => c.id !== id);
            onFiltersChange(newConditions);
        }
    };

    const updateFilterCondition = (id: string, field: keyof FilterCondition, value: any) => {
        const newConditions = filterConditions.map(c => {
            if (c.id === id) {
                const updated = { ...c, [field]: value };
                if (field === 'field') {
                    updated.value = '';
                    updated.operator = 'equals';
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transport Revenue Report</CardTitle>
                <CardDescription>
                    View and filter revenue generated from transportation services.
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
                                        isMulti={isMultiSelectOperator(condition.operator)}
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
                                        type={condition.field === 'totalAmount' ? 'number' : 'text'}
                                        placeholder={
                                            isValueInputDisabled(condition.operator)
                                                ? "N/A"
                                                : `Enter ${fieldOptions.find(f => f.value === condition.field)?.label || 'value'}`
                                        }
                                        value={typeof condition.value === 'string' ? condition.value : ''}
                                        onChange={(e) => updateFilterCondition(condition.id, 'value', e.target.value)}
                                        disabled={isValueInputDisabled(condition.operator)}
                                        min={condition.field === 'totalAmount' ? "0" : undefined}
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

                {isLoading ? (
                    <div className="text-center py-8">Loading transport data...</div>
                ) : (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr. No</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Batch</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Picking Point</TableHead>
                                    <TableHead>Dropping Point</TableHead>
                                    <TableHead>Created Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTransportData?.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{index + 1}</TableCell> {/* Serial number */}
                                        <TableCell className="font-medium">{item.student_name}</TableCell>
                                        <TableCell>{item.branch_name}</TableCell>
                                        <TableCell>{item.batch_name}</TableCell>
                                        <TableCell>{item.mode}</TableCell>
                                        <TableCell>{item.picking_point}</TableCell>
                                        <TableCell>{item.dropping_point}</TableCell>
                                        <TableCell>
                                            {item.created_at && isValid(new Date(item.created_at))
                                                ? format(new Date(item.created_at), "MMM d, yyyy")
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{item.totalAmount}</TableCell>
                                    </TableRow>
                                ))}

                                {sortedTransportData?.length > 0 && (
                                    <TableRow className="font-semibold bg-gray-100">
                                        <TableCell colSpan={8} className="text-right">Total</TableCell>
                                        <TableCell className="text-right">
                                            {sortedTransportData.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {sortedTransportData?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-4">
                                            No transport data found matching your criteria.
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