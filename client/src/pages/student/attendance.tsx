import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CalendarIcon, BookOpen, CheckCircle2, XCircle, AlertCircle, MapPin, Users, Stethoscope, Plane, GraduationCap, Receipt, FileCheck, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { format } from "date-fns";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export default function StudentAttendance() {
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Get student's courses
  const { 
    data: courses,
    error: coursesError,
    isLoading: coursesLoading 
  } = useQuery<any[]>({
    queryKey: ["student-courses"],
    queryFn: async () => {
      const response = await fetch("/api/student/courses");
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    },
    retry: false,
  });
  
  // Get attendance records
  const {
    data: attendance,
    error: attendanceError,
    isLoading: attendanceLoading,
    refetch: refetchAttendance
  } = useQuery<any[]>({
    queryKey: ["student-attendance", selectedCourse, date ? format(date, 'yyyy-MM') : null],
    queryFn: async () => {
      const response = await fetch(`/api/student/attendance?course=${selectedCourse}&date=${date ? format(date, 'yyyy-MM') : ''}`);
      if (!response.ok) throw new Error("Failed to fetch attendance");
      return response.json();
    },
    retry: false,
  });
  
  // Calculate attendance statistics
  const calculateStats = (attendanceData: any[] = []) => {
    const total = attendanceData.length || 1; // Avoid division by zero
    const stats = {
      present: 0,
      absent: 0,
      class_cancel: 0,
      compensation: 0,
      leave: 0
    };

    attendanceData?.forEach(record => {
      if (stats.hasOwnProperty(record.status)) {
        stats[record.status as keyof typeof stats]++;
      }
    });

    return {
      present: Math.round((stats.present / total) * 100),
      absent: Math.round((stats.absent / total) * 100),
      class_cancel: Math.round((stats.class_cancel / total) * 100),
      compensation: Math.round((stats.compensation / total) * 100),
      leave: Math.round((stats.leave / total) * 100)
    };
  };

  const stats = calculateStats(attendance);

  // Show any errors
  useEffect(() => {
    if (coursesError) {
      toast({
        title: "Error loading courses",
        description: "Please try again later",
        variant: "destructive"
      });
    }
    
    if (attendanceError) {
      toast({
        title: "Error loading attendance records",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  }, [coursesError, attendanceError, toast]);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "absent":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "class_cancel":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "compensation":
        return <Clock className="h-5 w-5 text-purple-500" />;
      case "leave":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "present":
        return "Present";
      case "absent":
        return "Absent";
      case "class_cancel":
        return "Class Cancelled";
      case "compensation":
        return "Compensation";
      case "leave":
        return "Leave";
      default:
        return status;
    }
  };
  
  return (
    <AppShell>
      <div className="flex flex-col min-h-screen">
        <PageHeader 
          title="My Attendance" 
          description="Track your attendance across all courses"
          breadcrumbs={[
            { title: "Dashboard", href: "/student/dashboard", icon: <Clock className="h-4 w-4" /> },
            { title: "Attendance", icon: <Clock className="h-4 w-4" /> }
          ]}
        />
        
        <div className="flex-1 space-y-4 p-6 pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <Card className="bg-green-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Present</p>
                      <h3 className="text-2xl font-bold text-green-700">
                        {attendanceLoading ? <Skeleton className="h-8 w-12" /> : `${stats.present}%`}
                      </h3>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Absent</p>
                      <h3 className="text-2xl font-bold text-red-700">
                        {attendanceLoading ? <Skeleton className="h-8 w-12" /> : `${stats.absent}%`}
                      </h3>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </CardContent>
                </Card>
                
                <Card className="bg-amber-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600">Class Cancelled</p>
                      <h3 className="text-2xl font-bold text-amber-700">
                        {attendanceLoading ? <Skeleton className="h-8 w-12" /> : `${stats.class_cancel}%`}
                      </h3>
                    </div>
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                  </CardContent>
                </Card>

                <HoverCard>
                  <HoverCardTrigger>
                    <Card className="bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Compensation</p>
                          <h3 className="text-2xl font-bold text-purple-700">
                            {attendanceLoading ? <Skeleton className="h-8 w-12" /> : `${stats.compensation}%`}
                          </h3>
                        </div>
                        <Clock className="h-8 w-8 text-purple-500" />
                      </CardContent>
                    </Card>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Compensation Class Rules</h4>
                      <ul className="text-sm space-y-3">
                        <li className="flex items-start">
                          <Clock className="h-4 w-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span>Can only be taken within the same month of absence</span>
                        </li>
                        <li className="flex items-start">
                          <MapPin className="h-4 w-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span>Must be at same brand but from diiferent locations</span>
                        </li>
                        <li className="flex items-start">
                          <Users className="h-4 w-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span>Student's batch will not be changed—no duplication or swap</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span>Attendance must be verified before marking compensation</span>
                        </li>
                      </ul>
                      <div className="mt-3 bg-purple-50 p-2 rounded text-sm">
                        <p className="font-medium text-purple-700">How to Request:</p>
                        <ol className="list-decimal ml-5 mt-1 text-purple-600 space-y-1">
                          <li>Inform administration about absence</li>
                          <li>Choose available compensation slot</li>
                          <li>Wait for verification and confirmation</li>
                        </ol>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                
                <HoverCard>
                  <HoverCardTrigger>
                    <Card className="bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Leave</p>
                          <h3 className="text-2xl font-bold text-blue-700">
                            {attendanceLoading ? <Skeleton className="h-8 w-12" /> : `${stats.leave}%`}
                          </h3>
                        </div>
                        <AlertCircle className="h-8 w-8 text-blue-500" />
                      </CardContent>
                    </Card>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        <h4 className="text-sm font-semibold">Leave of Absence & Refund Policy</h4>
                      </div>
                      <p className="text-sm text-muted-foreground ml-7">
                        The following types of leave are eligible for refund when informed in advance:
                      </p>
                      <ul className="text-sm space-y-3 ml-7">
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
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Select Course</label>
                  <Select 
                    defaultValue={selectedCourse}
                    onValueChange={(value) => {
                      setSelectedCourse(value);
                      refetchAttendance();
                    }}
                    disabled={coursesLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Courses</SelectLabel>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses?.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Select Month</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        {date ? format(date, "MMMM yyyy") : "Select month"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceLoading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        </TableRow>
                      ))
                    ) : attendance && attendance.length > 0 ? (
                      attendance.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {record.date ? format(new Date(record.date), "dd MMM yyyy") : "15 Apr 2023"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                              {record.courseName || "Guitar Fundamentals"}
                            </div>
                          </TableCell>
                          <TableCell>{record.teacherName || "John Doe"}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              {getStatusIcon(record.status || "present")}
                              <span className="ml-2">{getStatusText(record.status || "present")}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {record.status === "compensation" && record.compensationDetails ? (
                              <HoverCard>
                                <HoverCardTrigger>
                                  <span className="text-purple-600 cursor-help">
                                    {record.remarks || "Compensation class"}
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Compensation Class Details</h4>
                                    <div className="text-sm space-y-1">
                                      <p>
                                        <span className="font-medium">Original Class:</span>{" "}
                                        {format(new Date(record.compensationDetails.originalClassDate), "dd MMM yyyy")}
                                      </p>
                                      <p>
                                        <span className="font-medium">Original Batch:</span>{" "}
                                        {record.compensationDetails.originalBatchId}
                                      </p>
                                      <p>
                                        <span className="font-medium">Compensation at:</span>{" "}
                                        {record.compensationDetails.branch}
                                      </p>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            ) : (
                              record.remarks || "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No attendance records found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}