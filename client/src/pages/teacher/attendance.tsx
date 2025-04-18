// import { useState, useEffect } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { useAuth } from "@/hooks/use-auth";
// import { AppShell } from "@/components/layout/app-shell";
// import { PageHeader } from "@/components/ui/page-header";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Calendar as CalendarIcon, Search, CheckCircle, XCircle, Clock } from "lucide-react";
// import { Calendar } from "@/components/ui/calendar";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Input } from "@/components/ui/input";
// import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { useToast } from "@/hooks/use-toast";

// export default function TeacherAttendance() {
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
//   const [searchQuery, setSearchQuery] = useState("");
//   const [attendance, setAttendance] = useState<Record<string, string>>({});

//   const { data: batches = [], isLoading: isLoadingBatches } = useQuery<any[]>({
//     queryKey: ["/api/batches/teacher"],
//     enabled: !!user,
//   });

//   const { data: students = [], isLoading: isLoadingStudents } = useQuery<any[]>({
//     queryKey: ["/api/students", { batchId: selectedBatch }],
//     enabled: !!selectedBatch,
//   });

//   const { data: existingAttendance = [], isLoading: isLoadingAttendance } = useQuery<any[]>({
//     queryKey: ["/api/attendance", { batchId: selectedBatch, date: selectedDate }],
//     enabled: !!selectedBatch && !!selectedDate,
//   });

//   // Initialize attendance from existing records
//   useEffect(() => {
//     if (existingAttendance && existingAttendance.length > 0) {
//       const attendanceMap: Record<string, string> = {};
//       existingAttendance.forEach((record: any) => {
//         attendanceMap[record.studentId.toString()] = record.status;
//       });
//       setAttendance(attendanceMap);
//     }
//   }, [existingAttendance]);

//   // Filter students based on search query
//   const filteredStudents = students.filter((student: any) => {
//     const searchString = searchQuery.toLowerCase();
//     return (
//       student.firstName?.toLowerCase().includes(searchString) ||
//       student.lastName?.toLowerCase().includes(searchString) ||
//       student.studentId?.toLowerCase().includes(searchString)
//     );
//   });

//   const handleAttendanceChange = (studentId: string, status: string) => {
//     setAttendance(prev => ({
//       ...prev,
//       [studentId]: status
//     }));
//   };

//   const handleSaveAttendance = async () => {
//     try {
//       // Create attendance records to save
//       const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
//         studentId: parseInt(studentId),
//         batchId: parseInt(selectedBatch as string),
//         date: selectedDate,
//         status
//       }));

//       // Make API call to save attendance
//       // This will depend on your API structure
//       /*
//       await apiRequest("POST", "/api/teacher/save-attendance", {
//         batchId: selectedBatch,
//         date: selectedDate,
//         records: attendanceRecords
//       });
//       */

//       toast({
//         title: "Attendance saved",
//         description: "The attendance has been recorded successfully.",
//       });
//     } catch (error) {
//       toast({
//         title: "Error saving attendance",
//         description: "There was a problem saving the attendance. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   const markAllPresent = () => {
//     const newAttendance: Record<string, string> = {};
//     filteredStudents.forEach((student: any) => {
//       newAttendance[student.id.toString()] = "present";
//     });
//     setAttendance(newAttendance);
//   };

//   return (
//     <AppShell>
//       <PageHeader
//         title="Attendance Management"
//         description="Record and manage student attendance for your batches"
//       />

//       <div className="grid grid-cols-1 gap-6">
//         {/* Batch Selector and Date Picker */}
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//               <div className="w-full md:w-1/2">
//                 <label className="text-sm font-medium block mb-1">Select Batch</label>
//                 <Select value={selectedBatch || ""} onValueChange={setSelectedBatch}>
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select a batch" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {batches.map((batch: any) => (
//                       <SelectItem key={batch.id} value={batch.id.toString()}>
//                         {batch.name} ({batch.courseName})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="w-full md:w-1/2">
//                 <label className="text-sm font-medium block mb-1">Select Date</label>
//                 <Popover>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant={"outline"}
//                       className="w-full justify-start text-left font-normal"
//                     >
//                       <CalendarIcon className="mr-2 h-4 w-4" />
//                       {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-auto p-0">
//                     <Calendar
//                       mode="single"
//                       selected={selectedDate}
//                       onSelect={(date) => date && setSelectedDate(date)}
//                       initialFocus
//                     />
//                   </PopoverContent>
//                 </Popover>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Attendance Records */}
//         <Card>
//           <CardHeader className="pb-2">
//             <div className="flex items-center justify-between">
//               <CardTitle>Students</CardTitle>
//               <div className="flex space-x-2">
//                 <div className="relative w-64">
//                   <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
//                   <Input
//                     type="text"
//                     placeholder="Search students..."
//                     className="pl-9 w-full"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                   />
//                 </div>
//                 <Button variant="outline" onClick={markAllPresent}>
//                   Mark All Present
//                 </Button>
//                 <Button onClick={handleSaveAttendance}>
//                   Save Attendance
//                 </Button>
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent>
//             {!selectedBatch ? (
//               <div className="text-center py-10 text-neutral-500">
//                 Please select a batch to view students
//               </div>
//             ) : isLoadingStudents ? (
//               <div className="text-center py-10">Loading students...</div>
//             ) : filteredStudents.length === 0 ? (
//               <div className="text-center py-10 text-neutral-500">
//                 No students found in this batch
//               </div>
//             ) : (
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Student ID</TableHead>
//                     <TableHead>Name</TableHead>
//                     <TableHead className="text-center">Present</TableHead>
//                     <TableHead className="text-center">Absent</TableHead>
//                     <TableHead className="text-center">Leave</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredStudents.map((student: any) => (
//                     <TableRow key={student.id}>
//                       <TableCell>{student.studentId}</TableCell>
//                       <TableCell>
//                         <div className="font-medium">
//                           {student.firstName} {student.lastName}
//                         </div>
//                       </TableCell>
//                       <TableCell className="text-center">
//                         <Button
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
//                       </TableCell>
//                       <TableCell className="text-center">
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
//                       </TableCell>
//                       <TableCell className="text-center">
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
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </AppShell>
//   );
// }



import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function TeacherAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(new Date());

  const { data: batches = [], isLoading: isLoadingBatches } = useQuery<any[]>({
    queryKey: ["/api/batches/teacher"],
    enabled: !!user,
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery<any[]>({
    queryKey: ["/api/students", { batchId: selectedBatch }],
    enabled: !!selectedBatch,
  });

  // const { data: existingAttendance = [], isLoading: isLoadingAttendance } = useQuery<any[]>({
  //   queryKey: ["/api/attendance", { batchId: selectedBatch, date: selectedDate }],
  //   enabled: !!selectedBatch && !!selectedDate,
  // });
  const { data: existingAttendance = [], isLoading: isLoadingAttendance } = useQuery<any[]>({
    queryKey: ["/api/attendance", { batchId: selectedBatch }],
    enabled: !!selectedBatch,
  });

  // Initialize attendance from existing records
  useEffect(() => {
    if (existingAttendance && existingAttendance.length > 0) {
      const attendanceMap: Record<string, string> = {};
      existingAttendance.forEach((record: any) => {
        attendanceMap[record.studentId.toString()] = record.status;
      });
      setAttendance(attendanceMap);
      setIsSaved(true);
    } else {
      // Initialize with empty or default values if no existing attendance
      const initialAttendance: Record<string, string> = {};
      students.forEach((student: any) => {
        initialAttendance[student.id.toString()] = "present"; // Default to present
      });
      setAttendance(initialAttendance);
      setIsSaved(false);
    }
  }, [existingAttendance, students]);

  // Filter students based on search query
  const filteredStudents = students.filter((student: any) => {
    const searchString = searchQuery.toLowerCase();
    return (
      student.firstName?.toLowerCase().includes(searchString) ||
      student.lastName?.toLowerCase().includes(searchString) ||
      student.studentId?.toLowerCase().includes(searchString)
    );
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceRecords: any[]) => {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId: selectedBatch,
          date: selectedDate,
          records: attendanceRecords,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save attendance");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance saved",
        description: "The attendance has been recorded successfully.",
      });
      setIsSaved(true);
    },
    onError: () => {
      toast({
        title: "Error saving attendance",
        description: "There was a problem saving the attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
    setIsSaved(false);
  };

  const handleSaveAttendance = async () => {
    if (!selectedBatch) {
      toast({
        title: "No batch selected",
        description: "Please select a batch before saving attendance.",
        variant: "destructive",
      });
      return;
    }

    // Create attendance records to save
    const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
      studentId: parseInt(studentId),
      batchId: parseInt(selectedBatch),
      date: selectedDate,
      status
    }));

    await saveAttendanceMutation.mutateAsync(attendanceRecords);
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, string> = {};
    filteredStudents.forEach((student: any) => {
      newAttendance[student.id.toString()] = "present";
    });
    setAttendance(newAttendance);
    setIsSaved(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500">Present</Badge>;
      case "absent":
        return <Badge className="bg-red-500">Absent</Badge>;
      case "leave":
        return <Badge className="bg-yellow-500">Leave</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Attendance Management"
        description="Record and manage student attendance for your batches"
      />

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue="mark" className="w-full">
              <TabsList className="mt-6">
                <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
                <TabsTrigger value="view">View Attendance</TabsTrigger>
              </TabsList>

              <TabsContent value="mark">
                {/* Batch Selector and Date Picker */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="w-full md:w-1/2">
                    <label className="text-sm font-medium block mb-1">Select Batch</label>
                    <Select value={selectedBatch || ""} onValueChange={setSelectedBatch}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch: any) => (
                          <SelectItem key={batch.id} value={batch.id.toString()}>
                            {batch.name} ({batch.courseName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:w-1/2">
                    <label className="text-sm font-medium block mb-1">Select Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Attendance Marking Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                      <Input
                        type="text"
                        placeholder="Search students..."
                        className="pl-9 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={markAllPresent}>
                        Mark All Present
                      </Button>
                      <Button
                        onClick={handleSaveAttendance}
                        disabled={isSaved || saveAttendanceMutation.isPending}
                      >
                        {saveAttendanceMutation.isPending ? "Saving..." : isSaved ? "Saved" : "Save Attendance"}
                      </Button>
                    </div>
                  </div>

                  {!selectedBatch ? (
                    <div className="text-center py-10 text-neutral-500">
                      Please select a batch to view students
                    </div>
                  ) : isLoadingStudents || isLoadingAttendance ? (
                    <div className="text-center py-10">Loading students...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500">
                      No students found in this batch
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-center">Current Status</TableHead>
                          <TableHead className="text-center">Present</TableHead>
                          <TableHead className="text-center">Absent</TableHead>
                          <TableHead className="text-center">Leave</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student: any) => (
                          <TableRow key={student.id}>
                            <TableCell>{student.studentId}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {student.firstName} {student.lastName}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(attendance[student.id] || "pending")}
                            </TableCell>
                            <TableCell className="text-center">
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
                            </TableCell>
                            <TableCell className="text-center">
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
                            </TableCell>
                            <TableCell className="text-center">
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
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="view">
                <div className="space-y-6">
                 {/* Batch Selector */}
             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="w-full md:w-1/2">
                    <label className="text-sm font-medium block mb-1">Select Batch</label>
                    <Select value={selectedBatch || ""} onValueChange={setSelectedBatch}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch: any) => (
                          <SelectItem key={batch.id} value={batch.id.toString()}>
                            {batch.name} ({batch.courseName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-1/2">
                    <label className="text-sm font-medium block mb-1">Select Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {viewDate ? format(viewDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={viewDate}
                          onSelect={(date) => date && setViewDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  </div>

                  {/* Attendance Summary */}
                  {selectedBatch && (
                    <div className="grid gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Attendance Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-green-100 rounded-lg">
                              <div className="text-2xl font-bold text-green-700">
                                {filteredStudents.filter(s => attendance[s.id] === "present").length}
                              </div>
                              <div className="text-sm text-green-600">Present</div>
                            </div>
                            <div className="text-center p-4 bg-red-100 rounded-lg">
                              <div className="text-2xl font-bold text-red-700">
                                {filteredStudents.filter(s => attendance[s.id] === "absent").length}
                              </div>
                              <div className="text-sm text-red-600">Absent</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-100 rounded-lg">
                              <div className="text-2xl font-bold text-yellow-700">
                                {filteredStudents.filter(s => attendance[s.id] === "leave").length}
                              </div>
                              <div className="text-sm text-yellow-600">Leave</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Attendance Records Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Attendance Records</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="relative w-64 mb-4">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                            <Input
                              type="text"
                              placeholder="Search students..."
                              className="pl-9 w-full"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredStudents.map((student: any) => (
                                <TableRow key={student.id}>
                                  <TableCell>{student.studentId}</TableCell>
                                  <TableCell>
                                    <div className="font-medium">
                                      {student.firstName} {student.lastName}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {getStatusBadge(attendance[student.id] || "pending")}
                                  </TableCell>
                                  <TableCell>
                                    {selectedDate ? format(selectedDate, "PPP") : "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}