// components/CreditNoteReport.tsx
import { useState, useMemo } from "react";
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

interface CreditNoteReportProps {
  creditNoteData: any[];
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

export function CreditNoteReport({
  creditNoteData,
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
}: CreditNoteReportProps) {
  // const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([
  //   { id: '1', field: '', operator: 'equals', value: '' }
  // ]);

  const fieldOptions = [
    { label: "Student", value: "student" },
    { label: "Branch", value: "branch" },
    { label: "Brand", value: "brand" },
    { label: "Department", value: "department" },
    { label: "Batch", value: "batch" },
    { label: "Course", value: "course" },
    { label: "Teacher", value: "teacher" },
    { label: "Status", value: "status" },
    { label: "Credit Note #", value: "credit_note_number" },
    { label: "Amount", value: "amount" },
    { label: "Reason", value: "reason" },
  ];

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

  const statusOptions = [
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Rejected", value: "rejected" },
  ];

  const sortedData = useMemo(() => {
    if (!creditNoteData) return [];
    
    return [...creditNoteData].sort((a, b) => {
      const nameA = a.student_name?.toLowerCase() || '';
      const nameB = b.student_name?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });
  }, [creditNoteData]);


  const getValueOptions = (fieldValue: string) => {
    switch (fieldValue) {
      case 'student':
        return students.map(s => ({
          label: `${s.firstName} ${s.lastName}`,
          value: s.id.toString(),
          originalValue: `${s.firstName} ${s.lastName}`
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
      case 'status':
        return statusOptions.map(s => ({
          label: s.label,
          value: s.value,
          originalValue: s.label
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
      // setFilterConditions(newConditions);
      onFiltersChange(newConditions);
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
    // setFilterConditions(newConditions);
    onFiltersChange(newConditions);
  };

  const isValueInputDisabled = (operator: string) => {
    return operator === 'isEmpty' || operator === 'isNotEmpty';
  };

  const isDropdownField = (field: string) => {
    return [
      'student', 'branch', 'brand', 'department',
      'batch', 'course', 'teacher', 'status'
    ].includes(field);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Note Report</CardTitle>
        <CardDescription>
          View and filter credit notes with advanced filtering.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Date Range Section */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium mb-1">Start Date</label>
            <Input
              type="date"
              id="start-date"
              value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium mb-1">End Date</label>
            <Input
              type="date"
              id="end-date"
              value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
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
                    type={condition.field === 'amount' ? 'number' : 'text'}
                    placeholder={
                      isValueInputDisabled(condition.operator)
                        ? "N/A"
                        : `Enter ${fieldOptions.find(f => f.value === condition.field)?.label || 'value'}`
                    }
                    value={condition.value}
                    onChange={(e) => updateFilterCondition(condition.id, 'value', e.target.value)}
                    disabled={isValueInputDisabled(condition.operator)}
                    min={condition.field === 'amount' ? "0" : undefined}
                    step={condition.field === 'amount' ? "0.01" : undefined}
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

        {/* Results Section */}
        {isLoading ? (
          <div className="text-center py-8">Loading credit note data...</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No</TableHead> {/* Serial number */}
                  <TableHead>Credit Note #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData?.map((note, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell> {/* Serial number */}
                    <TableCell className="font-medium">{note.credit_note_number}</TableCell>
                    <TableCell>{note.student_name}</TableCell>
                    <TableCell>{note.amount}</TableCell>
                    <TableCell>{note.batch_name}</TableCell>
                    <TableCell>{note.course_name}</TableCell>
                    <TableCell>{note.brand_name}</TableCell>
                    <TableCell>{note.department_name}</TableCell>
                    <TableCell>{note.employee_name}</TableCell>
                    <TableCell>{getStatusBadge(note.status)}</TableCell>
                    <TableCell>
                      {note.created_at && format(new Date(note.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{note.reason}</TableCell>
                  </TableRow>
                ))}

                {sortedData?.length > 0 && (
                  <TableRow className="font-semibold bg-gray-100">
                    <TableCell colSpan={3} className="text-center">Total</TableCell>
                    <TableCell className="text-left">
                      {sortedData.reduce(
                        (sum, note) => sum + (Number(note.amount) || 0),
                         0
                         ).toFixed(2)}
                    </TableCell>
                    <TableCell colSpan={7}></TableCell> {/* Empty cells for other columns */}
                  </TableRow>
                )}

                {sortedData?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-4">
                      No credit notes found matching your criteria.
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