// components/BatchAttendanceReport.tsx
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ReactSelect from "react-select";
import { Batch, Course, Department, Employee, Student, Brand, Branch } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface FilterCondition {
    id: string;
    field: string;
    operator: string;
    value: string | string[]; // Allow both single and multiple values
}

interface BatchAttendanceReportProps {
    batchAttendanceData: any[];
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
    startDate: string | null;
    endDate: string | null;
}

export function BatchAttendanceReport({
    batchAttendanceData,
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
    startDate,
    endDate,
}: BatchAttendanceReportProps) {

    // const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([
    //     { id: '1', field: '', operator: 'equals', value: '' }
    // ]);
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

    const fieldOptions = [
        { label: "Student", value: "student" },
        { label: "Student ID", value: "student_id" },
        { label: "Branch", value: "branch" },
        { label: "Brand", value: "brand" },
        { label: "Status", value: "status" },
        { label: "Department", value: "department" },
        { label: "Batch", value: "batch" },
        { label: "Course", value: "course" },
        { label: "Teacher", value: "teacher" },
    ];
    const statusOptions = [
        { label: "Present", value: "present" },
        { label: "Absent", value: "absent" },
        { label: "Leave", value: "leave" },
        { label: "Compensation", value: "compensation" },
    ];

    // Sort the data alphabetically by student name
    const sortedBatchAttendanceData = useMemo(() => {
        if (!batchAttendanceData) return [];
        
        return [...batchAttendanceData].sort((a, b) => {
            const nameA = a.studentName?.toLowerCase() || '';
            const nameB = b.studentName?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
        });
    }, [batchAttendanceData]);

    const getValueOptions = (fieldValue: string) => {
        switch (fieldValue) {
            case 'student':
                return students.map(s => ({
                    label: s.fullName || `${s.firstName} ${s.lastName}`,
                    value: s.id.toString(),
                    originalValue: s.fullName || `${s.firstName} ${s.lastName}`
                }));
            case 'student_id':
                return students.map(s => ({
                    label: s.studentId,
                    value: s.studentId,
                    originalValue: s.studentId
                }));
            case 'branch':
                return branches.map(b => ({
                    label: b.name,
                    value: b.id.toString(),
                    originalValue: b.name
                }));
            case 'department':
                return departments.map(d => ({
                    label: d.name,
                    value: d.id.toString(),
                    originalValue: d.name
                }));
            case 'batch':
                return batches.map(b => ({
                    label: b.name,
                    value: b.id.toString(),
                    originalValue: b.name
                }));
            case 'brand':
                return brands.map(b => ({
                    label: b.name,
                    value: b.id.toString(),
                    originalValue: b.name
                }));
            case 'course':
                return courses.map(c => ({
                    label: c.name,
                    value: c.id.toString(),
                    originalValue: c.name
                }));
            case 'teacher':
                return teachers.map(t => ({
                    label: `${t.firstName} ${t.lastName}`,
                    value: t.id.toString(),
                    originalValue: `${t.firstName} ${t.lastName}`
                }));
            case "status": // ✅ Completed for status filter
                return statusOptions.map((s) => ({
                    label: s.label,
                    value: s.value,
                    originalValue: s.value, // store value like "present", "absent" etc.
                }));
            default:
                return [];
        }
    };

    const addFilterCondition = () => {
        const newConditions = [...filterConditions, {
            id: Date.now().toString(),
            field: '',
            operator: 'equals',
            value: ''
        }];
        onFiltersChange(newConditions); // Update parent state
    };

    const removeFilterCondition = (id: string) => {
        if (filterConditions.length > 1) {
            const newConditions = filterConditions.filter(c => c.id !== id);
            onFiltersChange(newConditions); // Update parent state
        }
    };

    const updateFilterCondition = (id: string, field: keyof FilterCondition, value: string) => {
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
        onFiltersChange(newConditions); // Update parent state
    };
    const isValueInputDisabled = (operator: string) => {
        return operator === 'isEmpty' || operator === 'isNotEmpty';
    };

    const isDropdownField = (field: string) => {
        return field !== 'student_id'; // Only student_id will be input, others dropdown
    };

    const handleDateChange = (dateValue: string, type: 'start' | 'end') => {
        onDateRangeChange({
            startDate: type === 'start' ? dateValue : startDate,
            endDate: type === 'end' ? dateValue : endDate
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Batch Attendance Summary</CardTitle>
                <CardDescription>
                    A summary of student attendance counts with advanced filtering.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium mb-1">Start Date</label>
                        <Input
                            type="date"
                            id="start-date"
                            value={startDate || ''}
                            onChange={(e) => handleDateChange(e.target.value, 'start')}
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium mb-1">End Date</label>
                        <Input
                            type="date"
                            id="end-date"
                            value={endDate || ''}
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
                                        isMulti={condition.operator === "equals" || condition.operator === "notEquals"} // Enable multi-select for equals/notEquals
                                        value={
                                            Array.isArray(condition.value)
                                                ? getValueOptions(condition.field).filter(opt =>
                                                    condition.value.includes(opt.originalValue)
                                                )
                                                : getValueOptions(condition.field).find(opt => opt.originalValue === condition.value) || null
                                        }
                                        onChange={(selectedOptions) => {
                                            if (Array.isArray(selectedOptions)) {
                                                // Multiple selection
                                                const values = selectedOptions.map(opt => opt.originalValue);
                                                updateFilterCondition(condition.id, 'value', values);
                                            } else {
                                                // Single selection
                                                updateFilterCondition(condition.id, 'value', selectedOptions?.originalValue || '');
                                            }
                                        }}
                                        filterOption={(option, input) => {
                                            return (
                                                option.label.toLowerCase().includes(input.toLowerCase()) ||
                                                option.data.originalValue.toLowerCase().includes(input.toLowerCase())
                                            );
                                        }}
                                    />
                                ) : (
                                    <Input
                                        placeholder={
                                            isValueInputDisabled(condition.operator)
                                                ? "N/A"
                                                : `Enter ${fieldOptions.find(f => f.value === condition.field)?.label || 'value'}`
                                        }
                                        value={condition.value}
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
                    <div className="text-center py-8">Loading and processing attendance data...</div>
                ) : (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr. No</TableHead>
                                    <TableHead>Student ID</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Batch</TableHead>
                                    <TableHead className="text-center">Present</TableHead>
                                    <TableHead className="text-center">Absent</TableHead>
                                    <TableHead className="text-center">Leave</TableHead>
                                    <TableHead className="text-center">Compensation</TableHead>
                                    <TableHead className="text-center">Attendance %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedBatchAttendanceData?.map((student, index) => {
                                    const present = student.presentCount || 0;
                                    const absent = student.absentCount || 0;
                                    const leave = student.leaveCount || 0;
                                    const compensation = student.Compensation || 0;
                                    const totalClasses = present + absent;
                                    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

                                    return (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell> {/* Serial Number */}
                                            <TableCell>{student.studentId}</TableCell>
                                            <TableCell className="font-medium">{student.studentName}</TableCell>
                                            <TableCell>{student.branchName}</TableCell>
                                            <TableCell>{student.batchName}</TableCell>
                                            <TableCell className="text-center text-green-600 font-semibold">{present}</TableCell>
                                            <TableCell className="text-center text-red-600 font-semibold">{absent}</TableCell>
                                            <TableCell className="text-center text-yellow-600 font-semibold">{leave}</TableCell>
                                            <TableCell className="text-center text-blue-600 font-semibold">{compensation}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        percentage >= 75 ? "border-green-500 text-green-600" :
                                                            percentage >= 50 ? "border-yellow-500 text-yellow-600" :
                                                                "border-red-500 text-red-600"
                                                    )}
                                                >
                                                    {percentage}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {batchAttendanceData?.length > 0 && (
                                    <TableRow className="font-semibold bg-gray-100">
                                        <TableCell colSpan={5} className="text-center">Total</TableCell>
                                        <TableCell className="text-center text-green-600">
                                            {batchAttendanceData.reduce((sum, s) => sum + (s.presentCount || 0), 0)}
                                        </TableCell>
                                        <TableCell className="text-center text-red-600">
                                            {batchAttendanceData.reduce((sum, s) => sum + (s.absentCount || 0), 0)}
                                        </TableCell>
                                        <TableCell className="text-center text-yellow-600">
                                            {batchAttendanceData.reduce((sum, s) => sum + (s.leaveCount || 0), 0)}
                                        </TableCell>
                                        <TableCell className="text-center text-blue-600">
                                            {batchAttendanceData.reduce((sum, s) => sum + (s.Compensation || 0), 0)}
                                        </TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                    </TableRow>
                                )}

                                {batchAttendanceData?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-4">
                                            No attendance data found matching your criteria.
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