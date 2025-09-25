// components/InventoryReport.tsx
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ReactSelect from "react-select";
import { Input } from "@/components/ui/input";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string | string[];
}

interface InventoryReportProps {
  inventoryData: any[];
  isLoading: boolean;
  itemOptions: { label: string; value: string }[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  onDateRangeChange: (dates: { startDate: string | null; endDate: string | null }) => void;
  filterConditions: FilterCondition[];
}

export function InventoryReport({
  inventoryData,
  isLoading,
  itemOptions,
  onFiltersChange,
  onDateRangeChange,
  filterConditions,
}: InventoryReportProps) {
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
    { label: "Item Name", value: "itemName" },
    { label: "Stock Quantity", value: "stockQuantity" },
  ];

  const sortedData = useMemo(() => {
  if (!inventoryData) return [];

  return [...inventoryData].sort((a, b) => {
    const nameA = a.item_name?.toLowerCase() || "";
    const nameB = b.item_name?.toLowerCase() || "";
    return nameA.localeCompare(nameB);
  });
}, [inventoryData]);


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

  const isValueInputDisabled = (operator: string) => {
    return operator === 'isEmpty' || operator === 'isNotEmpty';
  };

  const isDropdownField = (field: string) => {
    return field === 'itemName';
  };

  const isMultiSelectOperator = (operator: string) => {
    return operator === "equals" || operator === "notEquals";
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
        <CardTitle>Inventory Report</CardTitle>
        <CardDescription>
          View and filter inventory items with advanced filtering.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Date Range Section */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium mb-1">From Update Date</label>
            <Input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value, 'start')}
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium mb-1">To Update Date</label>
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
                    options={itemOptions}
                    isClearable
                    isSearchable
                    isMulti={isMultiSelectOperator(condition.operator)}
                    value={
                      isMultiSelectOperator(condition.operator) && Array.isArray(condition.value)
                        ? itemOptions.filter(opt =>
                          condition.value.includes(opt.value)
                        )
                        : itemOptions.find(opt => opt.value === condition.value) || null
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
                    type={condition.field === 'stockQuantity' ? 'number' : 'text'}
                    placeholder={
                      isValueInputDisabled(condition.operator)
                        ? "N/A"
                        : `Enter ${fieldOptions.find(f => f.value === condition.field)?.label || 'value'}`
                    }
                    value={typeof condition.value === 'string' ? condition.value : ''}
                    onChange={(e) => updateFilterCondition(condition.id, 'value', e.target.value)}
                    disabled={isValueInputDisabled(condition.operator)}
                    min={condition.field === 'stockQuantity' ? "0" : undefined}
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
          <div className="text-center py-8">Loading inventory data...</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Stock Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell> {/* Serial number */}
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>
                      {item.updatedAt && isValid(new Date(item.updatedAt))
                        ? format(new Date(item.updatedAt), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">{item.stock_quantity}</TableCell>
                  </TableRow>
                ))}

                {inventoryData?.length > 0 && (
                  <TableRow className="font-semibold bg-gray-100">
                    <TableCell colSpan={3} className="text-right">Total</TableCell>
                    <TableCell className="text-right">
                      {sortedData.reduce((sum, item) => sum + (Number(item.stock_quantity) || 0), 0)}
                    </TableCell>
                  </TableRow>
                )}

                {inventoryData?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No inventory data found matching your criteria.
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