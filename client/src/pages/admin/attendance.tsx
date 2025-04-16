// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Batch, Course, Enrollment, Student } from "@shared/schema";
// import { AppShell } from "@/components/layout/app-shell";
// import { PageHeader } from "@/components/ui/page-header";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { cn } from "@/lib/utils";
// import { 
//   Select, 
//   SelectContent, 
//   SelectItem, 
//   SelectTrigger, 
//   SelectValue 
// } from "@/components/ui/select";
// import { 
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { 
//   CheckCircle2, 
//   XCircle, 
//   Clock, 
//   MoveRight, 
//   CheckCircle, 
//   XCircleIcon, 
//   ClockIcon,
//   AlarmCheck,
//   CalendarCheck
// } from "lucide-react";
// import { format } from "date-fns";

// export default function AdminAttendance() {
//   const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
//   const [selectedBatch, setSelectedBatch] = useState<string>("");
//   const [activeTab, setActiveTab] = useState("mark");
//   const [attendance, setAttendance] = useState<Record<string, string>>({});

//   // Fetch batches
//   const { data: batches = [], isLoading: isLoadingBatches } = useQuery<Batch[]>({
//     queryKey: ["/api/batches"],
//   });

//   // Fetch students for selected batch
//   const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
//     queryKey: ["/api/students", { batchId: selectedBatch }],
//     enabled: !!selectedBatch,
//   });

//   // Fetch courses
//   const { data: courses = [], isLoading: isLoadingCourses } = useQuery<Course[]>({
//     queryKey: ["/api/courses"],
//   });

//   const handleMarkAttendance = (enrollmentId: number, status: string) => {
//     console.log(`Marking attendance for enrollment ${enrollmentId} as ${status}`);
//     // This would make an API call in a real app
//   };
//   const handleAttendanceChange = (studentId: string, status: string) => {
//     setAttendance(prev => ({
//       ...prev,
//       [studentId]: status
//     }));
//   };

//   // Get batch name by id
//   const getBatchName = (batchId: string) => {
//     const batch = batches.find((b: Batch) => b.id.toString() === batchId);
//     return batch ? batch.name : "Unknown Batch";
//   };

//   // Get course name by id
//   const getCourseName = (courseId: number) => {
//     const course = courses.find((c: Course) => c.id === courseId);
//     return course ? course.name : "Unknown Course";
//   };

//   // Format selected date for display
//   const formattedDate = selectedDate 
//     ? format(selectedDate, "EEEE, MMMM do, yyyy")
//     : "Select a date";

//   // Demo attendance data for reports tab
//   const attendanceReportData = [
//     { id: 1, studentName: "Aryan Rajput", present: 18, absent: 2, late: 0, excused: 0, total: 20, presentPercentage: 90 },
//     { id: 2, studentName: "Sanya Desai", present: 16, absent: 1, late: 3, excused: 0, total: 20, presentPercentage: 80 },
//     { id: 3, studentName: "Rohan Patel", present: 15, absent: 3, late: 1, excused: 1, total: 20, presentPercentage: 75 },
//     { id: 4, studentName: "Kavya Sharma", present: 19, absent: 0, late: 1, excused: 0, total: 20, presentPercentage: 95 },
//     { id: 5, studentName: "Arnav Mehta", present: 17, absent: 2, late: 0, excused: 1, total: 20, presentPercentage: 85 },
//   ];

//   return (
//     <AppShell>
//       <PageHeader 
//         title="Attendance Management" 
//         description="Track and manage student attendance for all batches."
//       />
      
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
//         <TabsList>
//           <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
//           <TabsTrigger value="reports">Attendance Reports</TabsTrigger>
//         </TabsList>
        
//         <TabsContent value="mark" className="mt-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <Card className="md:col-span-1">
//               <CardHeader>
//                 <CardTitle>Select Date & Batch</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div>
//                   <Calendar
//                     mode="single"
//                     selected={selectedDate}
//                     onSelect={setSelectedDate}
//                     className="rounded-md border"
//                   />
//                 </div>
                
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium">Selected Date:</label>
//                   <div className="p-2 bg-neutral-100 rounded text-neutral-700">
//                     {formattedDate}
//                   </div>
//                 </div>
                
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium">Select Batch:</label>
//                   <Select value={selectedBatch} onValueChange={setSelectedBatch}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select a batch" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {batches.map((batch: any) => (
//                         <SelectItem key={batch.id} value={batch.id.toString()}>
//                           {batch.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
                
//                 {selectedBatch && (
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium">Batch Details:</label>
//                     <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
//                       <h4 className="font-medium">{getBatchName(selectedBatch)}</h4>
//                       <p className="text-sm text-neutral-500 mt-1">
//                         {(() => {
//                           const batch = batches.find((b: Batch) => b.id.toString() === selectedBatch);
//                           return batch ? getCourseName(batch.courseId) : "Unknown Course";
//                         })()}
//                       </p>
//                       <div className="flex items-center mt-2">
//                         <CalendarCheck className="h-4 w-4 text-neutral-500 mr-1" />
//                         <span className="text-xs text-neutral-500">
//                           {format(new Date(), "h:mm a")} - Room 103
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
            
//             <Card className="md:col-span-2">
//               <CardHeader>
//                 <CardTitle>
//                   {selectedBatch 
//                     ? `Mark Attendance for ${getBatchName(selectedBatch)}`
//                     : "Select a batch to mark attendance"}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {selectedBatch && isLoadingStudents ? (
//                   <div>Loading students...</div>
//                 ) : selectedBatch && students.length === 0 ? (
//                   <div>No students enrolled in this batch.</div>
//                 ) : (
//                   <div>
//                     {students.map((student) => (
//                       <div key={student.id} className="flex items-center space-x-4 p-4 border-b">
//                         <div className="flex-1">
//                           <h3 className="font-medium">{student.firstName} {student.lastName}</h3>
//                           <p className="text-sm text-gray-500">{student.studentId}</p>
//                         </div>
//                         <div className="flex space-x-2">
//                           {/* <Button onClick={() => handleAttendanceChange(student.id.toString(), "present")} variant="outline" size="sm">
//                             <CheckCircle2 className="h-4 w-4 mr-1" />
//                             Present
//                           </Button>
//                           <Button onClick={() => handleAttendanceChange(student.id.toString(), "absent")} variant="outline" size="sm">
//                             <XCircle className="h-4 w-4 mr-1" />
//                             Absent
//                           </Button>
//                           <Button onClick={() => handleAttendanceChange(student.id.toString(), "leave")} variant="outline" size="sm">
//                             <Clock className="h-4 w-4 mr-1" />
//                             Leave
//                           </Button> */}
//                           <Button
//                           variant={attendance[student.id] === "present" ? "default" : "outline"}
//                           size="sm"
//                           className={cn(
//                             "w-20",
//                             attendance[student.id] === "present" && "bg-green-500 hover:bg-green-600"
//                           )}
//                           onClick={() => handleAttendanceChange(student.id.toString(), "present")}
//                         >
//                           <CheckCircle className="h-4 w-4 mr-1" />
//                           Present
//                         </Button>
//                         <Button
//                           variant={attendance[student.id] === "absent" ? "default" : "outline"}
//                           size="sm"
//                           className={cn(
//                             "w-20",
//                             attendance[student.id] === "absent" && "bg-red-500 hover:bg-red-600"
//                           )}
//                           onClick={() => handleAttendanceChange(student.id.toString(), "absent")}
//                         >
//                           <XCircle className="h-4 w-4 mr-1" />
//                           Absent
//                         </Button>
//                         <Button
//                           variant={attendance[student.id] === "leave" ? "default" : "outline"}
//                           size="sm"
//                           className={cn(
//                             "w-20",
//                             attendance[student.id] === "leave" && "bg-yellow-500 hover:bg-yellow-600"
//                           )}
//                           onClick={() => handleAttendanceChange(student.id.toString(), "leave")}
//                         >
//                           <Clock className="h-4 w-4 mr-1" />
//                           Leave
//                         </Button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
                
//                 {selectedBatch && students.length > 0 && (
//                   <div className="mt-4 flex justify-end">
//                     <Button>
//                       Save Attendance <MoveRight className="ml-2 h-4 w-4" />
//                     </Button>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>
        
//         <TabsContent value="reports" className="mt-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Attendance Summary Report</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid md:grid-cols-2 gap-4 mb-6">
//                 <Select defaultValue="batch1">
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select batch" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="batch1">Piano Basics - Batch P01</SelectItem>
//                     <SelectItem value="batch2">Guitar Advanced - Batch G03</SelectItem>
//                     <SelectItem value="batch3">Vocal Training - Batch V01</SelectItem>
//                   </SelectContent>
//                 </Select>
                
//                 <Select defaultValue="current">
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select period" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="current">Current Month</SelectItem>
//                     <SelectItem value="previous">Previous Month</SelectItem>
//                     <SelectItem value="quarter">Last Quarter</SelectItem>
//                     <SelectItem value="custom">Custom Range</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
              
//               <div className="border rounded-md overflow-hidden">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Student Name</TableHead>
//                       <TableHead className="text-center">Present</TableHead>
//                       <TableHead className="text-center">Absent</TableHead>
//                       <TableHead className="text-center">Late</TableHead>
//                       {/* <TableHead className="text-center">Excused</TableHead> */}
//                       <TableHead className="text-center">Attendance %</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {attendanceReportData.map((student) => (
//                       <TableRow key={student.id}>
//                         <TableCell className="font-medium">{student.studentName}</TableCell>
//                         <TableCell className="text-center">
//                           <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
//                             <CheckCircle className="h-3 w-3 mr-1" /> {student.present}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-center">
//                           <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
//                             <XCircleIcon className="h-3 w-3 mr-1" /> {student.absent}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-center">
//                           <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
//                             <ClockIcon className="h-3 w-3 mr-1" /> {student.late}
//                           </Badge>
//                         </TableCell>
//                         {/* <TableCell className="text-center">
//                           <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
//                             {student.excused}
//                           </Badge>
//                         </TableCell> */}
//                         <TableCell className="text-center">
//                           <div className="flex items-center justify-center">
//                             <span className={`font-medium text-sm ${
//                               student.presentPercentage >= 90 
//                                 ? 'text-green-600' 
//                                 : student.presentPercentage >= 75 
//                                 ? 'text-amber-600' 
//                                 : 'text-red-600'
//                             }`}>
//                               {student.presentPercentage}%
//                             </span>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
              
//               <div className="mt-6 flex justify-end space-x-4">
//                 {/* <Button variant="outline">
//                   Generate PDF Report
//                 </Button> */}
//                 <Button>
//                   Export Data
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </AppShell>
//   );
// }



import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Batch, Course, Enrollment, Student } from "@shared/schema";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoveRight, 
  CheckCircle, 
  XCircleIcon, 
  ClockIcon,
  AlarmCheck,
  CalendarCheck
} from "lucide-react";
import { format } from "date-fns";
// import { toast } from "@/components/ui/use-toast";
import { toast } from "@/hooks/use-toast";


interface AttendanceRecord {
  studentId: string;
  status: string;
  date: Date;
  batchId: string;
}

export default function AdminAttendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [activeTab, setActiveTab] = useState("mark");
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [savedAttendance, setSavedAttendance] = useState<AttendanceRecord[]>(() => {
    // Try to load from localStorage on initial render
    const saved = localStorage.getItem('savedAttendance');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever savedAttendance changes
  useEffect(() => {
    localStorage.setItem('savedAttendance', JSON.stringify(savedAttendance));
  }, [savedAttendance]);

  // State for attendance records grouped by batch
  const [attendanceByBatch, setAttendanceByBatch] = useState<Record<string, AttendanceRecord[]>>(() => {
    const saved = localStorage.getItem('attendanceByBatch');
    return saved ? JSON.parse(saved) : {};
  });

  // Save attendance records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('attendanceByBatch', JSON.stringify(attendanceByBatch));
  }, [attendanceByBatch]);

  // Fetch batches
  const { data: batches = [], isLoading: isLoadingBatches } = useQuery<Batch[]>({
    queryKey: ["/api/batches"],
  });

  // Fetch students for selected batch
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students", { batchId: selectedBatch }],
    enabled: !!selectedBatch,
  });

  // Fetch courses
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedBatch) {
        throw new Error("Date and batch must be selected");
      }

      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
        date: selectedDate,
        batchId: selectedBatch
      }));

      // In a real app, you would make an API call here
      // For now, we'll just return the records
      return attendanceRecords;
    },
    onSuccess: (data) => {
      // Update attendance records for the specific batch
      setAttendanceByBatch(prev => ({
        ...prev,
        [selectedBatch]: [
          ...(prev[selectedBatch] || []),
          ...data
        ]
      }));
      
      // Clear current attendance state
      setAttendance({});
      
      toast({
        title: "Attendance saved successfully",
        description: `Attendance for ${format(selectedDate!, "MMMM do, yyyy")} has been saved.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save attendance",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get attendance records for the selected batch
  const filteredSavedAttendance = selectedBatch ? attendanceByBatch[selectedBatch] || [] : [];

  const handleSaveAttendance = () => {
    if (Object.keys(attendance).length === 0) {
      toast({
        title: "No attendance marked",
        description: "Please mark attendance for at least one student before saving.",
        variant: "destructive",
      });
      return;
    }
    saveAttendanceMutation.mutate();
  };

  // Get batch name by id
  const getBatchName = (batchId: string) => {
    const batch = batches.find((b: Batch) => b.id.toString() === batchId);
    return batch ? batch.name : "Unknown Batch";
  };

  // Get student name by id
  const getStudentName = (studentId: string) => {
    const student = students.find((s: Student) => s.id.toString() === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown Student";
  };

  // Get course name by id
  const getCourseName = (courseId: number) => {
    const course = courses.find((c: Course) => c.id === courseId);
    return course ? course.name : "Unknown Course";
  };

  // Format selected date for display
  const formattedDate = selectedDate 
    ? format(selectedDate, "EEEE, MMMM do, yyyy")
    : "Select a date";

  // Group attendance by date
  const attendanceByDate: Record<string, AttendanceRecord[]> = {};
  filteredSavedAttendance.forEach(record => {
    const dateStr = format(record.date, "yyyy-MM-dd");
    if (!attendanceByDate[dateStr]) {
      attendanceByDate[dateStr] = [];
    }
    attendanceByDate[dateStr].push(record);
  });

  return (
    <AppShell>
      <PageHeader 
        title="Attendance Management" 
        description="Track and manage student attendance for all batches."
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="view">View Attendance</TabsTrigger>
          <TabsTrigger value="reports">Attendance Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mark" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Select Date & Batch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selected Date:</label>
                  <div className="p-2 bg-neutral-100 rounded text-neutral-700">
                    {formattedDate}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Batch:</label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch: any) => (
                        <SelectItem key={batch.id} value={batch.id.toString()}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedBatch && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Batch Details:</label>
                    <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                      <h4 className="font-medium">{getBatchName(selectedBatch)}</h4>
                      <p className="text-sm text-neutral-500 mt-1">
                        {(() => {
                          const batch = batches.find((b: Batch) => b.id.toString() === selectedBatch);
                          return batch ? getCourseName(batch.courseId) : "Unknown Course";
                        })()}
                      </p>
                      <div className="flex items-center mt-2">
                        <CalendarCheck className="h-4 w-4 text-neutral-500 mr-1" />
                        <span className="text-xs text-neutral-500">
                          {format(new Date(), "h:mm a")} - Room 103
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedBatch 
                    ? `Mark Attendance for ${getBatchName(selectedBatch)}`
                    : "Select a batch to mark attendance"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBatch && isLoadingStudents ? (
                  <div>Loading students...</div>
                ) : selectedBatch && students.length === 0 ? (
                  <div>No students enrolled in this batch.</div>
                ) : (
                  <div>
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center space-x-4 p-4 border-b">
                        <div className="flex-1">
                          <h3 className="font-medium">{student.firstName} {student.lastName}</h3>
                          <p className="text-sm text-gray-500">{student.studentId}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant={attendance[student.id] === "present" ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "w-20",
                              attendance[student.id] === "present" && "bg-green-500 hover:bg-green-600"
                            )}
                            onClick={() => handleAttendanceChange(student.id.toString(), "present")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            variant={attendance[student.id] === "absent" ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "w-20",
                              attendance[student.id] === "absent" && "bg-red-500 hover:bg-red-600"
                            )}
                            onClick={() => handleAttendanceChange(student.id.toString(), "absent")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                          <Button
                            variant={attendance[student.id] === "leave" ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "w-20",
                              attendance[student.id] === "leave" && "bg-yellow-500 hover:bg-yellow-600"
                            )}
                            onClick={() => handleAttendanceChange(student.id.toString(), "leave")}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Leave
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedBatch && students.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Button 
                      onClick={handleSaveAttendance}
                      disabled={saveAttendanceMutation.isPending || Object.keys(attendance).length === 0}
                    >
                      {saveAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
                      <MoveRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* New View Attendance Tab */}
        <TabsContent value="view" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedBatch ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Please select a batch to view attendance records</p>
                </div>
              ) : filteredSavedAttendance.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No attendance records found for this batch</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(attendanceByDate).map(([date, records]) => (
                    <div key={date} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <h3 className="font-medium">{format(new Date(date), "MMMM do, yyyy")}</h3>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.map((record) => (
                            <TableRow key={`${date}-${record.studentId}`}>
                              <TableCell>{getStudentName(record.studentId)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "capitalize",
                                    record.status === "present" && "bg-green-50 text-green-600 border-green-200",
                                    record.status === "absent" && "bg-red-50 text-red-600 border-red-200",
                                    record.status === "leave" && "bg-yellow-50 text-yellow-600 border-yellow-200"
                                  )}
                                >
                                  {record.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Select defaultValue="batch1">
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="batch1">Piano Basics - Batch P01</SelectItem>
                    <SelectItem value="batch2">Guitar Advanced - Batch G03</SelectItem>
                    <SelectItem value="batch3">Vocal Training - Batch V01</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue="current">
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Month</SelectItem>
                    <SelectItem value="previous">Previous Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const studentRecords = filteredSavedAttendance.filter(
                        r => r.studentId === student.id.toString()
                      );
                      
                      const presentCount = studentRecords.filter(r => r.status === "present").length;
                      const absentCount = studentRecords.filter(r => r.status === "absent").length;
                      const leaveCount = studentRecords.filter(r => r.status === "leave").length;
                      const total = studentRecords.length;
                      const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" /> {presentCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                              <XCircleIcon className="h-3 w-3 mr-1" /> {absentCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                              <ClockIcon className="h-3 w-3 mr-1" /> {leaveCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <span className={`font-medium text-sm ${
                                percentage >= 90 
                                  ? 'text-green-600' 
                                  : percentage >= 75 
                                  ? 'text-amber-600' 
                                  : 'text-red-600'
                              }`}>
                                {percentage}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                {/* <Button variant="outline">
                  Generate PDF Report
                </Button> */}
                <Button>
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}