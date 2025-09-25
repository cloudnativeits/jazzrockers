import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Search, 
  ChevronDown, 
  Music, 
  Calendar, 
  Clock, 
  PhoneCall, 
  Mail, 
  MapPin,
  Info,
  User
} from "lucide-react";
import { format } from "date-fns";
import { getInitials } from "@/lib/utils";

export default function TeacherStudents() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);

  // Fetch batches taught by the teacher
  const { data: batches = [], isLoading: isLoadingBatches } = useQuery<any[]>({
    queryKey: ["/api/batches/teacher"],
    enabled: !!user,
  });

  // Fetch students based on selected batch
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<any[]>({
    queryKey: ["/api/students", { batchId: selectedBatch !== "all" ? selectedBatch : undefined }],
    enabled: !!user && !!selectedBatch,
  });

  // Filter students based on search query
  const filteredStudents = students.filter((student: any) => {
    const searchString = searchQuery.toLowerCase();
    return (
      student.firstName?.toLowerCase().includes(searchString) ||
      student.lastName?.toLowerCase().includes(searchString) ||
      student.studentId?.toLowerCase().includes(searchString)
    );
  });

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setIsStudentDetailsOpen(true);
  };

  return (
    <AppShell>
      <PageHeader
        title="Students"
        description="Manage and view information about students in your batches"
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Search by name or ID..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/3">
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map((batch: any) => (
                      <SelectItem key={batch.id} value={batch.id.toString()}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Students List</CardTitle>
            <CardDescription>
              {selectedBatch === "all" 
                ? "All students enrolled in your batches" 
                : `Students enrolled in ${batches.find((b: any) => b.id.toString() === selectedBatch)?.name || "selected batch"}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
              <div className="text-center py-10">
                Loading students...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-10 text-neutral-500">
                No students found
              </div>
            ) : (
              <div className="border rounded-md mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead>Student ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Batch</TableHead>
                      {/* <TableHead className="text-right">Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">
                                {student.firstName} {student.lastName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <PhoneCall className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              {student.phone || 'Not provided'}
                            </div>
                            <div className="flex items-center text-sm">
                              <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              {student.email || 'Not provided'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {batches.find((b: any) => b.id.toString() === student.batch)?.name || 'Unknown'}
                        </TableCell>
                        {/* <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                          >
                            View Details
                          </Button>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Details Dialog */}
      <Dialog open={isStudentDetailsOpen} onOpenChange={setIsStudentDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Student Information</DialogTitle>
            <DialogDescription>
              Detailed information about the student
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="mt-4">
              <Tabs defaultValue="overview">
                <TabsList className="w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center md:w-1/3">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-lg">
                          {getInitials(selectedStudent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-lg mt-3">{selectedStudent.name}</h3>
                      <p className="text-sm text-neutral-500">Student ID: {selectedStudent.studentId}</p>
                      
                      <div className="flex flex-col space-y-2 mt-4 w-full">
                        <Badge variant="outline" className="justify-center">
                          {selectedStudent.batchName}
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          {selectedStudent.courseName}
                        </Badge>
                      </div>

                      <Button variant="outline" className="mt-4 w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>

                    <div className="md:w-2/3 space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex">
                            <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                            <span className="text-sm">{selectedStudent.email || "Email not provided"}</span>
                          </div>
                          <div className="flex">
                            <PhoneCall className="h-4 w-4 mr-2 text-neutral-500" />
                            <span className="text-sm">{selectedStudent.phone || "Phone not provided"}</span>
                          </div>
                          <div className="flex">
                            <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
                            <span className="text-sm">{selectedStudent.address || "Address not provided"}</span>
                          </div>
                          <div className="flex">
                            <User className="h-4 w-4 mr-2 text-neutral-500" />
                            <span className="text-sm">Parent: {selectedStudent.parentName || "Not provided"}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Course Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Overall Progress</span>
                              <span className="font-medium">{selectedStudent.progress || 0}%</span>
                            </div>
                            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${selectedStudent.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Schedule</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex">
                            <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                            <span className="text-sm">
                              {selectedStudent.classDays || "Schedule not available"}
                            </span>
                          </div>
                          <div className="flex">
                            <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                            <span className="text-sm">
                              {selectedStudent.classTime || "Time not specified"}
                            </span>
                          </div>
                          <div className="flex">
                            <Music className="h-4 w-4 mr-2 text-neutral-500" />
                            <span className="text-sm">
                              Instrument: {selectedStudent.instrument || "Not specified"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attendance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-neutral-500 mb-4">
                        Overall attendance rate: <strong>{selectedStudent.attendance?.rate || 0}%</strong>
                      </p>
                      
                      {/* Placeholder for attendance history */}
                      <div className="text-center py-8 text-neutral-500">
                        Detailed attendance records will be displayed here
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="performance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-neutral-500">
                        Performance metrics and assessments will be displayed here
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes">
                  <Card>
                    <CardHeader>
                      <CardTitle>Teacher Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-neutral-500">
                        Notes and observations about the student will be displayed here
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}