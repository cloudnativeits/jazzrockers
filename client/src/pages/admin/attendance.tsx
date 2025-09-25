import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Batch, Course, Student, Department, Brand, Employee, Schedule } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  batchId: number;
  branchId: number;
  enrollmentDate: Date;
  durationMonths: number;
  status: string;
  createdAt: Date;
}
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatTimeTo12Hour } from "@/lib/utils";
import { exportAttendance } from "@/lib/exportAttendance";
import { exportStudentAttendance } from "@/lib/exportStudentAttendance";
import ReactSelect from "react-select";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MoveRight,
  CheckCircle,
  XCircleIcon,
  ClockIcon,
  AlarmCheck,
  CalendarCheck,
  CircleSlash2,
  CalendarX
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useMemo } from "react";
import React from "react";



interface AttendanceRecord {
  id: number; // The unique ID for the attendance record itself
  studentId: number;
  status: string;
  date: Date;
  batchId: string;
  compensationDate?: Date | null; // Add this field for the check
}

export default function AdminAttendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [activeTab, setActiveTab] = useState("mark");
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedHolidayBatchIds, setSelectedHolidayBatchIds] = useState<string[]>([]);
  const [studentsWithInvoice, setStudentsWithInvoice] = React.useState<number[]>([]);
  const [markedStatus, setMarkedStatus] = React.useState<Record<string, { status: string; disabled: boolean }>>({});
  const [compensationDate, setCompensationDate] = useState<Date>();
  const [compensationBatchName, setCompensationBatchName] = useState("");
  const [selectedLeaveRecord, setSelectedLeaveRecord] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Handle date changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setStartDate(date);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setEndDate(date);
  };

  console.log(compensationBatchName,'................');
  

  // --- REFACTORED DATA FETCHING ---
  // 1. Replaced the old `useEffect` with `useQuery` to fetch daily attendance status
  const { data: dailyAttendance = [], refetch: refetchDailyAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance', selectedBatch, selectedDate],
    queryFn: async () => {
      if (!selectedBatch || !selectedDate) return [];
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/attendance?batchId=${selectedBatch}&date=${formattedDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance for the selected date');
      }
      return response.json();
    },
    enabled: !!selectedBatch && !!selectedDate,
  });

  // 2. This useEffect now correctly derives state from the query's result
  React.useEffect(() => {
    if (!dailyAttendance) {
      setMarkedStatus({});
      return;
    }
    const statusMap: Record<string, { status: string; disabled: boolean }> = {};
    dailyAttendance.forEach((record) => {
      // The key should be the student's main ID (number), converted to a string
      statusMap[record.studentId.toString()] = {
        status: record.status,
        // Disable editing if status is already present/absent. Adjust this if needed.
        disabled: record.status === 'present' || record.status === 'absent' || !!record.compensationDate,
      };
    });
    setMarkedStatus(statusMap);
  }, [dailyAttendance]);


  const [savedAttendance, setSavedAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('savedAttendance');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (savedAttendance.length > 0) {
      localStorage.setItem('savedAttendance', JSON.stringify(savedAttendance));
    }
  }, [savedAttendance]);


  const [attendanceByBatch, setAttendanceByBatch] = useState<Record<string, AttendanceRecord[]>>({});

  const { data: batches = [], isLoading: isLoadingBatches } = useQuery<Batch[]>({
    queryKey: ["/api/batches"],
  });

  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments/active", { batchId: selectedBatch }],
    enabled: !!selectedBatch,
  });

  const { data: studentEnrollments = [], isLoading: isLoadingStudentEnrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: brands = [], isLoading: isLoadingBrands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: allBatchesStudents = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  const enrolledStudents = useMemo(() => {
    if (!selectedBatch || !enrollments.length || !allBatchesStudents.length) return [];

    const batchEnrollments = enrollments.filter(e => e.batchId.toString() === selectedBatch);
    return allBatchesStudents.filter(student =>
      batchEnrollments.some(e => e.studentId === student.id)
    );
  }, [selectedBatch, enrollments, allBatchesStudents]);

  const [allStudents, setAllStudents] = useState<Record<string, Student[]>>({});

  useEffect(() => {
    if (!enrollments.length || !allBatchesStudents.length) return;

    const studentsByBatch = enrollments.reduce((acc, enrollment) => {
      const student = allBatchesStudents.find(s => s.id === enrollment.studentId);
      if (student && enrollment.batchId) {
        const batchId = enrollment.batchId.toString();
        if (!acc[batchId]) {
          acc[batchId] = [];
        }
        if (!acc[batchId].some(s => s.id === student.id)) {
          acc[batchId].push(student);
        }
      }
      return acc;
    }, {} as Record<string, Student[]>);

    setAllStudents(prev => {
      const hasChanges = Object.keys(studentsByBatch).some(batchId => {
        const prevStudents = prev[batchId] || [];
        const newStudents = studentsByBatch[batchId] || [];
        return prevStudents.length !== newStudents.length ||
          prevStudents.some((s, i) => s.id !== newStudents[i]?.id);
      });

      return hasChanges ? studentsByBatch : prev;
    });
  }, [allBatchesStudents, enrollments]);

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

      const attendanceRecords = enrolledStudents.map((student) => {
        const status = attendance[student.studentId] ?? "not-marked";
        return {
          studentId: student.id,
          batchId: parseInt(selectedBatch),
          date: selectedDate,
          status
        };
      });

      if (attendanceRecords.length === 0) {
        throw new Error("No attendance records to save");
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceRecords),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save attendance');
      }
      queryClient.invalidateQueries({ queryKey: ['allAttendanceForSummary'] });

      // After saving, refetch the daily attendance to get the final server state
      await refetchDailyAttendance();
      setAttendance({});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance saved successfully",
        description: `Attendance for ${format(selectedDate!, "MMMM do, yyyy")} has been saved.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save attendance",
        description: error.message,
        variant: "destructive",
      });
    }
  });


  React.useEffect(() => {
    if (!selectedDate || !selectedBatch || enrolledStudents.length === 0) {
      setStudentsWithInvoice([]);
      return;
    }

    const fetchStudentsWithInvoice = async () => {
      const studentIds = enrolledStudents.map(s => s.id);
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();

      try {
        const res = await fetch("/api/invoices/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds, month, year }),
        });
        if (res.ok) {
          const data = await res.json();
          setStudentsWithInvoice(data);
        } else {
          setStudentsWithInvoice([]);
        }
      } catch {
        setStudentsWithInvoice([]);
      }
    };

    fetchStudentsWithInvoice();
  }, [selectedDate, selectedBatch, enrolledStudents]);

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

  const markClassCancelled = () => {
    const allCancelled = enrolledStudents.reduce((acc, student) => ({
      ...acc,
      [student.studentId]: "cancelled"
    }), {});
    setAttendance(allCancelled);

    // Use a slight delay to ensure state is set before mutation runs
    setTimeout(() => {
        saveAttendanceMutation.mutate();
    }, 100);

    toast({
      title: "Class Marked as Cancelled",
      description: `Class for ${format(selectedDate!, "MMMM do, yyyy")} has been marked as cancelled.`,
    });
  };

  const markHoliday = () => {
    const allHoliday = enrolledStudents.reduce((acc, student) => ({
      ...acc,
      [student.studentId]: "holiday"
    }), {});
    setAttendance(allHoliday);

    setTimeout(() => {
        saveAttendanceMutation.mutate();
    }, 100);

    toast({
      title: "Holiday Marked",
      description: `Holiday has been marked for this batch on ${format(selectedDate!, "MMMM do, yyyy")}.`,
    });
  };


  const getBatchName = (batchId: string) => {
    const batch = batches.find((b: Batch) => b.id.toString() === batchId);
    return batch ? batch.name : "Unknown Batch";
  };

  const getCourseName = (courseId: number) => {
    const course = courses.find((c: Course) => c.id === courseId);
    return course ? course.name : "Unknown Course";
  };

  const getCategoryName = (categoryId: number) => {
    const category = departments.find((d: Department) => d.id === categoryId);
    return category ? category.name : "Unknown Category";
  };


  const getSchedule = (batchId: number) => {
    const schedule = schedules.filter((s: Schedule) => s.batchId === batchId);
    return schedule.map((s: Schedule) => ({
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
    }));
  };

  const branches = useMemo(() => {
    const branchSet = new Set<string>();
    batches.forEach((batch: Batch) => {
      if (batch.branch) {
        branchSet.add(batch.branch);
      }
    });
    return Array.from(branchSet);
  }, [batches]);

  const filteredBatches = useMemo(() => {
    return batches.filter((batch: Batch) => {
      const schedules = getSchedule(batch.id);
      const matchesSchedule = !selectedSchedule || schedules.some((s) => s.day === selectedSchedule);
      const matchesBranch = !selectedBranch || selectedBranch === "all" || batch.branch === selectedBranch;
      const matchesTeacher = !selectedTeacher || selectedTeacher === "all" || batch.teacherId.toString() === selectedTeacher;
      const matchesDepartment = !selectedDepartment || selectedDepartment === "all" || batch.category.toString() === selectedDepartment;
      const matchesCourse = !selectedCourse || selectedCourse === "all" || batch.courseId.toString() === selectedCourse;
      const course = courses.find((c) => c.id === batch.courseId);
      const derivedBrandId = course?.brandId?.toString() || null;
      const matchesBrand = !selectedBrand || selectedBrand === "all" || derivedBrandId === selectedBrand;
      const matchesStudent = !selectedStudent || selectedStudent === "all" || studentEnrollments.some(
        (e) => e.batchId === batch.id && e.studentId.toString() === selectedStudent
      );
      return matchesBranch && matchesTeacher && matchesDepartment && matchesCourse && matchesBrand && matchesSchedule && matchesStudent;
    });
  }, [batches, courses, selectedBrand, selectedBranch, selectedCourse, selectedDepartment, selectedTeacher, selectedSchedule, selectedStudent, studentEnrollments]);


  const filteredStudents = useMemo(() => {
    if (!selectedBranch && !selectedCourse && !selectedBatch) {
      return allBatchesStudents;
    }

    const validBatchIds = batches
      .filter((batch: Batch) => {
        const matchesBranch = !selectedBranch || selectedBranch === "all" || batch.branch === selectedBranch;
        const matchesCourse = !selectedCourse || selectedCourse === "all" || batch.courseId.toString() === selectedCourse;
        const matchesBatch = !selectedBatch || selectedBatch === "all" || batch.id.toString() === selectedBatch;
        return matchesBranch && matchesCourse && matchesBatch;
      })
      .map((batch) => batch.id);

    const enrolledStudentIds = (enrollments as Enrollment[])
      .filter((enroll) => validBatchIds.includes(enroll.batchId))
      .map((enroll) => enroll.studentId);
    return allBatchesStudents.filter((student: Student) =>
      enrolledStudentIds.includes(student.id)
    );
  }, [allBatchesStudents, batches, enrollments, selectedBranch, selectedCourse, selectedBatch]);


  const batchesToDisplay = useMemo(() => {
    if (selectedBranch === "all") {
      return batches;
    }
    return filteredBatches;
  }, [batches, selectedBranch, filteredBatches]);


  const brandOptions = [
    { label: "All Brands", value: "all" },
    ...brands.map((brand) => ({ label: brand.name, value: brand.id.toString() })),
  ];

  const branchOptions = [
    { label: "All Branches", value: "all" },
    ...branches.map((branch) => ({ label: branch, value: branch })),
  ];

  const courseOptions = [
    { label: "All Courses", value: "all" },
    ...courses.map((course: any) => ({ label: course.name, value: course.id.toString() })),
  ];

  const departmentOptions = [
    { label: "All Departments", value: "all" },
    ...departments.map((department) => ({ label: department.name, value: department.id.toString() })),
  ];

  const teacherOptions = [
    { label: "All Teachers", value: "all" },
    ...teachers.map((teacher) => ({
      label: teacher.firstName + " " + teacher.middleName + " " + teacher.lastName,
      value: teacher.id.toString(),
    })),
  ];

  const batchOptions = filteredBatches.map((batch: any) => ({
    label: `${batch.name} - ${getCategoryName(Number(batch.category))} - ${batch.branch}`,
    value: batch.id.toString(),
  }));
  const batchOptions2 = filteredBatches.map((batch: any) => ({
    label: `${batch.name} - ${getCategoryName(Number(batch.category))} - ${batch.branch}`,
    value: batch.name.toString(),
  }));

  const handleInvoice = async (studentId: number) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, mode: "current" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invoice generation failed');
      }

      const invoice = await response.json();
      setStudentsWithInvoice((prev) => Array.from(new Set([...prev, studentId])));
      toast({
        title: "Success!",
        description: `Invoice ${invoice.invoiceNumber} has been created.`,
      });
    } catch (err: any) {
      console.error("Invoice generation error:", err);
      toast({
        title: "Invoice Generation Failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // --- FIXED COMPENSATION SUBMISSION ---
  // 3. Updated function to use `refetchDailyAttendance` and correct logic
  const handleSubmitCompensation = async () => {
    if (!compensationDate || !compensationBatchName || !selectedLeaveRecord) return;

    // Find the specific attendance record to get its ID
    const attendanceRecord = dailyAttendance.find(att => att.studentId === selectedLeaveRecord.id);
    if (!attendanceRecord) {
        toast({ title: "Error", description: "Could not find the original leave record.", variant: "destructive" });
        return;
    }

    try {
      const response = await fetch('/api/attendance/compensate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId: attendanceRecord.id, // Use the correct ID of the attendance record
          compensationDate: format(compensationDate, 'yyyy-MM-dd'),
          compensationBatchName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save compensation');
      }

      queryClient.invalidateQueries({ queryKey: ['allCompensationData'] });

      // On success, refetch the data to update the UI
      await refetchDailyAttendance();

      // Close dialog and reset form
      setDialogOpen(false);
      setSelectedLeaveRecord(null);
      setCompensationDate(undefined);
      setCompensationBatchName("");

      toast({
        title: "Success!",
        description: "Class compensated successfully!",
      });
    } catch (error: any) {
      console.error('Error submitting compensation:', error);
      toast({
        title: "Compensation Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };


  return (
    <AppShell>
      <PageHeader
        title="Attendance Management"
        description="Track and manage student attendance for all batches."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="mt-6">
          <div>
            <Card className="md:col-span-1">
              <CardContent className="grid grid-cols-5 gap-6 pt-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Date:</label>
                  <input
                    type="date"
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="rounded-md border p-2 w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Brand:</label>
                  <ReactSelect
                    value={brandOptions.find((option) => option.value === selectedBrand) || null}
                    onChange={(selectedOption) => setSelectedBrand(selectedOption?.value || "")}
                    options={brandOptions} isClearable placeholder="Select Brand" className="w-full text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Branch:</label>
                  <ReactSelect
                    value={branchOptions.find((option) => option.value === selectedBranch) || null}
                    onChange={(selectedOption) => setSelectedBranch(selectedOption?.value || "")}
                    options={branchOptions} isClearable placeholder="Select Branch" className="w-full text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Department:</label>
                  <ReactSelect
                    value={departmentOptions.find((option) => option.value === selectedDepartment) || null}
                    onChange={(selectedOption) => setSelectedDepartment(selectedOption?.value || "")}
                    options={departmentOptions} isClearable placeholder="Select Department" className="w-full text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Course:</label>
                  <ReactSelect
                    value={courseOptions.find(option => option.value === selectedCourse) || null}
                    onChange={(selectedOption) => {
                      setSelectedCourse(selectedOption?.value || "");
                      setSelectedBatch("");
                    }}
                    options={courseOptions} isClearable placeholder="Select Course" className="w-full text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Student:</label>
                  <ReactSelect
                    value={
                      selectedStudent === "all"
                        ? { value: "all", label: "All Students" }
                        : filteredStudents
                          .map((student) => ({
                            value: student.id.toString(),
                            label: `${student.studentId} - ${student.firstName} ${student.middleName} ${student.lastName}`,
                          }))
                          .find((option) => option.value === selectedStudent) || null
                    }
                    onChange={(selectedOption) => setSelectedStudent(selectedOption?.value || "")}
                    options={[
                      { value: "all", label: "All Students" },
                      ...filteredStudents.map((student) => ({
                        value: student.id.toString(),
                        label: `${student.studentId} - ${student.firstName} ${student.middleName} ${student.lastName}`,
                      })),
                    ]}
                    isClearable isSearchable placeholder="Select a student" className="w-full text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Teacher:</label>
                  <ReactSelect
                    value={teacherOptions.find(option => option.value === selectedTeacher) || null}
                    onChange={(selectedOption) => {
                      setSelectedTeacher(selectedOption?.value || "");
                      setSelectedBatch("");
                    }}
                    options={teacherOptions} isClearable placeholder="Select Teacher" className="w-full text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Day:</label>
                  <ReactSelect
                    value={selectedSchedule ? { label: selectedSchedule, value: selectedSchedule } : null}
                    onChange={(selectedOption) => {
                      setSelectedSchedule(selectedOption?.value || "");
                      setSelectedBatch("");
                    }}
                    options={[
                      { label: "All Days", value: "" },
                      ...[...new Set(batches.flatMap((b) => getSchedule(b.id).map((s) => s.day)))].map((day) => ({
                        label: day,
                        value: day,
                      })),
                    ]}
                    isClearable placeholder="Select Day" className="w-full text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Batch:</label>
                  <ReactSelect
                    value={batchOptions.find((option) => option.value === selectedBatch) || null}
                    onChange={(option) => setSelectedBatch(option?.value || "")}
                    options={batchOptions} isClearable isSearchable placeholder="Select a batch" className="w-full text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 mt-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>
                  {selectedBatch
                    ? `Mark Attendance for ${getBatchName(selectedBatch)}`
                    : "Select a batch to mark attendance"}
                </CardTitle>
                {selectedBatch && (
                  <div className="flex gap-2">
                    <Button onClick={markClassCancelled} size="sm" variant="destructive" className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Class Cancelled
                    </Button>
                    <Button onClick={markHoliday} variant="outline" size="sm" className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4" /> Mark Holiday
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {selectedBatch ? (
                  <>
                    {isLoadingEnrollments ? (
                      <div>Loading students...</div>
                    ) : enrolledStudents.length === 0 ? (
                      <div>No students enrolled in this batch.</div>
                    ) : (
                      <div>
                        {enrolledStudents.map((student) => {
                          const attendanceMark = markedStatus[student.id.toString()];
                          const hasInvoice = studentsWithInvoice.includes(student.id);
                          const isDisabled = !hasInvoice || (attendanceMark?.disabled ?? false);
                          const currentStatus = attendance[student.studentId] || attendanceMark?.status || "not-marked";
                          const studentDailyRecord = dailyAttendance.find(r => r.studentId === student.id);

                          return (
                            <div key={student.id} className="flex items-center space-x-4 p-4 border-b">
                              <div className="flex-1">
                                <h3 className="font-medium">{student.firstName} {student.lastName}</h3>
                                <p className="text-sm text-gray-500">{student.studentId}</p>
                                {!hasInvoice && (
                                  <span className="flex items-center gap-2">
                                    <p className="text-xs text-red-600 mt-1">No invoice for this month</p>
                                    <Button variant="outline" size="sm" className="ml-2 bg-primary text-white text-xs" onClick={() => handleInvoice(student.id)}>
                                      Generate
                                    </Button>
                                  </span>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant={currentStatus === "present" ? "default" : "outline"}
                                  size="sm" className={cn("w-24", currentStatus === "present" && "bg-green-500 hover:bg-green-600")}
                                  onClick={() => handleAttendanceChange(student.studentId, "present")} disabled={isDisabled}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" /> Present
                                </Button>
                                <Button
                                  variant={currentStatus === "absent" ? "default" : "outline"}
                                  size="sm" className={cn("w-24", currentStatus === "absent" && "bg-red-500 hover:bg-red-600")}
                                  onClick={() => handleAttendanceChange(student.studentId, "absent")} disabled={isDisabled}
                                >
                                  <XCircle className="h-4 w-4 mr-1" /> Absent
                                </Button>
                                <Button
                                  variant={currentStatus === "leave" ? "default" : "outline"}
                                  size="sm" className={cn("w-24", currentStatus === "leave" && "bg-yellow-500 hover:bg-yellow-600")}
                                  onClick={() => handleAttendanceChange(student.studentId, "leave")} disabled={isDisabled}
                                >
                                  <CalendarX className="h-4 w-4 mr-1" /> Leave
                                </Button>
                                <Button
                                  variant={currentStatus === "not-marked" ? "default" : "outline"}
                                  size="sm"
                                  className={cn(
                                    "w-21",
                                    currentStatus === "not-marked" && "bg-gray-500 hover:bg-gray-600"
                                  )}
                                  onClick={() => handleAttendanceChange(student.studentId, "not-marked")}
                                  disabled={isDisabled}
                                >
                                  <CircleSlash2 className="h-4 w-4 mr-1" />
                                  Not Marked
                                </Button>
                                {currentStatus === 'leave' && !studentDailyRecord?.compensationDate && (
                                  <Dialog open={dialogOpen && selectedLeaveRecord?.id === student.id} onOpenChange={(open) => { if (!open) setSelectedLeaveRecord(null); setDialogOpen(open); }}>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="flex items-center gap-2 bg-primary text-white w-32" onClick={() => { setSelectedLeaveRecord(student); setDialogOpen(true); }} disabled={isDisabled}>
                                        <Clock className="h-4 w-4" /> Compensation
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Compensation Class</DialogTitle>
                                        <DialogDescription>Class compensated on:</DialogDescription>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                          <Label>Compensation Date</Label>
                                          <Input type="date" value={compensationDate ? format(compensationDate, 'yyyy-MM-dd') : ''} onChange={(e) => setCompensationDate(new Date(e.target.value))} />
                                        </div>
                                        <div className="grid gap-2">
                                          <Label>Batch</Label>
                                          <ReactSelect
                                              // value={batchOptions2.find((option) => option.value === selectedBatch) || null}
                                              onChange={(e) => setCompensationBatchName(e?.value || "") }
                                              options={batchOptions2} isClearable isSearchable placeholder="Select a batch" className="w-full text-sm"
                                              />
                                          {/* <Input value={compensationBatchName} onChange={(e) => setCompensationBatchName(e.target.value)} placeholder="Enter batch name" /> */}
                                        </div>
                                        <Button onClick={handleSubmitCompensation} disabled={!compensationDate || !compensationBatchName}>
                                          Submit
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                {studentDailyRecord?.compensationDate && (
                                    <Button variant="outline" size="sm" className="flex items-center gap-2 bg-gray-500 text-white w-32" disabled>
                                        <Clock className="h-4 w-4" /> Compensated
                                    </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                    (selectedBrand || selectedBranch || selectedDepartment || selectedCourse || selectedTeacher || selectedStudent || selectedSchedule) && (
                        <div className="space-y-4">
                            <div className="text-sm text-neutral-500">Available Batches:</div>
                            <div className="grid grid-cols-3 gap-4">
                                {filteredBatches.map((batch: Batch) => (
                                    <div key={batch.id} className={cn("flex flex-col justify-between p-3 rounded-lg border", "hover:bg-neutral-50 cursor-pointer")} onClick={() => setSelectedBatch(batch.id.toString())}>
                                        <div>
                                            <div className="font-medium">{batch.name}</div>
                                            <div className="text-xs text-neutral-500 mt-1">{batch.branch} - Studio {batch.roomNumber}</div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs text-neutral-700 mt-2">
                                            {getSchedule(Number(batch.id)).map((s, index) => (
                                                <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full shadow-sm border border-blue-300">
                                                    <strong>{s.day}</strong> {formatTimeTo12Hour(s.startTime)} - {formatTimeTo12Hour(s.endTime)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}

                {selectedBatch && enrolledStudents.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Button onClick={handleSaveAttendance} disabled={saveAttendanceMutation.isPending || Object.keys(attendance).length === 0}>
                      {saveAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
                      <MoveRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}