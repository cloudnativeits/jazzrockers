// components/DiscontinuedReport.tsx
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ReactSelect from "react-select";
import { Batch, Course, Department, Employee, Student, Brand, Branch } from "@shared/schema";
import { Input } from "@/components/ui/input";

interface FilterCondition {
    id: string;
    field: string;
    operator: string;
    value: string | string[];
}

interface DiscontinuedReportProps {
    discontinuedData: any[];
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

export function DiscontinuedReport({
    discontinuedData,
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
}: DiscontinuedReportProps) {

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
        { label: "Absent", value: "absent" },
        { label: "Cancelled", value: "cancelled" },
    ];

    const fieldOptions = [
        { label: "Student Name", value: "student_name" },
        { label: "Branch", value: "branch_name" },
        { label: "Brand", value: "brand_name" },
        { label: "Department", value: "department_name" },
        { label: "Batch", value: "batch_name" },
        { label: "Course", value: "course_name" },
        { label: "Teacher", value: "teacher_name" },
        { label: "Status", value: "status" },
    ];

    // Inside DiscontinuedReport
        const sortedData = useMemo(() => {
            if (!discontinuedData) return [];

            return [...discontinuedData].sort((a, b) => {
                const nameA = a.student_name?.toLowerCase() || "";
                const nameB = b.student_name?.toLowerCase() || "";
                return nameA.localeCompare(nameB);
            });
        }, [discontinuedData]);


    const getValueOptions = (fieldValue: string) => {
        switch (fieldValue) {
            case 'student_name':
                return students.map(s => ({ 
                    label: s.fullName || `${s.firstName} ${s.lastName}`, 
                    value: s.fullName || `${s.firstName} ${s.lastName}` 
                }));
            case 'branch_name':
                return branches.map(b => ({ label: b.name, value: b.name }));
            case 'brand_name':
                return brands.map(b => ({ label: b.name, value: b.name }));
            case 'department_name':
                return departments.map(d => ({ label: d.name, value: d.name }));
            case 'batch_name':
                return batches.map(b => ({ label: b.name, value: b.name }));
            case 'course_name':
                return courses.map(c => ({ label: c.name, value: c.name }));
            case 'teacher_name':
                return teachers.map(t => ({ 
                    label: `${t.firstName} ${t.lastName}`, 
                    value: `${t.firstName} ${t.lastName}` 
                }));
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
            'student_name',
            'branch_name',
            'brand_name',
            'department_name',
            'batch_name',
            'course_name',
            'teacher_name',
            'status'
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

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'absent':
                return <Badge variant="destructive">Absent</Badge>;
            case 'cancelled':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Discontinued Students Report</CardTitle>
                <CardDescription>
                    Students whose last attendance was 'absent' or 'cancelled' 30 or more days ago.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Date Range Section */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium mb-1">From Last Attendance Date</label>
                        <Input
                            type="date"
                            id="start-date"
                            value={startDate}
                            onChange={(e) => handleDateChange(e.target.value, 'start')}
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium mb-1">To Last Attendance Date</label>
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
                                        type="text"
                                        placeholder={
                                            isValueInputDisabled(condition.operator)
                                                ? "N/A"
                                                : `Enter ${fieldOptions.find(f => f.value === condition.field)?.label || 'value'}`
                                        }
                                        value={typeof condition.value === 'string' ? condition.value : ''}
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
                    <div className="text-center py-8">Processing student data...</div>
                ) : (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr. No</TableHead> 
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Brand</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Batch</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Last Attendance Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedData?.map((student, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{index + 1}</TableCell> {/* Serial number */}
                                        <TableCell className="font-medium">{student.student_name}</TableCell>
                                        <TableCell>{student.branch_name}</TableCell>
                                        <TableCell>{student.brand_name}</TableCell>
                                        <TableCell>{student.department_name}</TableCell>
                                        <TableCell>{student.batch_name}</TableCell>
                                        <TableCell>{student.course_name}</TableCell>
                                        <TableCell>{student.teacher_name}</TableCell>
                                        <TableCell>
                                            {student.date ? format(new Date(student.date), "MMM d, yyyy") : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(student.status)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {discontinuedData?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-4">
                                            No discontinued students found matching your criteria.
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