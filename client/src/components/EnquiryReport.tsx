// components/EnquiryReport.tsx
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ReactSelect from "react-select";
import { Course, Student, Branch } from "@shared/schema";
import { Input } from "@/components/ui/input";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string | string[];
}

interface EnquiryReportProps {
  enquiryData: any[];
  isLoading: boolean;
  students: Student[];
  branches: Branch[];
  courses: Course[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  onDateRangeChange: (dates: { startDate: string | null; endDate: string | null }) => void;
  filterConditions: FilterCondition[];
}

export function EnquiryReport({
  enquiryData,
  isLoading,
  students,
  branches,
  courses,
  onFiltersChange,
  onDateRangeChange,
  filterConditions,
}: EnquiryReportProps) {
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
  ];

  const fieldOptions = [
    // { label: "Student", value: "student" },
    { label: "Branch", value: "branch" },
    { label: "Course", value: "course" },
    // { label: "Email", value: "email" },
    // { label: "Phone", value: "phone" },
  ];

  const sortedData = useMemo(() => {
  if (!enquiryData) return [];

  return [...enquiryData].sort((a, b) => {
    const nameA = a.fullName?.toLowerCase() || "";
    const nameB = b.fullName?.toLowerCase() || "";
    return nameA.localeCompare(nameB);
  });
}, [enquiryData]);


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
      case 'course':
        return courses.map(c => ({ 
          label: c.name, 
          value: c.id.toString(),
          originalValue: c.name
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
    return ['student', 'branch', 'course'].includes(field);
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
        <CardTitle>Enquiry Report</CardTitle>
        <CardDescription>
          View and filter all student enquiries with advanced filtering.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Date Range Section */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium mb-1">From Enquiry Date</label>
            <Input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value, 'start')}
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium mb-1">To Enquiry Date</label>
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
          <div className="text-center py-8">Loading enquiry data...</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No</TableHead> {/* Serial number */}
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Course Enquired</TableHead>
                  <TableHead>Enquiry Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData?.map((enquiry, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell> {/* Serial number */}
                    <TableCell className="font-medium">{enquiry.fullName}</TableCell>
                    <TableCell>{enquiry.email}</TableCell>
                    <TableCell>{enquiry.phone}</TableCell>
                    <TableCell>{enquiry.branch_name}</TableCell>
                    <TableCell>{enquiry.course_name}</TableCell>
                    <TableCell>
                      {enquiry.registration_date && isValid(new Date(enquiry.registration_date))
                        ? format(new Date(enquiry.registration_date), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
                {enquiryData?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No enquiries found matching your criteria.
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