import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  period?: string;
  onPeriodChange?: (value: string) => void;
  footer?: ReactNode;
}

export function ChartCard({ 
  title, 
  children, 
  className, 
  actions,
  period,
  onPeriodChange,
  footer
}: ChartCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold text-neutral-900">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {period && onPeriodChange && (
            <div className="relative">
              <Select value={period} onValueChange={onPeriodChange}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="12months">Last 12 months</SelectItem>
                  <SelectItem value="ytd">Year to date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {actions ? (
            actions
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View details</DropdownMenuItem>
                <DropdownMenuItem>Download data</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(footer ? "pb-2" : "")}>
        {children}
      </CardContent>
      
      {footer && (
        <div className="px-6 py-4 border-t border-neutral-200">
          {footer}
        </div>
      )}
    </Card>
  );
}
