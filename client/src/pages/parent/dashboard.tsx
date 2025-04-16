import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  BookOpen,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency, getInitials } from "@/lib/utils";
import { useState } from "react";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  // Fetch parent's children (students)
  const { data: children = [], isLoading: isLoadingChildren } = useQuery({
    queryKey: ["/api/students/parent", user?.id],
    enabled: !!user,
  });

  // Fetch enrollments for children
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/enrollments/student", selectedChild],
    enabled: !!selectedChild,
  });

  // Fetch payments
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["/api/payments"],
  });

  // Get upcoming classes for the selected child
  const upcomingClasses = enrollments.map((enrollment: any) => {
    const batch = enrollment.batch || {};
    return {
      id: enrollment.batchId,
      name: batch.name || `Batch ${enrollment.batchId}`,
      dayTime: batch.daysOfWeek ? 
        `${batch.daysOfWeek.split(',')[0]}s, ${format(new Date(batch.startTime), "h:mm a")} - ${format(new Date(batch.endTime), "h:mm a")}` : 
        "Schedule unavailable",
      location: batch.roomNumber || "Room TBD",
      course: batch.courseId ? `Course ${batch.courseId}` : "Course TBD"
    };
  });

  // Recent attendance data (if available)
  const recentAttendance = []; // This would be fetched from the API

  // Filter payments for the selected child
  const childPayments = selectedChild ? 
    payments.filter((payment: any) => payment.studentId.toString() === selectedChild) : 
    [];

  return (
    <AppShell>
      <PageHeader 
        title="Parent Dashboard" 
        description={`Welcome, ${user?.fullName || 'Parent'}. Manage your children's activities and progress.`}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <GraduationCap className="h-6 w-6 text-primary mr-2" />
              <div className="text-2xl font-bold">{children.length || 0}</div>
            </div>
            <p className="text-xs text-muted-foreground">Enrolled in Jazzrockers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 text-indigo-500 mr-2" />
              <div className="text-2xl font-bold">{enrollments.length || 0}</div>
            </div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 text-amber-500 mr-2" />
              <div className="text-2xl font-bold">{childPayments.filter((p: any) => p.status === "pending").length || 0}</div>
            </div>
            <p className="text-xs text-muted-foreground">Due in the next 30 days</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>My Children</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingChildren ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : children.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No Children</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No children are associated with your account.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {children.map((child: any) => (
                  <div 
                    key={child.id} 
                    className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                      selectedChild === child.id.toString() ? 'bg-neutral-50' : ''
                    }`}
                    onClick={() => setSelectedChild(child.id.toString())}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>
                          {getInitials(`${child.firstName} ${child.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{child.firstName} {child.lastName}</div>
                        <div className="text-xs text-muted-foreground">ID: {child.studentId}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <Badge 
                        variant={child.status === 'active' ? 'success' : 'secondary'}
                        className="mt-1"
                      >
                        {child.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {!selectedChild ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-md">
                <GraduationCap className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Select a Child</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please select a child from the list to view their details.
                </p>
              </div>
            ) : (
              <>
                <TabsContent value="overview" className="mt-0">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Enrolled Courses</h3>
                      {isLoadingEnrollments ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      ) : enrollments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active enrollments found.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {enrollments.map((enrollment: any) => (
                            <div key={enrollment.id} className="border rounded-md p-4">
                              <div className="font-medium">
                                {enrollment.batch?.name || `Batch ${enrollment.batchId}`}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Course: {enrollment.batch?.course?.name || `Course ${enrollment.batch?.courseId || 'Unknown'}`}
                              </div>
                              <div className="text-xs text-muted-foreground mt-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
                                  {enrollment.status}
                                </Badge>
                                <span className="ml-2">Since {format(new Date(enrollment.enrollmentDate), "MMM dd, yyyy")}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Recent Payments</h3>
                      {isLoadingPayments ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      ) : childPayments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No payment records found.</p>
                      ) : (
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-neutral-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                  Invoice ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                              {childPayments.slice(0, 3).map((payment: any) => (
                                <tr key={payment.id} className="hover:bg-neutral-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">
                                    {payment.invoiceId}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                                    {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 font-mono">
                                    {formatCurrency(Number(payment.amount))}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <Badge 
                                      variant={
                                        payment.status === 'paid' ? 'success' : 
                                        payment.status === 'pending' ? 'secondary' : 
                                        'destructive'
                                      }
                                    >
                                      {payment.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {childPayments.length > 3 && (
                        <div className="text-center mt-2">
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setActiveTab('payments')}
                          >
                            View all payments
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="classes" className="mt-0">
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium mb-3">Upcoming Classes</h3>
                    {isLoadingEnrollments ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : upcomingClasses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming classes found.</p>
                    ) : (
                      <div className="space-y-4">
                        {upcomingClasses.map((cls: any) => (
                          <div key={cls.id} className="p-4 border rounded-md hover:border-neutral-300 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-neutral-900">{cls.name}</h4>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                Music
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                              <div className="text-neutral-600">
                                <Clock className="h-4 w-4 inline mr-1" />
                                {cls.dayTime}
                              </div>
                              <div className="text-neutral-600">
                                <MapPin className="h-4 w-4 inline mr-1" />
                                {cls.location}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 text-neutral-500 mr-1" />
                                <span className="text-sm text-neutral-700">{cls.course}</span>
                              </div>
                              <Button size="sm" variant="secondary">View Details</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <h3 className="text-lg font-medium mb-3">Class Schedule</h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center text-muted-foreground p-6">
                          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Full class schedule will be available soon.</p>
                          <p className="text-sm mt-1">Please check with your teacher for the current schedule.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="attendance" className="mt-0">
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium mb-3">Attendance Summary</h3>
                    {recentAttendance.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">Attendance data is not available yet.</p>
                          <p className="text-sm text-muted-foreground mt-1">This will be updated after classes begin.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {recentAttendance.map((record: any, idx) => (
                          <div key={idx} className="border-b pb-3 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium">{record.batch}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(record.date), "MMM dd")}
                              </div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center">
                                  <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                                  <span className="text-xs">{record.present}</span>
                                </div>
                                <div className="flex items-center">
                                  <XCircle className="h-3 w-3 text-red-500 mr-1" />
                                  <span className="text-xs">{record.absent}</span>
                                </div>
                                <div className="flex items-center">
                                  <AlertCircle className="h-3 w-3 text-amber-500 mr-1" />
                                  <span className="text-xs">{record.late}</span>
                                </div>
                              </div>
                              <div className="text-xs font-medium">
                                {Math.round((record.present + record.late) / record.total * 100)}% attendance
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="payments" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Payment History</h3>
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Download All Receipts
                      </Button>
                    </div>
                    
                    {isLoadingPayments ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : childPayments.length === 0 ? (
                      <div className="text-center p-6 border border-dashed rounded-md">
                        <CreditCard className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No payment records found.</p>
                      </div>
                    ) : (
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-neutral-200">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Invoice ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Due Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Method
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-neutral-200">
                            {childPayments.map((payment: any) => (
                              <tr key={payment.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">
                                  {payment.invoiceId}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                                  {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                                  {format(new Date(payment.dueDate), "MMM dd, yyyy")}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 font-mono">
                                  {formatCurrency(Number(payment.amount))}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <Badge 
                                    variant={
                                      payment.status === 'paid' ? 'success' : 
                                      payment.status === 'pending' ? 'secondary' : 
                                      'destructive'
                                    }
                                  >
                                    {payment.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                                  {payment.paymentMethod || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                  <Button variant="ghost" size="sm">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Receipt
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    <div className="bg-neutral-50 p-4 rounded-md border">
                      <h4 className="font-medium mb-2">Upcoming Payments</h4>
                      {childPayments.filter((p: any) => p.status === "pending").length === 0 ? (
                        <p className="text-sm text-muted-foreground">No pending payments.</p>
                      ) : (
                        <div className="space-y-2">
                          {childPayments
                            .filter((p: any) => p.status === "pending")
                            .map((payment: any) => (
                              <div key={payment.id} className="flex justify-between items-center p-2 bg-white rounded border">
                                <div>
                                  <div className="font-medium">{payment.invoiceId}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Due: {format(new Date(payment.dueDate), "MMM dd, yyyy")}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono font-medium">{formatCurrency(Number(payment.amount))}</div>
                                  <Button size="sm" variant="default" className="mt-1">
                                    Pay Now
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
