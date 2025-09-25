import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, User, Calendar as CalendarIcon, CheckCircle, XCircle, Info, Clock, AlarmCheck, CalendarCheck, XCircleIcon, ClockIcon, CheckCircle2, AlertCircle, MapPin, Users, Stethoscope, Plane, GraduationCap, Receipt, FileCheck, Wallet } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { FixedFooter } from "@/components/layout/footer";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export default function ParentAttendance() {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [tab, setTab] = useState("list");
  const [compensationDate, setCompensationDate] = useState<Date>();
  const [compensationBatchName, setCompensationBatchName] = useState("");
  const [selectedLeaveRecord, setSelectedLeaveRecord] = useState<any>(null);

  // Mock data
  const { data: children = [], isLoading: isLoadingChildren } = useQuery<{ id: number; name: string; age: number; avatarUrl: string; courses: { id: number; name: string; level: string; teacher: string; progress: number; nextClass: Date; achievements: { id: number; name: string; date: Date; icon: React.ReactNode }[]; assignments: { id: number; name: string; dueDate: Date; completed: boolean }[]; notes: { id: number; date: Date; text: string }[] }[]; performance: { attendance: number; participation: number; progress: number; recentAchievements: number } }[]>({
    queryKey: ["/api/students-with-parents", user?.id],
    enabled: !!user,
  });

  const courses = [
    {
      id: 1,
      name: "Guitar Lessons",
      student: "1", // Riya
      teacher: "John Smith",
      schedule: "Monday and Thursday, 4:00 PM - 5:30 PM",
      classes: 8,
      attendedClasses: 7,
      missedClasses: 1
    },
    {
      id: 2,
      name: "Piano Basics",
      student: "2", // Arjun
      teacher: "Maria Rodriguez",
      schedule: "Tuesday and Friday, 5:00 PM - 6:30 PM",
      classes: 8,
      attendedClasses: 8,
      missedClasses: 0
    }
  ];

  // const { data: attendanceData = [], isLoading: isLoadingAttendance } = useQuery({
  //   queryKey: ["/api/attendance/parent", user?.id],
  //   enabled: !!user,
  // });

  // const {
  //   data: attendanceData = [],
  //   isLoading: isLoadingAttendance,
  //   isError,
  // } = useQuery({
  //   queryKey: ["/api/attendance/parent", user?.id],
  //   queryFn: async () => {
  //     const res = await fetch (`/api/attendance/parent?userId=${user?.id}`);
  //     return res.json();
  //   },
  const {
    data: attendanceData = [],
    isLoading: isLoadingAttendance,
    error: attendanceError,
    isError: isAttendanceError,
  } = useQuery({
    queryKey: ["/api/attendance/parent", user?.id, selectedStudent],
    queryFn: async () => {
      try {
        // console.log('Fetching attendance data for:', { userId: user?.id, studentId: selectedStudent });
        const res = await fetch(`/api/attendance/parent?userId=${user?.id}${selectedStudent ? `&studentId=${selectedStudent}` : ''}`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to fetch attendance data');
        }
        const data = await res.json();
        // console.log('Fetched attendance data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching attendance:', error);
        throw error;
      }
    },
    enabled: !!user && !!selectedStudent,
    retry: false, // Don't retry on error
  });

  // Get filtered attendance data for the selected month
  const filteredAttendance = attendanceData.filter((record: any) => {
    if (!record || !record.date) return false;
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === selectedMonth.getMonth() &&
      recordDate.getFullYear() === selectedMonth.getFullYear();
  });

  // Get the student's courses
  const studentCourses = courses.filter(course => course.student === selectedStudent);

  // Get all days in the selected month for the calendar view
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  });

  // Calculate attendance summary
  const totalClasses = studentCourses.reduce((sum, course) => sum + course.classes, 0);
  const attendedClasses = studentCourses.reduce((sum, course) => sum + course.attendedClasses, 0);
  const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

  // Define function to handle month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedMonth(subMonths(selectedMonth, 1));
    } else {
      setSelectedMonth(addMonths(selectedMonth, 1));
    }
  };

  // const handleCompensate = async (record: any) => {
  //   setSelectedLeaveRecord(record);
  //   setCompensationDate(undefined);
  //   setCompensationBatchName("");
  // };

  // const handleSubmitCompensation = async () => {
  //   if (!compensationDate || !compensationBatchName || !selectedLeaveRecord) return;

  //   try {
  //     const response = await fetch('/api/attendance/compensate', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         attendanceId: selectedLeaveRecord.id,
  //         compensationDate: format(compensationDate, 'yyyy-MM-dd'),
  //         compensationBatchName
  //       })
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to save compensation');
  //     }

  //     // Refetch attendance data
  //     await refetch();

  //     // Close dialog and reset form
  //     setSelectedLeaveRecord(null);
  //     setCompensationDate(undefined);
  //     setCompensationBatchName("");

  //     // Show success message (optional)
  //     alert('Compensation scheduled successfully!');
  //   } catch (error) {
  //     console.error('Error submitting compensation:', error);
  //     alert('Failed to schedule compensation. Please try again.');
  //   }
  // };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="default" className="flex items-center gap-2 bg-green-500 text-white"><CheckCircle className="h-4 w-4" /> Present</Badge>;
      case "absent":
        return <Badge variant="destructive" className="flex items-center gap-2"><XCircleIcon className="h-4 w-4" /> Absent</Badge>;
      case "late":
        return <Badge variant="outline" className="flex items-center gap-2"><ClockIcon className="h-4 w-4" /> Late</Badge>;
      case "leave":
        return <Badge variant="default" className="flex items-center gap-2 bg-yellow-500 text-white"><AlarmCheck className="h-4 w-4" /> Leave</Badge>;
      case "cancelled":
        return <Badge variant="default" className="flex items-center gap-2 bg-orange-600 text-white border-none"><XCircle className="h-4 w-4" /> Class Cancelled</Badge>;
      case "holiday":
        return <Badge variant="default" className="flex items-center gap-2 bg-blue-600 text-white border-none"><CalendarCheck className="h-4 w-4" /> Holiday</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Not Marked</Badge>;
    }
  };

  // Define breadcrumbs for the page
  const breadcrumbs = [
    {
      title: "Home",
      href: "/parent/dashboard",
      icon: <Home className="h-4 w-4" />
    },
    {
      title: "Attendance"
    }
  ];

  return (
    <AppShell>
      <PageHeader
        title="Attendance"
        description="Track your students' class attendance"
        breadcrumbs={breadcrumbs}
      />
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <HoverCard>
              <HoverCardTrigger>
                <Card className="bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Leave</p>
                      {/* <h3 className="text-2xl font-bold text-blue-700">
                                  {attendanceLoading ? <Skeleton className="h-8 w-12" /> : `${stats.leave}%`}
                                </h3> */}
                    </div>
                    <AlertCircle className="h-8 w-8 text-blue-500" />
                  </CardContent>
                </Card>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    <h4 className="text-sm font-semibold">Leave</h4>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">
                    Only when a student misses 2 or more consecutive classes with prior email notice, a credit note will be issued and the fee will be adjusted in the next month.
                  </p>
                  {/* <ul className="text-sm space-y-3 ml-7">
                              <li className="flex items-start">
                                <Stethoscope className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                                <div>
                                  <span className="text-blue-600">Medical Leave</span>
                                  <p className="text-muted-foreground text-xs mt-1">Must provide medical certificate or documentation</p>
                                </div>
                              </li>
                              <li className="flex items-start">
                                <Plane className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                                <div>
                                  <span className="text-blue-600">Vacation Leave</span>
                                  <p className="text-muted-foreground text-xs mt-1">Minimum 1 week advance notice required</p>
                                </div>
                              </li>
                              <li className="flex items-start">
                                <GraduationCap className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                                <div>
                                  <span className="text-blue-600">Academic Exams</span>
                                  <p className="text-muted-foreground text-xs mt-1">Provide exam schedule from educational institution</p>
                                </div>
                              </li>
                            </ul>
                            <div className="text-sm bg-blue-50 p-3 rounded mt-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Receipt className="h-4 w-4 text-blue-600" />
                                <p className="font-medium text-blue-700">How to Request a Refund:</p>
                              </div>
                              <ol className="list-none space-y-2 ml-6">
                                <li className="flex items-center gap-2 text-blue-600">
                                  <FileCheck className="h-4 w-4 flex-shrink-0" />
                                  <span>Submit leave request with supporting documents</span>
                                </li>
                                <li className="flex items-center gap-2 text-blue-600">
                                  <Clock className="h-4 w-4 flex-shrink-0" />
                                  <span>Approval will be processed shortly</span>
                                </li>
                                <li className="flex items-center gap-2 text-blue-600">
                                  <Wallet className="h-4 w-4 flex-shrink-0" />
                                  <span>Refund will be credited in next billing cycle</span>
                                </li>
                              </ol>
                            </div> */}
                </div>
              </HoverCardContent>
            </HoverCard>
            <HoverCard>
              <HoverCardTrigger>
                <Card className="bg-red-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Absent</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </CardContent>
                </Card>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h4 className="text-sm font-semibold">Absent</h4>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">
                    Class missed without notice. No credit or compensation.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger>
                <Card className="bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Compensation</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-purple-500" />
                  </CardContent>
                </Card>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-purple-500" />
                    <h4 className="text-sm font-semibold">Compensation</h4>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">
                  A make-up class offered for a missed session.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4 mb-6 mt-3">
        <div className="flex-grow">
          <Select
            value={selectedStudent}
            onValueChange={(value) => {
              // console.log('Selected student:', value);
              // Reset any previous errors
              setSelectedStudent(value);
            }}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child: any) => (
                <SelectItem key={child.studentIds} value={child.studentIds.toString()}>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {child.studentFirstName} {child.studentMiddleName} {child.studentLastName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {studentCourses.map((course) => (
          <Card key={course.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{course.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Attendance Rate</span>
                  <Badge variant="outline" className={
                    course.attendedClasses / course.classes >= 0.9
                      ? "bg-green-100 text-green-800"
                      : course.attendedClasses / course.classes >= 0.8
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }>
                    {Math.round((course.attendedClasses / course.classes) * 100)}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(course.attendedClasses / course.classes) * 100}%` }}
                  ></div>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Classes Attended</span>
                    <span className="font-medium">{course.attendedClasses} of {course.classes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Classes Missed</span>
                    <span className="font-medium">{course.missedClasses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teacher</span>
                    <span className="font-medium">{course.teacher}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="block font-medium">Schedule:</span>
                  {course.schedule}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedStudent && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Attendance Details</CardTitle>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth('prev')}
                  >
                    <CalendarIcon className="h-4 w-4 rotate-180" />
                  </Button>
                  <div className="text-sm text-gray-500 min-w-[100px] text-center">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth('next')}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? (
                <div className="text-center py-8 text-gray-500">
                  Loading attendance data...
                </div>
              ) : isAttendanceError ? (
                <div className="text-center py-8 text-red-500 flex items-center justify-center">
                  <Info className="h-4 w-4 mr-2" />
                  {attendanceError instanceof Error ? attendanceError.message : 'Failed to load attendance data'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SL No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      {/* <TableHead>Action</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.length > 0 ? (
                      filteredAttendance
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record: any, index: number) => (
                          <TableRow key={`${record.id}-${record.date}`}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{record.batchName}</TableCell>
                            <TableCell>
                              {getStatusBadge(record.status)}
                            </TableCell>
                            {/* <TableCell>
                              {record.status === 'leave' && (
                                record.compensationDate ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 bg-gray-500 text-white"
                                    disabled
                                  >
                                    <Clock className="h-4 w-4" />
                                    Compensated
                                  </Button>
                                ) : (
                                  <Dialog open={selectedLeaveRecord?.id === record.id} onOpenChange={(open) => !open && setSelectedLeaveRecord(null)}>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2 bg-primary text-white"
                                        onClick={() => handleCompensate(record)}
                                      >
                                        <Clock className="h-4 w-4" />
                                        Compensate
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Schedule Compensation Class</DialogTitle>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                          <Label>Compensation Date</Label>
                                          <Input
                                            type="date"
                                            value={compensationDate ? format(compensationDate, 'yyyy-MM-dd') : ''}
                                            onChange={(e) => setCompensationDate(new Date(e.target.value))}
                                          />
                                        </div>
                                        <div className="grid gap-2">
                                          <Label>Batch</Label>
                                          <Input
                                            value={compensationBatchName}
                                            onChange={(e) => setCompensationBatchName(e.target.value)}
                                            placeholder="Enter batch name"
                                          />
                                        </div>
                                        <Button
                                          onClick={handleSubmitCompensation}
                                          disabled={!compensationDate || !compensationBatchName}
                                        >
                                          Submit
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )
                              )}
                            </TableCell> */}
                            {/* <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-gray-600">{record.notes}</span>
                        </TableCell> */}
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          No attendance records found for this month
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <FixedFooter user={user} />
    </AppShell>
  );
}