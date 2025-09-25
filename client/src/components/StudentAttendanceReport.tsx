// components/student-attendance-report.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircleIcon, ClockIcon, FileSpreadsheet, FileText, XCircle, CalendarCheck, Clock, AlarmCheck } from "lucide-react";
import { format } from "date-fns";
import { Student, Batch, Enrollment } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface StudentAttendanceReportProps {
  students: Student[];
  batches: Batch[];
  enrollments: Enrollment[];
  selectedStudent: { student: Student; batch?: Batch; } | null;
  setSelectedStudent: (student: { student: Student; batch?: Batch; } | null) => void;
  //   onExport: (type: "excel" | "pdf") => void;

  // Accept data and loading state from the parent
  attendanceRecords: any[];
  isDataLoading: boolean;

  // Accept date values and setters from the parent
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
}

export function StudentAttendanceReport({
  students,
  batches,
  enrollments,
  selectedStudent,
  setSelectedStudent,
  //   onExport,
  // 2. DESTRUCTURE THE NEW PROPS
  attendanceRecords,
  isDataLoading,
  startDate,
  endDate,
  setStartDate,
  setEndDate
}: StudentAttendanceReportProps) {
  const [studentSearch, setStudentSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const searchStudents = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const results = students.filter(student =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleStudentSelect = (student: Student) => {
    const batch = batches.find(b => b.id.toString() === enrollments.find(e => e.studentId === student.id)?.batchId?.toString());
    setSelectedStudent({ student, batch });
    setStudentSearch("");
    setSearchResults([]);
  };




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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student-wise Report</CardTitle>
        <CardDescription>
          Search for a student to view their detailed attendance report.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Date controls */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Student</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Student by name or ID..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  searchStudents(e.target.value);
                }}
                className="w-full px-3 py-2 border rounded-md"
              />
              {searchResults.length > 0 && studentSearch && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((student) => {
                    const batch = batches.find(
                      (b) =>
                        b.id.toString() ===
                        enrollments.find((e) => e.studentId === student.id)?.batchId?.toString()
                    );
                    return (
                      <button
                        key={student.id}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex flex-col"
                        onClick={() => handleStudentSelect(student)}
                      >
                        <span className="font-medium">
                          {student.firstName} {student.lastName} - {student.studentId}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="space-y-2 w-full">
              <label className="text-sm font-medium">Start Date:</label>
              <input
                type="date"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setStartDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="rounded-md border p-2 w-full"
              />
            </div>
            <div className="space-y-2 w-full">
              <label className="text-sm font-medium">End Date:</label>
              <input
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setEndDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="rounded-md border p-2 w-full"
              />
            </div>
          </div>
        </div>

        {selectedStudent && (
          <div className="space-y-4">
            {/* Selected Student Info */}
            <div className="p-4 border rounded-lg bg-muted">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedStudent.student.firstName} {selectedStudent.student.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Student ID: {selectedStudent.student.studentId}
                  </p>
                  {selectedStudent.batch && (
                    <p className="text-sm text-muted-foreground">
                      Batch: {selectedStudent.batch.name} - {selectedStudent.batch.branch}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
                  Clear Selection
                </Button>
              </div>
            </div>

            {/* Attendance Summary & Records */}
            {isDataLoading ? (
              <div>Loading attendance data...</div>
            ) : (
              <div className="grid gap-4">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const records = attendanceRecords || [];
                      const present = records.filter((r) => r.status === "present").length;
                      const absent = records.filter((r) => r.status === "absent").length;
                      const leave = records.filter((r) => r.status === "leave").length;
                      const total = present + absent + leave;

                      return (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          <div className="p-4 border rounded-lg">
                            <div className="text-sm font-medium text-muted-foreground">Total Classes</div>
                            <div className="text-2xl font-bold">{total}</div>
                          </div>
                          <div className="p-4 border rounded-lg bg-green-50">
                            <div className="text-sm font-medium text-muted-foreground">Present</div>
                            <div className="text-2xl font-bold text-green-600">{present}</div>
                          </div>
                          <div className="p-4 border rounded-lg bg-red-50">
                            <div className="text-sm font-medium text-muted-foreground">Absent</div>
                            <div className="text-2xl font-bold text-red-600">{absent}</div>
                          </div>
                          <div className="p-4 border rounded-lg bg-yellow-50">
                            <div className="text-sm font-medium text-muted-foreground">Leave</div>
                            <div className="text-2xl font-bold text-yellow-600">{leave}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Detailed Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Batch</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRecords?.map((item, index) => (
                          <TableRow key={`${item.date?.value}-${index}`}>
                            <TableCell>
                              {format(new Date(item.date.value), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>{item.batchName || "Unknown Batch"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {/* <div className="mt-6 flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => onExport("excel")}
                    disabled={attendanceRecords.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onExport("pdf")}
                    disabled={attendanceRecords.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div> */}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

  );
}