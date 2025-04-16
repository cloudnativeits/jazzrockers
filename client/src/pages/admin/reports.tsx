import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { Download, Calendar, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminReports() {
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [activeTab, setActiveTab] = useState("revenue");

  // Revenue data for charts
  const revenueData = [
    { month: "Jan", revenue: 750000, expenses: 420000, profit: 330000 },
    { month: "Feb", revenue: 820000, expenses: 450000, profit: 370000 },
    { month: "Mar", revenue: 880000, expenses: 470000, profit: 410000 },
    { month: "Apr", revenue: 850000, expenses: 460000, profit: 390000 },
    { month: "May", revenue: 920000, expenses: 480000, profit: 440000 },
    { month: "Jun", revenue: 980000, expenses: 510000, profit: 470000 },
    { month: "Jul", revenue: 1020000, expenses: 530000, profit: 490000 },
    { month: "Aug", revenue: 950000, expenses: 500000, profit: 450000 },
    { month: "Sep", revenue: 880000, expenses: 480000, profit: 400000 },
    { month: "Oct", revenue: 940000, expenses: 510000, profit: 430000 },
    { month: "Nov", revenue: 1050000, expenses: 550000, profit: 500000 },
    { month: "Dec", revenue: 1150000, expenses: 600000, profit: 550000 },
  ];

  // Student distribution data
  const studentDistributionData = [
    { name: "Music", value: 650, color: "#3949ab" },
    { name: "Dance", value: 320, color: "#f57c00" },
    { name: "Art", value: 180, color: "#48bb78" },
  ];

  // Branch performance data
  const branchPerformanceData = [
    { name: "Main Branch", students: 540, revenue: 650000, profit: 320000 },
    { name: "North Campus", students: 320, revenue: 380000, profit: 180000 },
    { name: "South Campus", students: 260, revenue: 310000, profit: 150000 },
    { name: "East Campus", students: 210, revenue: 250000, profit: 120000 },
  ];

  // Attendance data
  const attendanceData = [
    { month: "Jan", attendance: 92 },
    { month: "Feb", attendance: 88 },
    { month: "Mar", attendance: 91 },
    { month: "Apr", attendance: 85 },
    { month: "May", attendance: 89 },
    { month: "Jun", attendance: 94 },
    { month: "Jul", attendance: 90 },
    { month: "Aug", attendance: 87 },
    { month: "Sep", attendance: 92 },
    { month: "Oct", attendance: 94 },
    { month: "Nov", attendance: 91 },
    { month: "Dec", attendance: 88 },
  ];

  // Format large currency amounts
  const formatLargeAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `₹${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  return (
    <AppShell>
      <PageHeader 
        title="Reports & Analytics" 
        description="Analyze key performance indicators and business metrics."
        actions={
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
        }
      />
      

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <TabsContent value="revenue" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(11190000)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+15.3%</span> vs previous year
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(5960000)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-amber-600">+8.7%</span> vs previous year
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(5230000)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+23.1%</span> vs previous year
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue, expenses, and profit for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatLargeAmount} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#3949ab" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#e53e3e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#48bb78" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Course Category</CardTitle>
              <CardDescription>Distribution of revenue across course categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studentDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {studentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly Profit Trend</CardTitle>
              <CardDescription>Year-over-year profit comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatLargeAmount} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke="#48bb78"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="students" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,254</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.4%</span> vs previous year
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">New Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">287</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+18.2%</span> vs previous year
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+3.5%</span> vs previous year
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Distribution</CardTitle>
              <CardDescription>Distribution by course category</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studentDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {studentDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
              <CardDescription>Students by age group</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { age: "5-8", count: 210 },
                    { age: "9-12", count: 380 },
                    { age: "13-16", count: 320 },
                    { age: "17-20", count: 240 },
                    { age: "21+", count: 104 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="age" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Students" fill="#3949ab" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trends</CardTitle>
            <CardDescription>Monthly enrollments for the year</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { month: "Jan", enrollments: 18 },
                  { month: "Feb", enrollments: 24 },
                  { month: "Mar", enrollments: 32 },
                  { month: "Apr", enrollments: 26 },
                  { month: "May", enrollments: 22 },
                  { month: "Jun", enrollments: 28 },
                  { month: "Jul", enrollments: 35 },
                  { month: "Aug", enrollments: 30 },
                  { month: "Sep", enrollments: 25 },
                  { month: "Oct", enrollments: 18 },
                  { month: "Nov", enrollments: 20 },
                  { month: "Dec", enrollments: 15 },
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  name="New Enrollments"
                  stroke="#3949ab"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="branches" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Branch Performance</CardTitle>
              <CardDescription>Student count and revenue by branch</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={branchPerformanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'revenue' || name === 'profit') {
                      return formatCurrency(value as number);
                    }
                    return value;
                  }} />
                  <Legend />
                  <Bar dataKey="students" name="Students" fill="#3949ab" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="revenue" name="Revenue" fill="#f57c00" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#48bb78" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Branch Distribution</CardTitle>
              <CardDescription>Student distribution across branches</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={branchPerformanceData}
                    dataKey="students"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#3949ab" />
                    <Cell fill="#f57c00" />
                    <Cell fill="#48bb78" />
                    <Cell fill="#e53e3e" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Branch Growth</CardTitle>
            <CardDescription>Year-over-year student growth by branch</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Main Branch", "2021": 450, "2022": 490, "2023": 540 },
                  { name: "North Campus", "2021": 260, "2022": 300, "2023": 320 },
                  { name: "South Campus", "2021": 180, "2022": 220, "2023": 260 },
                  { name: "East Campus", "2021": 150, "2022": 180, "2023": 210 },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="2021" name="2021" fill="#cbd2d9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="2022" name="2022" fill="#9aa5b1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="2023" name="2023" fill="#3949ab" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="attendance" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89.2%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+1.8%</span> vs previous year
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Highest Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Piano Basics</div>
              <p className="text-xs text-muted-foreground">
                94.5% attendance rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lowest Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Art Foundation</div>
              <p className="text-xs text-muted-foreground">
                76.8% attendance rate
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Monthly attendance percentage for the year</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attendanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis domain={[70, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  name="Attendance Rate"
                  stroke="#3949ab"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance by Day of Week</CardTitle>
              <CardDescription>Average attendance percentage by weekday</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { day: "Monday", attendance: 91 },
                    { day: "Tuesday", attendance: 88 },
                    { day: "Wednesday", attendance: 93 },
                    { day: "Thursday", attendance: 87 },
                    { day: "Friday", attendance: 85 },
                    { day: "Saturday", attendance: 94 },
                    { day: "Sunday", attendance: 90 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="attendance" name="Attendance %" fill="#3949ab" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Attendance by Course Category</CardTitle>
              <CardDescription>Average attendance percentage by category</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { category: "Music - Piano", attendance: 92 },
                    { category: "Music - Guitar", attendance: 89 },
                    { category: "Music - Vocal", attendance: 91 },
                    { category: "Dance - Kathak", attendance: 87 },
                    { category: "Dance - Contemporary", attendance: 85 },
                    { category: "Art - Drawing", attendance: 79 },
                    { category: "Art - Painting", attendance: 78 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[70, 100]} />
                  <YAxis dataKey="category" type="category" width={140} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="attendance" name="Attendance %" fill="#3949ab" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      </Tabs>
    </AppShell>
  );
}