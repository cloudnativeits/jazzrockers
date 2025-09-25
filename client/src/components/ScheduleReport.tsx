// components/ScheduleReport.tsx
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ReactSelect from "react-select";
import { Batch, Course, Department, Employee, Brand, Branch } from "@shared/schema";
import { Input } from "@/components/ui/input";

interface FilterCondition {
    id: string;
    field: string;
    operator: string;
    value: string | string[]; // Changed to string | string[]
}

interface ScheduleReportProps {
    scheduleData: any[];
    isLoading: boolean;
    brands: Brand[];
    departments: Department[];
    courses: Course[];
    teachers: Employee[];
    batches: Batch[];
    branches: Branch[];
    onFiltersChange: (filters: FilterCondition[]) => void;
    onDateRangeChange: (dates: { startDate: string | null; endDate: string | null }) => void;
    filterConditions: FilterCondition[];
}

export function ScheduleReport({
    scheduleData,
    isLoading,
    brands,
    departments,
    courses,
    teachers,
    batches,
    branches,
    onFiltersChange,
    onDateRangeChange,
    filterConditions,
}: ScheduleReportProps) {

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

    const dayOptions = [
        { label: "Monday", value: "Monday" },
        { label: "Tuesday", value: "Tuesday" },
        { label: "Wednesday", value: "Wednesday" },
        { label: "Thursday", value: "Thursday" },
        { label: "Friday", value: "Friday" },
        { label: "Saturday", value: "Saturday" },
        { label: "Sunday", value: "Sunday" },
    ];

    const fieldOptions = [
        { label: "Day", value: "day" },
        { label: "Branch", value: "branch_name" },
        { label: "Brand", value: "brand_name" },
        { label: "Department", value: "department_name" },
        { label: "Batch", value: "batch_name" },
        { label: "Course", value: "course_name" },
        { label: "Teacher", value: "teacher_name" },
        { label: "Start Time", value: "start_time" },
        { label: "End Time", value: "end_time" },
    ];

    const sortedScheduleData = useMemo(() => {
        if (!scheduleData) return [];
        return [...scheduleData].sort((a, b) =>
            (a.batch_name || "").localeCompare(b.batch_name || "")
        );
        }, [scheduleData]);


    const getValueOptions = (fieldValue: string) => {
        switch (fieldValue) {
            case 'day':
                return dayOptions;
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
                return teachers.map(t => ({ label: `${t.firstName} ${t.lastName}`, value: `${t.firstName} ${t.lastName}` }));
            default:
                return [];
        }
    };

    const isValueInputDisabled = (operator: string) => {
        return operator === 'isEmpty' || operator === 'isNotEmpty';
    };

    const isDropdownField = (field: string) => {
        return [
            'day',
            'branch_name',
            'brand_name',
            'department_name',
            'batch_name',
            'course_name',
            'teacher_name'
        ].includes(field);
    };

    const isTimeField = (field: string) => {
        return ['start_time', 'end_time'].includes(field);
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

    function formatTime(time: string): string {
        if (!time) return "";
        // Try to parse as "HH:mm:ss" or "HH:mm"
        const [hourStr, minStr] = time.split(":");
        if (hourStr === undefined || minStr === undefined) return time;
        let hour = parseInt(hourStr, 10);
        const min = minStr.padStart(2, "0");
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${min} ${ampm}`;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Schedule Report</CardTitle>
                <CardDescription>
                    View and filter the class schedule.
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
                                ) : isTimeField(condition.field) ? (
                                    <Input
                                        type="time"
                                        placeholder={`Enter ${fieldOptions.find(f => f.value === condition.field)?.label || 'value'}`}
                                        value={typeof condition.value === 'string' ? condition.value : ''} // Ensure value is a string
                                        onChange={(e) => updateFilterCondition(condition.id, 'value', e.target.value)}
                                        disabled={isValueInputDisabled(condition.operator)}
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
                    <div className="text-center py-8">Loading schedule data...</div>
                ) : (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr. No</TableHead> 
                                    <TableHead>Day</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Batch</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Brand</TableHead>
                                    <TableHead>Department</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedScheduleData?.map((item, index) => (

                                    <TableRow key={index}>
                                        <TableCell>{index + 1}</TableCell> {/* Serial number */}
                                        <TableCell className="font-medium">{item.day}</TableCell>
                                        <TableCell>
                                            {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                        </TableCell>
                                        <TableCell>{item.batch_name}</TableCell>
                                        <TableCell>{item.course_name}</TableCell>
                                        <TableCell>{item.teacher_name}</TableCell>
                                        <TableCell>{item.branch_name}</TableCell>
                                        <TableCell>{item.brand_name}</TableCell>
                                        <TableCell>{item.department_name}</TableCell>
                                    </TableRow>
                                ))}
                                {sortedScheduleData?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-4">
                                            No schedule data found matching your criteria.
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