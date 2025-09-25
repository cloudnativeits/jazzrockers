import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FixedFooter } from "@/components/layout/footer";
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
import { capitalizeFirstLetter, formatCurrency, getInitials } from "@/lib/utils";
import { useState } from "react";
import { Enrollment } from "@shared/schema";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  // Fetch parent's children (students)
  const { data: children = [], isLoading: isLoadingChildren } = useQuery({
    queryKey: ["/api/students-with-parents", user?.id],
    enabled: !!user,
  });

  const { data: childrenCount, isLoading: isLoadingChildrenCount } = useQuery({
    queryKey: ['/api/student-parents'],
    queryFn: async () => {
      const response = await fetch('/api/student-parents');
      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }
      return response.json();
    }
  });

  // Fetch enrollments for children
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments/student", selectedChild],
    enabled: !!selectedChild,
  });

  const { data: activeEnrollments = [], isLoading: isLoadingActiveEnrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/parents/:id/active-enrollments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/parents/${user?.id}/active-enrollments`);
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      return response.json();
    },
  });

  // Fetch all courses data
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/students/course'],
    queryFn: async () => {
      const response = await fetch('/api/students/course');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      return response.json();
    }
  });

  // Fetch payments
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["/api/payments"],
  });

  const {
    data: parent = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/parents/user", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(`/api/parents/user/${user?.id}`);
      if (!res.ok) {
        const text = await res.text();
        console.error("Fetch failed:", text);
        throw new Error("Failed to fetch parent");
      }
      return res.json();
    },
  });

  // Filter payments for the selected child
  const childPayments = selectedChild ?
    payments.filter((payment: any) => payment.studentId.toString() === selectedChild) :
    [];

  // Get the selected student's data from courses
  const selectedStudentData = selectedChild ?
    courses.find((student: any) =>
      student.studentId === parseInt(selectedChild) ||
      student.studentId.toString() === selectedChild
    ) :
    null;

  // Debug logging
  console.log('selectedChild:', selectedChild);
  console.log('courses:', courses);
  console.log('selectedStudentData:', selectedStudentData);

  // Get courses for the selected student for Overview section
  const studentCourses = selectedStudentData ? selectedStudentData.courses : [];

  // Get all schedules for the selected student for Classes section
  const getStudentSchedules = () => {
    if (!selectedStudentData) return [];

    const scheduleMap: Record<string, any> = {};

    selectedStudentData.courses.forEach((course: any) => {
      course.batches.forEach((batch: any) => {
        const key = `${course.courseName}-${batch.batchName}`;
        if (!scheduleMap[key]) {
          scheduleMap[key] = {
            courseName: course.courseName,
            batchName: batch.batchName,
            schedules: [],
          };
        }

        batch.schedule.forEach((schedule: any) => {
          scheduleMap[key].schedules.push({
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          });
        });
      });
    });

    return Object.values(scheduleMap);
  };


  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <AppShell>
      <PageHeader
        title="Parent Dashboard"
        description={`Welcome, ${parent?.firstName + " " + parent?.middleName + " " + parent?.lastName || 'Parent'}. Manage your children's activities and progress.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <GraduationCap className="h-6 w-6 text-primary mr-2" />
              <div className="text-2xl font-bold">{childrenCount || 0}</div>
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
              <div className="text-2xl font-bold">{activeEnrollments?.activeEnrollmentCount || 0}</div>
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
            <CardTitle>My Students</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingChildrenCount ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : childrenCount === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No Students</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No students are associated with your account.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {children.map((child: any) => (
                  <div
                    key={child.studentIds}
                    className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors ${selectedChild === child.studentIds.toString() ? 'bg-neutral-50' : ''
                      }`}
                    onClick={() => setSelectedChild(child.studentIds.toString())}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>
                          {getInitials(`${child.studentFirstName} ${child.studentLastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{child.studentFirstName} {child.studentMiddleName} {child.studentLastName}</div>
                        <div className="text-xs text-muted-foreground">ID: {child.studentId}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <Badge
                        variant={child.studentStatus === 'Active' ? 'default' : 'default'}
                        className="mt-1"
                      >
                        {capitalizeFirstLetter(child.studentStatus)}
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
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsContent value="overview" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Enrolled Courses</h3>
                        {isLoadingCourses ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : !studentCourses || studentCourses.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No active enrollments found.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {studentCourses.map((course: any, index: number) => (
                              <div key={index} className="border rounded-md p-4">
                                <div className="font-medium text-lg mb-2">
                                  {course.courseName}
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-muted-foreground">
                                    Batches:
                                  </div>
                                  {course.batches.map((batch: any, batchIndex: number) => (
                                    <div key={batchIndex} className="pl-2 border-l-2 border-blue-200">
                                      <div className="text-sm font-medium">
                                        {batch.batchName}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {batch.schedule.length} class{batch.schedule.length > 1 ? 'es' : ''} per week
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="classes" className="mt-0">
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium mb-3">Class Schedule</h3>
                      {isLoadingCourses ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      ) : getStudentSchedules().length === 0 ? (
                        <p className="text-sm text-muted-foreground">No class schedules found.</p>
                      ) : (
                        <div className="space-y-4">
                          {getStudentSchedules().map((entry: any, index: number) => (
                            <div key={index} className="p-4 border rounded-md hover:border-neutral-300 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-neutral-900 text-lg">{entry.courseName}</h4>
                                  <div className="text-sm text-muted-foreground">Batch: {entry.batchName}</div>
                                </div>
                              </div>

                              {entry.schedules.map((schedule: any, i: number) => (
                                <div key={i} className="mb-2">
                                  <div className="flex justify-between items-center text-sm text-neutral-600">
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                    </div>
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800">{schedule.day}</Badge>
                                  </div>
                                </div>
                              ))}

                              <div className="mt-3 flex justify-end">
                                <Button size="sm" variant="secondary">View Details</Button>
                              </div>
                            </div>

                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <FixedFooter user={user} />
    </AppShell>
  );
}