import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface LocationSelectorProps {
  onLocationChange?: (location: string) => void;
  onDateRangeChange?: (range: { from: Date; to: Date }) => void;
  onExport?: () => void;
}

export function LocationSelector({ 
  onLocationChange,
  onDateRangeChange,
  onExport
}: LocationSelectorProps) {
  const [location, setLocation] = useState("all");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (onLocationChange) {
      onLocationChange(value);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate && onDateRangeChange) {
      // For simplicity, we'll just use the selected date and create a range of that month
      const from = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const to = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      onDateRangeChange({ from, to });
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  const getFormattedDateRange = () => {
    if (!date) return "Select date range";
    
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    return `${format(startOfMonth, "MMM d")} - ${format(endOfMonth, "MMM d, yyyy")}`;
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-neutral-700">Location:</label>
        <div className="relative">
          <Select value={location} onValueChange={handleLocationChange}>
            <SelectTrigger className="pl-3 pr-8 py-2 text-sm">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="main">Al Nahda</SelectItem>
              <SelectItem value="north">Burjuman</SelectItem>
              <SelectItem value="south">International City</SelectItem>
              </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Calendar className="h-4 w-4 mr-2" />
              {getFormattedDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <Button 
          className="bg-primary hover:bg-primary/90"
          size="sm"
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
}
