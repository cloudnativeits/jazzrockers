// components/UnpaidReport.tsx
import { useState } from "react";
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
  value: string | string[];
}

interface UnpaidReportProps {
  unpaidData: any[];
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

export function UnpaidReport({
  unpaidData,
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
  filterConditions
}: UnpaidReportProps) {
  // const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([
  //   { id: '1', field: '', operator: 'equals', value: '' }
  // ]);
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
    { label: "Student", value: "student" },
    { label: "Branch", value: "branch" },
    { label: "Brand", value: "brand" },
    { label: "Department", value: "department" },
    { label: "Batch", value: "batch" },
    { label: "Course", value: "course" },
    { label: "Teacher", value: "teacher" },
    { label: "Status", value: "status" },
    { label: "Invoice Number", value: "invoiceNumber" },
    { label: "Amount Due", value: "amountDue" },
  ];

  const statusOptions = [
    { label: "Unpaid", value: "unpaid" },
    { label: "Partially Paid", value: "partially_paid" },
  ];

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

  const handleDateChange = (dateValue: string, type: 'start' | 'end') => {
    const newStartDate = type === 'start' ? (dateValue || null) : startDate;
    const newEndDate = type === 'end' ? (dateValue || null) : endDate;

    if (type === 'start') setStartDate(dateValue);
    if (type === 'end') setEndDate(dateValue);

    onDateRangeChange({ startDate: newStartDate, endDate: newEndDate });
  };

  const getStatusBadge = (status: string) => {
    const lowerStatus = status?.toLowerCase();
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
        <CardTitle>Unpaid Invoices Report</CardTitle>
        <CardDescription>
          View and filter invoices with an outstanding balance using advanced filtering.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Date Range Section */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium mb-1">From Due Date</label>
            <Input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value, 'start')}
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium mb-1">To Due Date</label>
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
                    type={condition.field === 'amountDue' ? 'number' : 'text'}
                    placeholder={
                      isValueInputDisabled(condition.operator)
                        ? "N/A"
                        : `Enter ${fieldOptions.find(f => f.value === condition.field)?.label || 'value'}`
                    }
                    value={condition.value}
                    onChange={(e) => updateFilterCondition(condition.id, 'value', e.target.value)}
                    disabled={isValueInputDisabled(condition.operator)}
                    min={condition.field === 'amountDue' ? "0" : undefined}
                    step={condition.field === 'amountDue' ? "0.01" : undefined}
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
          <div className="text-center py-8">Loading unpaid invoice data...</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Balance Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidData?.map((invoice, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.totalAmount}</TableCell>
                    <TableCell>{invoice.amount_paid}</TableCell>
                    <TableCell className="font-semibold text-red-600">{invoice.balanceDue}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {invoice.issueDate && isValid(new Date(invoice.issueDate))
                        ? format(new Date(invoice.issueDate), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {invoice.due_date && isValid(new Date(invoice.due_date))
                        ? format(new Date(invoice.due_date), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}

                {unpaidData?.length > 0 && (
                  <TableRow className="font-semibold bg-gray-100">
                    <TableCell colSpan={2} className="text-center">Total</TableCell>
                    <TableCell className="text-left">
                      {unpaidData.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-left">
                      {unpaidData.reduce((sum, i) => sum + (Number(i.amount_paid) || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-left text-red-600">
                      {unpaidData.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                )}

                {unpaidData?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No unpaid invoices found matching your criteria.
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