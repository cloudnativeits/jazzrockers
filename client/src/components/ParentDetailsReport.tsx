// components/ParentDetailsReport.tsx
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

interface ParentDetailsReportProps {
    parentData: any[];
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

export function ParentDetailsReport({
    parentData,
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
}: ParentDetailsReportProps) {

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
    ];

    const statusOptions = [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
    ];

    const fieldOptions = [
        { label: "Parent Name", value: "parent_name" },
        { label: "Parent Phone", value: "parent_phone" },
        { label: "Parent Email", value: "parent_email" },
        { label: "Parent Status", value: "parent_status" },
        { label: "Student Name", value: "student_name" },
        { label: "Branch", value: "branch_name" },
        { label: "Brand", value: "brand_name" },
        { label: "Department", value: "department_name" },
        { label: "Batch", value: "batch_name" },
        { label: "Course", value: "course_name" },
        { label: "Teacher", value: "teacher_name" },
    ];

    const sortedParents = useMemo(() => {
    if (!parentData) return [];
    return [...parentData].sort((a, b) =>
        (a.parent_name || "").localeCompare(b.parent_name || "")
    );
    }, [parentData]);


    // Memoize value options to prevent unnecessary recalculations
    const getValueOptions = useMemo(() => {
        const options: Record<string, Array<{label: string, value: string}>> = {
            parent_status: statusOptions,
            student_name: students.map(s => ({ 
                label: s.fullName || `${s.firstName} ${s.lastName}`, 
                value: s.fullName || `${s.firstName} ${s.lastName}` 
            })),
            branch_name: branches.map(b => ({ label: b.name, value: b.name })),
            brand_name: brands.map(b => ({ label: b.name, value: b.name })),
            department_name: departments.map(d => ({ label: d.name, value: d.name })),
            batch_name: batches.map(b => ({ label: b.name, value: b.name })),
            course_name: courses.map(c => ({ label: c.name, value: c.name })),
            teacher_name: teachers.map(t => ({ 
                label: `${t.firstName} ${t.lastName}`, 
                value: `${t.firstName} ${t.lastName}` 
            })),
        };

        return (fieldValue: string) => options[fieldValue] || [];
    }, [brands, departments, courses, teachers, batches, students, branches]);

    const isValueInputDisabled = (operator: string) => {
        return operator === 'isEmpty' || operator === 'isNotEmpty';
    };

    const isDropdownField = (field: string) => {
        return [
            'parent_status',
            'student_name',
            'branch_name',
            'brand_name',
            'department_name',
            'batch_name',
            'course_name',
            'teacher_name'
        ].includes(field);
    };

    // New helper function to determine if the operator allows multi-select
    const isMultiSelectOperator = (operator: string) => {
        return operator === "equals" || operator === "notEquals";
    };

    const addFilterCondition = () => {
        const newConditions = [...filterConditions, { 
            id: Date.now().toString(), 
            field: '', 
            operator: 'equals', 
            value: '' // Default to empty string for single select
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
        if (lowerStatus === 'active') {
            return <Badge variant="default" className="bg-green-500">Active</Badge>;
        }
        if (lowerStatus === 'inactive') {
            return <Badge variant="secondary">Inactive</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Parent's Details Report</CardTitle>
                <CardDescription>
                    A list of parents, filterable by their child's enrollment details.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Date Range Section */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium mb-1">From Registration Date</label>
                        <Input
                            type="date"
                            id="start-date"
                            value={startDate}
                            onChange={(e) => handleDateChange(e.target.value, 'start')}
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium mb-1">To Registration Date</label>
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
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>
                            <div className="w-32">
                                <ReactSelect
                                    placeholder="Operator"
                                    options={operatorOptions}
                                    isClearable
                                    value={operatorOptions.find(opt => opt.value === condition.operator) || null}
                                    onChange={(opt) => updateFilterCondition(condition.id, 'operator', opt?.value || 'equals')}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
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
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        filterOption={(option, input) => 
                                            option.label.toLowerCase().includes(input.toLowerCase())
                                        }
                                        noOptionsMessage={({ inputValue }) => 
                                            inputValue ? `No results found for "${inputValue}"` : "No options available"
                                        }
                                    />
                                ) : (
                                    <Input
                                        type="text"
                                        placeholder={
                                            isValueInputDisabled(condition.operator)
                                                ? "N/A"
                                                : `Enter ${fieldOptions.find(f => f.value === condition.field)?.label || 'value'}`
                                        }
                                        value={typeof condition.value === 'string' ? condition.value : ''} // Ensure value is a string
                                        onChange={(e) => updateFilterCondition(condition.id, 'value', e.target.value)}
                                        disabled={isValueInputDisabled(condition.operator)}
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
                    <div className="text-center py-8">Loading and processing parent data...</div>
                ) : (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr. No</TableHead> {/* Serial number */}
                                    <TableHead>Parent Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Registration Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedParents?.map((parent, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{index + 1}</TableCell> {/* Serial number */}
                                        <TableCell className="font-medium">{parent.parent_name}</TableCell>
                                        <TableCell>{parent.parent_phone}</TableCell>
                                        <TableCell>{parent.parent_email}</TableCell>
                                        <TableCell>{getStatusBadge(parent.parent_status)}</TableCell>
                                        <TableCell>{parent.student_name}</TableCell>
                                        <TableCell>{parent.branch_name}</TableCell>
                                        <TableCell>
                                            {parent.created_at && isValid(new Date(parent.created_at))
                                                ? format(new Date(parent.created_at), "MMM d, yyyy")
                                                : "N/A"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sortedParents?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-4">
                                            No parent data found matching your criteria.
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