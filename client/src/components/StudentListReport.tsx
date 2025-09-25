// components/StudentListReport.tsx
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
    
interface StudentListReportProps {
    studentData: any[];
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
    filter_Conditions: FilterCondition[]; // Add this prop
    startDate: string | null; // Add this prop
    endDate: string | null; 
}

export function StudentListReport({
    studentData,
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
    filter_Conditions, // Receive from parent
    startDate,        // Receive from parent
    endDate, 
}: StudentListReportProps) {

    // Removed local state for startDate and endDate as they are now props
    // const [startDate, setStartDate] = useState<string>('');
    // const [endDate, setEndDate] = useState<string>('');

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
        { label: "Discontinued", value: "Discontinued" },
    ];

    const fieldOptions = [
        { label: "Student Name", value: "fullName" },
        { label: "Email", value: "email" },
        { label: "Branch", value: "branch_name" },
        { label: "Brand", value: "brand_name" },
        { label: "Department", value: "department_name" },
        { label: "Batch", value: "batch_name" },
        { label: "Course", value: "course_name" },
        { label: "Teacher", value: "teacher_name" },
        { label: "Status", value: "computed_status" },
    ];

    const sortedStudents = useMemo(() => {
        if (!studentData) return [];
        return [...studentData].sort((a, b) =>
            (a.fullName || "").localeCompare(b.fullName || "")
        );
        }, [studentData]);


    const getValueOptions = (fieldValue: string) => {
        switch (fieldValue) {
            case 'fullName':
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
            case 'computed_status':
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
            'fullName',
            'branch_name',
            'brand_name',
            'department_name',
            'batch_name',
            'course_name',
            'teacher_name',
            'computed_status'
        ].includes(field);
    };

    // New helper function to determine if the operator allows multi-select
    const isMultiSelectOperator = (operator: string) => {
        return operator === "equals" || operator === "notEquals";
    };

    const addFilterCondition = () => {
        const newConditions = [...filter_Conditions, { 
            id: Date.now().toString(), 
            field: '', 
            operator: 'equals', 
            value: '' // Default to empty string for single select
        }];
        onFiltersChange(newConditions); // Update parent state
    };

    const removeFilterCondition = (id: string) => {
        if (filter_Conditions.length > 1) {
            const newConditions = filter_Conditions.filter(c => c.id !== id);
            onFiltersChange(newConditions); // Update parent state
        }
    };
    

    const updateFilterCondition = (id: string, field: keyof FilterCondition, value: any) => { // Changed type to any for flexibility
        const newConditions = filter_Conditions.map(c => {
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
        onFiltersChange(newConditions); // Update parent state
    };

    const handleDateChange = (dateValue: string, type: 'start' | 'end') => {
        onDateRangeChange({ 
            startDate: type === 'start' ? dateValue : startDate, 
            endDate: type === 'end' ? dateValue : endDate 
        });
    };


    const getStatusBadge = (status: string) => {
        const lowerStatus = status?.toLowerCase();
        if (lowerStatus === 'active') {
            return <Badge variant="default" className="bg-green-500">Active</Badge>;
        }
        if (lowerStatus === 'inactive') {
            return <Badge variant="secondary">Inactive</Badge>;
        }
        if (lowerStatus === 'discontinued') {
            return <Badge variant="destructive">Discontinued</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Student List Report</CardTitle>
                <CardDescription>
                    A comprehensive list of all students with advanced filtering.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Date Range Section */}
                {/* Uncomment and use if date range filtering is desired for registration dates */}
                {/* <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium mb-1">From Registration Date</label>
                        <Input
                            type="date"
                            id="start-date"
                            value={startDate || ''}
                            onChange={(e) => handleDateChange(e.target.value, 'start')}
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium mb-1">To Registration Date</label>
                        <Input
                            type="date"
                            id="end-date"
                            value={endDate || ''}
                            onChange={(e) => handleDateChange(e.target.value, 'end')}
                        />
                    </div>
                </div> */}

                {/* Advanced Filter Section */}
                <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Advanced Filters</h4>
                        <Button type="button" variant="outline" size="sm" onClick={addFilterCondition} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add Filter
                        </Button>
                    </div>
                    {filter_Conditions.map((condition) => (
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
                            {filter_Conditions.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeFilterCondition(condition.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {isLoading ? (
                    <div className="text-center py-8">Loading and processing student data...</div>
                ) : (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr. No</TableHead> 
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Brand</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Batch</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Registration Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedStudents?.map((student, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{index + 1}</TableCell> {/* Serial number */}
                                        <TableCell className="font-medium">{student.fullName}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        <TableCell>{student.branch_name}</TableCell>
                                        <TableCell>{student.brand_name}</TableCell>
                                        <TableCell>{student.department_name}</TableCell>
                                        <TableCell>{student.batch_name}</TableCell>
                                        <TableCell>{student.course_name}</TableCell>
                                        <TableCell>{student.teacher_name}</TableCell>
                                        <TableCell>{getStatusBadge(student.computed_status)}</TableCell>
                                        <TableCell>
                                            {student.created_at && isValid(new Date(student.created_at))
                                                ? format(new Date(student.created_at), "MMM d, yyyy")
                                                : "N/A"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sortedStudents?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-4">
                                            No students found matching your criteria.
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