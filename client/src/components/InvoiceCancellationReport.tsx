// components/InvoiceCancellationReport.tsx
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ReactSelect from "react-select";
import { Batch, Course, Department, Employee, Student, Brand, Branch } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string | string[];
}

interface InvoiceCancellationReportProps {
  cancellationData: any[];
  isLoading: boolean;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  brands: Brand[];
  departments: Department[];
  courses: Course[];
  teachers: Employee[];
  batches: Batch[];
  students: Student[];
  branches: Branch[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  filterConditions: FilterCondition[];
}

export function InvoiceCancellationReport({
  cancellationData,
  isLoading,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  brands,
  departments,
  courses,
  teachers,
  batches,
  students,
  branches,
  onFiltersChange,
  filterConditions,
}: InvoiceCancellationReportProps) {

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
    { label: "Branch", value: "branch" },
    { label: "Brand", value: "brand" },
    { label: "Department", value: "department" },
    { label: "Batch", value: "batch" },
    { label: "Course", value: "course" },
    { label: "Teacher", value: "teacher" },
    { label: "Invoice Number", value: "invoiceNumber" },
  ];

  const sortedData = useMemo(() => {
  if (!cancellationData) return [];
  return [...cancellationData].sort((a, b) =>
    (a.student_name || "").localeCompare(b.student_name || "")
  );
}, [cancellationData]);

  const getValueOptions = (fieldValue: string) => {
    switch (fieldValue) {
      case 'student':
        return students.map(s => ({ 
          label: s.fullName || `${s.firstName} ${s.lastName}`, 
          value: s.id.toString(),
          originalValue: s.fullName || `${s.firstName} ${s.lastName}`
        }));
      case 'branch':
        return branches.map(b => ({ 
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
      default:
        return [];
    }
  };

  const isValueInputDisabled = (operator: string) => {
    return operator === 'isEmpty' || operator === 'isNotEmpty';
  };

  const isDropdownField = (field: string) => {
    return field !== 'invoiceNumber';
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
    const newDate = dateValue ? new Date(dateValue) : null;
    
    if (type === 'start') {
      setStartDate(newDate);
    } else {
      setEndDate(newDate);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Cancellation Report</CardTitle>
        <CardDescription>
          View and filter all invoices that have been cancelled with advanced filtering.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Date Range Section */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium mb-1">From Cancellation Date</label>
            <Input
              type="date"
              id="start-date"
              value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => handleDateChange(e.target.value, 'start')}
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium mb-1">To Cancellation Date</label>
            <Input
              type="date"
              id="end-date"
              value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
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
          <div className="text-center py-8">Loading cancellation data...</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No</TableHead> 
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cancellation Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell> {/* Serial number */}
                    <TableCell className="font-medium">{item.invoice_number}</TableCell>
                    <TableCell>{item.student_name}</TableCell>
                    <TableCell>{item.branch_name}</TableCell>
                    <TableCell>{item.batch_name}</TableCell>
                    <TableCell>{item.course_name}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{item.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.cancellation_date && isValid(new Date(item.cancellation_date))
                        ? format(new Date(item.cancellation_date), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
                {cancellationData?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No cancelled invoices found matching your criteria.
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