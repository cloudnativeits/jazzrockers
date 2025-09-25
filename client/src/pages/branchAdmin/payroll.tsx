import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, 
  CalendarRange, 
  Download, 
  FileText, 
  Eye, 
  Check, 
  CreditCard,
  Calculator,
  TrendingUp,
  ArrowUpDown,
  Minus
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Payroll, Employee } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AdminPayroll() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [activeTab, setActiveTab] = useState("all");
  const [isViewPayrollDialog, setIsViewPayrollDialog] = useState(false);
  const [isCreatePayrollDialog, setIsCreatePayrollDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const { toast } = useToast();

  // Fetch payrolls
  const { data: payrolls = [], isLoading } = useQuery({
    queryKey: ["/api/payrolls"],
  });

  // Fetch employees
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/employees"],
  });

  // Handle view payroll details
  const handleViewPayroll = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsViewPayrollDialog(true);
  };

  // Filter payrolls based on selected month and active tab
  const filteredPayrolls = payrolls.filter((payroll: Payroll) => {
    const matchesMonth = payroll.month === selectedMonth;
    const matchesStatus = activeTab === "all" || payroll.status === activeTab;
    return matchesMonth && matchesStatus;
  });

  // Get employee details
  const getEmployeeDetails = (employeeId: number): Employee | undefined => {
    return employees.find((employee: Employee) => employee.id === employeeId);
  };

  // Calculate payroll summary
  const calculateSummary = () => {
    const totalPayroll = filteredPayrolls.reduce((sum, payroll) => sum + Number(payroll.netSalary), 0);
    const paidAmount = filteredPayrolls
      .filter(payroll => payroll.status === "paid")
      .reduce((sum, payroll) => sum + Number(payroll.netSalary), 0);
    const pendingAmount = filteredPayrolls
      .filter(payroll => payroll.status === "pending")
      .reduce((sum, payroll) => sum + Number(payroll.netSalary), 0);
      
    return {
      totalPayroll,
      paidAmount,
      pendingAmount,
      paidCount: filteredPayrolls.filter(payroll => payroll.status === "paid").length,
      pendingCount: filteredPayrolls.filter(payroll => payroll.status === "pending").length,
      processedCount: filteredPayrolls.filter(payroll => payroll.status === "processed").length
    };
  };

  const summary = calculateSummary();

  // Month options for select
  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = format(date, "yyyy-MM");
      const label = format(date, "MMMM yyyy");
      options.push({ value, label });
    }
    
    return options;
  };

  // Payroll table columns
  const columns: ColumnDef<Payroll>[] = [
    {
      accessorKey: "employeeId",
      header: "Employee",
      cell: ({ row }) => {
        const employee = getEmployeeDetails(row.original.employeeId);
        return employee ? 
          <div className="font-medium">{employee.employeeId}</div> : 
          <div>Unknown</div>;
      },
    },
    {
      accessorKey: "basicSalary",
      header: "Basic Salary",
      cell: ({ row }) => {
        return formatCurrency(Number(row.original.basicSalary));
      },
    },
    {
      accessorKey: "incentives",
      header: "Incentives",
      cell: ({ row }) => {
        return formatCurrency(Number(row.original.incentives));
      },
    },
    {
      accessorKey: "deductions",
      header: "Deductions",
      cell: ({ row }) => {
        return formatCurrency(Number(row.original.deductions));
      },
    },
    {
      accessorKey: "netSalary",
      header: "Net Salary",
      cell: ({ row }) => {
        return (
          <div className="font-medium">
            {formatCurrency(Number(row.original.netSalary))}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeVariant: "default" | "success" | "secondary" | "destructive" = "default";
        
        if (status === "paid") {
          badgeVariant = "success";
        } else if (status === "pending") {
          badgeVariant = "secondary";
        } else if (status === "processed") {
          badgeVariant = "default";
        }
        
        return (
          <Badge variant={badgeVariant}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paymentDate",
      header: "Payment Date",
      cell: ({ row }) => {
        const date = row.original.paymentDate;
        return date ? format(new Date(date), "MMM dd, yyyy") : "-";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const payroll = row.original;
        
        return (
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleViewPayroll(payroll)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {payroll.status === "processed" && (
              <Button variant="ghost" size="icon" className="text-green-600">
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AppShell>
      <PageHeader 
        title="Payroll Management" 
        description="Manage employee salaries, incentives, and payments."
        actions={
          <Button onClick={() => setIsCreatePayrollDialog(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Generate Payroll
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPayrolls.length} employees for {selectedMonth}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.paidAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.paidCount} employees paid
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.pendingCount} employees pending + {summary.processedCount} processed
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="w-full sm:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <CalendarRange className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processed">Processed</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={filteredPayrolls} 
            searchColumn="employeeId"
            searchPlaceholder="Search payroll..."
          />
        </CardContent>
      </Card>
      
      {/* View Payroll Dialog */}
      <Dialog open={isViewPayrollDialog} onOpenChange={setIsViewPayrollDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
            <DialogDescription>
              View detailed payroll information for this employee.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {(() => {
                      const employee = getEmployeeDetails(selectedPayroll.employeeId);
                      return employee ? employee.employeeId : "Unknown Employee";
                    })()}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    For {format(new Date(`${selectedPayroll.month}-01`), "MMMM yyyy")}
                  </p>
                </div>
                <Badge 
                  variant={
                    selectedPayroll.status === "paid" ? "success" : 
                    selectedPayroll.status === "processed" ? "default" : 
                    "secondary"
                  }
                >
                  {selectedPayroll.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Component</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                        <div className="flex items-center">
                          <Calculator className="h-4 w-4 text-neutral-500 mr-2" />
                          Basic Salary
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-neutral-900 font-mono">
                        {formatCurrency(Number(selectedPayroll.basicSalary))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                          Incentives
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-mono">
                        +{formatCurrency(Number(selectedPayroll.incentives))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                        <div className="flex items-center">
                          <Minus className="h-4 w-4 text-red-500 mr-2" />
                          Deductions
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 font-mono">
                        -{formatCurrency(Number(selectedPayroll.deductions))}
                      </td>
                    </tr>
                    <tr className="bg-neutral-50 font-medium">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                        <div className="flex items-center">
                          <ArrowUpDown className="h-4 w-4 text-neutral-500 mr-2" />
                          Net Salary
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-neutral-900 font-bold font-mono">
                        {formatCurrency(Number(selectedPayroll.netSalary))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Payment Details</h4>
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium capitalize">{selectedPayroll.status}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Payment Date:</span>
                      <span className="font-medium">
                        {selectedPayroll.paymentDate 
                          ? format(new Date(selectedPayroll.paymentDate), "MMM dd, yyyy") 
                          : "Not paid yet"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedPayroll.remarks && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Remarks</h4>
                    <p className="text-sm text-muted-foreground">{selectedPayroll.remarks}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Slip
                </Button>
                {selectedPayroll.status !== "paid" && (
                  <Button variant="default">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create Payroll Dialog */}
      <Dialog open={isCreatePayrollDialog} onOpenChange={setIsCreatePayrollDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
            <DialogDescription>
              Generate payroll for the selected month and employees.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select defaultValue={format(new Date(), "yyyy-MM")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Select Employees</Label>
              <div className="border rounded-md p-4 space-y-2 max-h-[200px] overflow-y-auto">
                {employees.map((employee: Employee) => (
                  <div key={employee.id} className="flex items-center">
                    <Input 
                      type="checkbox" 
                      id={`employee-${employee.id}`} 
                      className="h-4 w-4 mr-2"
                    />
                    <Label htmlFor={`employee-${employee.id}`} className="text-sm cursor-pointer">
                      {employee.employeeId} (₹{formatCurrency(Number(employee.salary))})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Input id="remarks" placeholder="Add any notes or remarks" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePayrollDialog(false)}>Cancel</Button>
            <Button type="submit">Generate Payroll</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
