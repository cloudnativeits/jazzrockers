import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, User, Calendar as CalendarIcon, CheckCircle, XCircle, Info } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from "date-fns";

export default function ParentAttendance() {
  const [selectedStudent, setSelectedStudent] = useState<string>("1");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [tab, setTab] = useState("calendar");
  
  // Mock data
  const students = [
    { id: "1", name: "Riya Sharma" },
    { id: "2", name: "Arjun Sharma" }
  ];

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

  // Mock attendance data
  const attendanceData = [
    {
      id: 1,
      date: new Date(2023, 9, 2), // Oct 2, 2023
      course: "Guitar Lessons",
      student: "1", // Riya
      status: "present",
      notes: "Performed well in class, practiced chord progressions"
    },
    {
      id: 2,
      date: new Date(2023, 9, 5), // Oct 5, 2023
      course: "Guitar Lessons",
      student: "1", // Riya
      status: "present",
      notes: "Worked on fingerpicking technique"
    },
    {
      id: 3,
      date: new Date(2023, 9, 9), // Oct 9, 2023
      course: "Guitar Lessons",
      student: "1", // Riya
      status: "present",
      notes: "Review of previous lessons"
    },
    {
      id: 4,
      date: new Date(2023, 9, 12), // Oct 12, 2023
      course: "Guitar Lessons",
      student: "1", // Riya
      status: "present",
      notes: "Started new song"
    },
    {
      id: 5,
      date: new Date(2023, 9, 16), // Oct 16, 2023
      course: "Guitar Lessons",
      student: "1", // Riya
      status: "absent",
      notes: "Absent due to illness"
    },
    {
      id: 6,
      date: new Date(2023, 9, 19), // Oct 19, 2023
      course: "Guitar Lessons",
      student: "1", // Riya
      status: "present",
      notes: "Good progress on song"
    },
    {
      id: 7,
      date: new Date(2023, 9, 23), // Oct 23, 2023
      course: "Guitar Lessons",
      student: "1", // Riya
      status: "present",
      notes: "Practiced for upcoming recital"
    },
    {
      id: 8,
      date: new Date(2023, 9, 26), // Oct 26, 2023
      course: "Guitar Lessons",
      student: "1", // Riya
      status: "present",
      notes: "Final preparation for recital"
    },
    {
      id: 9,
      date: new Date(2023, 9, 3), // Oct 3, 2023
      course: "Piano Basics",
      student: "2", // Arjun
      status: "present",
      notes: "Worked on scales"
    },
    {
      id: 10,
      date: new Date(2023, 9, 6), // Oct 6, 2023
      course: "Piano Basics",
      student: "2", // Arjun
      status: "present",
      notes: "Practiced new piece"
    },
    {
      id: 11,
      date: new Date(2023, 9, 10), // Oct 10, 2023
      course: "Piano Basics",
      student: "2", // Arjun
      status: "present",
      notes: "Good progress on technique"
    },
    {
      id: 12,
      date: new Date(2023, 9, 13), // Oct 13, 2023
      course: "Piano Basics",
      student: "2", // Arjun
      status: "present",
      notes: "Worked on rhythm exercises"
    },
    {
      id: 13,
      date: new Date(2023, 9, 17), // Oct 17, 2023
      course: "Piano Basics",
      student: "2", // Arjun
      status: "present",
      notes: "Started new piece"
    },
    {
      id: 14,
      date: new Date(2023, 9, 20), // Oct 20, 2023
      course: "Piano Basics",
      student: "2", // Arjun
      status: "present",
      notes: "Review of previous lessons"
    },
    {
      id: 15,
      date: new Date(2023, 9, 24), // Oct 24, 2023
      course: "Piano Basics",
      student: "2", // Arjun
      status: "present",
      notes: "Mastered the new piece"
    },
    {
      id: 16,
      date: new Date(2023, 9, 27), // Oct 27, 2023
      course: "Piano Basics",
      student: "2", // Arjun
      status: "present",
      notes: "Prepared for upcoming exam"
    }
  ];

  // Get filtered attendance data for the selected student and month
  const filteredAttendance = attendanceData.filter(record => {
    const isSameMonth = record.date.getMonth() === selectedMonth.getMonth() && 
                        record.date.getFullYear() === selectedMonth.getFullYear();
    return record.student === selectedStudent && isSameMonth;
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
        description="Track your children's class attendance"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-grow">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {student.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list">
              <Info className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calendar"></TabsContent>
          <TabsContent value="list"></TabsContent>
        </Tabs>
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

      {tab === "calendar" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Attendance Calendar</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-lg font-medium">
                {format(selectedMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                Next
                <CalendarIcon className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="font-medium text-gray-500 text-sm py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Fill in empty cells for days before the first of the month */}
              {Array.from({ length: startOfMonth(selectedMonth).getDay() }).map((_, i) => (
                <div key={`empty-start-${i}`} className="h-24 bg-gray-50 rounded-md"></div>
              ))}

              {/* Days of the month */}
              {daysInMonth.map((day) => {
                const dayAttendance = filteredAttendance.filter(record => 
                  isSameDay(record.date, day)
                );
                const hasPresent = dayAttendance.some(record => record.status === "present");
                const hasAbsent = dayAttendance.some(record => record.status === "absent");
                
                return (
                  <div 
                    key={day.toString()}
                    className={`h-24 rounded-md p-1 border ${
                      isSameDay(day, new Date()) ? "bg-blue-50 border-blue-200" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-medium ${
                        isSameDay(day, new Date()) ? "text-blue-600" : ""
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {dayAttendance.length > 0 && (
                        <div className="flex flex-col items-end">
                          {hasPresent && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {hasAbsent && <XCircle className="h-4 w-4 text-red-500 mt-1" />}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px]">
                      {dayAttendance.map((record) => (
                        <div 
                          key={record.id} 
                          className={`text-xs p-1 rounded ${
                            record.status === "present" 
                              ? "bg-green-100 border-l-2 border-green-500" 
                              : "bg-red-100 border-l-2 border-red-500"
                          }`}
                        >
                          <div className="font-medium truncate">{record.course}</div>
                          <div className="truncate">{record.status === "present" ? "Attended" : "Absent"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Fill in empty cells for days after the end of the month */}
              {Array.from({ length: 6 - endOfMonth(selectedMonth).getDay() }).map((_, i) => (
                <div key={`empty-end-${i}`} className="h-24 bg-gray-50 rounded-md"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.length > 0 ? (
                  filteredAttendance
                    .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date, newest first
                    .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{format(record.date, 'MMM d, yyyy')}</TableCell>
                        <TableCell>{record.course}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`flex items-center w-24 justify-center ${
                            record.status === "present" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {record.status === "present" ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Present
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Absent
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-gray-600">{record.notes}</span>
                        </TableCell>
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
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}