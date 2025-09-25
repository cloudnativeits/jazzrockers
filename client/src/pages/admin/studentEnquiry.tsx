import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import ReactSelect from "react-select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    UserPlus
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Student, InsertStudent, User, Branch } from "@shared/schema";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StudentFormData extends Omit<InsertStudent, 'age' | 'branch' | 'course' | 'parentId'> {
    age?: string;
    course?: string | undefined;
    branch?: string | undefined;
    parentId?: number;
    isReRegistering?: string;
    registrationFee?: string;
    registrationDate?: string;
}

export default function StudentEnquiry() {
    // Check URL for dialog trigger
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('openDialog') === 'create') {
            setIsCreateDialogOpen(true);
            // Remove the query parameter
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [activeTab, setActiveTab] = useState("all");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Form state for creating a new student
    const [formData, setFormData] = useState<StudentFormData>({
        studentId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",
        age: "",
        gender: "",
        email: "",
        phone: "",
        whatsappNo: "",
        street: "",
        community: "",
        residenceAddress: "",
        flatNo: "",
        status: "not_joined",
        parentId: 0,
        isReRegistering: "yes",
        registrationFee: "0",
        registrationDate: new Date().toISOString().split('T')[0],
        course: "",
        branch: "",
    });

    // Fetch students with detailed information
    const { data: students = [], isLoading } = useQuery<Student[]>({
        queryKey: ["/api/students/not-joined"],
        queryFn: async () => {
            const res = await fetch("/api/students/not-joined");
            if (!res.ok) throw new Error("Failed to fetch students");
            return res.json();
        },
    });

    // Fetch users for parent selection
    const { data: users = [] } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    // Fetch courses, batches and branches
    const { data: courses = [] } = useQuery<any[]>({
        queryKey: ["/api/courses"],
    });

    const { data: branches = [] } = useQuery<Branch[]>({
        queryKey: ["/api/branches"],
    });

    // Filter only parent users for dropdown
    const parents = users.filter((user: any) => user.role === "parent");

    // Generate student ID
    const generateStudentId = () => {
        const prefix = "ST";

        // Get existing student IDs that start with the prefix
        const existingIds = students
            ?.filter(student => student.studentId?.startsWith(prefix))
            .map(student => {
                const numericPart = student.studentId?.split("-")[1];
                return numericPart ? parseInt(numericPart) : 0;
            })
            .filter(num => !isNaN(num));

        // Default to 1 if no existing IDs
        let nextNumber = 1;

        if (existingIds && existingIds.length > 0) {
            const highestNumber = Math.max(...existingIds);
            nextNumber = highestNumber + 1;
        }

        // Pad number with leading zeros (e.g., 01, 02, ..., 10, 11, ...)
        const paddedNumber = String(nextNumber).padStart(2, "0");

        return `${prefix}-${paddedNumber}`;
    };

    useEffect(() => {
        if (isCreateDialogOpen) {
            const newId = generateStudentId();
            setFormData(prev => ({ ...prev, studentId: newId }));
        }
    }, [isCreateDialogOpen]);

    // // Handle branch selection
    // const handleBranchChange = (value: number) => {
    //     // Generate new student ID based on selected branch
    //     const newStudentId = generateStudentId();

    //     setFormData(prev => ({
    //         ...prev,
    //         branch: value,
    //         studentId: newStudentId
    //     }));
    // };

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth: string) => {
        if (!dateOfBirth) return "";
        const dob = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        return age.toString();
    };

    // Handle date of birth change
    const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dob = e.target.value;
        setFormData(prev => ({
            ...prev,
            dateOfBirth: dob,
            age: calculateAge(dob)
        }));
    };

    // Handle form field changes
    const handleFieldChange = (field: string, value: string) => {
        setFormData(prev => {
            const updates: Partial<StudentFormData> = { [field]: value };

            // Calculate age when date of birth changes
            if (field === 'dateOfBirth' && value) {
                updates.age = calculateAge(value).toString();
            }

            return { ...prev, ...updates };
        });
    };

    // Handle course change
    const handleCourseChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            course: value,
        }));
    };

    // Create student mutation
    const createStudentMutation = useMutation({
        mutationFn: async (data: StudentFormData) => {
            // Create student record
            const studentData: InsertStudent = {
                ...data,
                // userId: userData.id,
                age: parseInt(data.age || "0"),
                dateOfBirth: data.dateOfBirth || "",
                registrationFee: data.registrationFee || "0.00",
                registrationDate: data.registrationDate || new Date().toISOString().split('T')[0],
                parentId: data.parentId ?? 0,
                status: "not_joined",
                course: data.course,
                branch: data.branch,
            };

            const studentResponse = await apiRequest("POST", "/api/students", studentData);
            const student = await studentResponse.json();

            return student;
        },
        onSuccess: async (student) => {
            queryClient.invalidateQueries({ queryKey: ["/api/students/not-joined"] });
            setIsCreateDialogOpen(false);

            // Show success toast
            toast({
                title: "Success",
                description: "Student created successfully",
            });

            // Reset form data
            setFormData({
                studentId: "",
                firstName: "",
                middleName: "",
                lastName: "",
                dateOfBirth: "",
                age: "",
                gender: "",
                email: "",
                phone: "",
                whatsappNo: "",
                parentId: 0,
                street: "",
                community: "",
                residenceAddress: "",
                flatNo: "",
                registrationFee: "",
                registrationDate: new Date().toISOString().split('T')[0],
                course: undefined,
                branch: undefined,
            });
            toast({
                title: "Success",
                description: "Student created successfully",
            });
            queryClient.invalidateQueries({ queryKey: ['allEnquiriesData'] });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to create student",
                variant: "destructive",
            });
        },
    });

    // Update student mutation
    const updateStudentMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: Partial<Student> }) => {
            const res = await apiRequest("PUT", `/api/students/${id}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/students"] });
            setIsEditDialogOpen(false);
            toast({
                title: "Success",
                description: "Student updated successfully",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: `Failed to update student: ${error.message}`,
                variant: "destructive",
            });
        }
    });

    // Open student details dialog
    const handleViewStudent = (student: Student) => {
        const courseIds = student.course ? student.course.toString().split(',') : [];
        const courseNames = courseIds
            .map(id => courses.find(c => c.id === Number(id))?.name)
            .filter(name => name)
            .join(", ");

        const branchIds = student.branch ? student.branch.toString().split(',') : [];
        const branchNames = branchIds
            .map(id => branches.find(b => b.id === Number(id))?.name)
            .filter(name => name)
            .join(", ");

        const registrationFee = student.registrationFee;

        // Set the selected student with updated information
        setSelectedStudent({
            ...student,
            registrationFee: registrationFee,
            courseNames: courseNames,
            branchNames: branchNames,
        });

        setIsViewDialogOpen(true);
    };

    // Handle edit student
    const handleEditStudent = (student: Student) => {
        setSelectedStudent(student);
        setFormData({
            studentId: student.studentId,
            firstName: student.firstName,
            middleName: student.middleName || "",
            lastName: student.lastName,
            dateOfBirth: student.dateOfBirth || "",
            age: student.age?.toString() || "",
            gender: student.gender || "",
            email: student.email || "",
            phone: student.phone || "",
            whatsappNo: student.whatsappNo || "",
            street: student.street || "",
            community: student.community || "",
            residenceAddress: student.residenceAddress || "",
            flatNo: student.flatNo || "",
            status: student.status,
            parentId: student.parentId,
            registrationFee: student.registrationFee || "",
            registrationDate: student.registrationDate || "",
            course: student.course?.toString() || "",
            branch: student.branch?.toString() || "",
        });
        setIsEditDialogOpen(true);
    };

    // Handle create student submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.firstName || !formData.lastName) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        if (!formData.dateOfBirth) {
            toast({
              title: "Error",
              description: "Please choose date of birth",
              variant: "destructive",
            });
            return;
          }
      
          if (!formData.phone) {
            toast({
              title: "Error",
              description: "Please enter phone number",
              variant: "destructive",
            });
            return;
          }
      
          if (!formData.branch) {
            toast({
              title: "Error",
              description: "Please select at least one branch",
              variant: "destructive",
            });
            return;
          }
          if (!formData.course) {
            toast({
              title: "Error",
              description: "Please select at least one course",
              variant: "destructive",
            });
            return;
          }

        try {
            await createStudentMutation.mutateAsync(formData);
        } catch (error) {
            console.error("Failed to create student:", error);
        }
    };

    // Handle edit student submit
    const handleEditStudentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudent) {
            updateStudentMutation.mutate({
                id: selectedStudent.id,
                data: {
                    ...formData,
                    age: Number(formData.age || 0),
                }
            });
        }
    };

    // Handle print invoice
    const [, setLocation] = useLocation();
    const handlePrintInvoice = (invoiceId: string) => {
        setLocation(`/admin/print-invoice/${invoiceId}`);
    };

    // Filter students based on active tab
    const filteredStudents = students.filter((student: Student) => {
        if (activeTab === "all") return true;
        return student.status === activeTab;
    });

    // Student table columns
    const columns: ColumnDef<Student>[] = [
        {
            id: "serial",
            header: "SL.No.",
            cell: ({ table, row }) => {
                const sortedRows = table.getSortedRowModel().rows;
                const index = sortedRows.findIndex(r => r.id === row.id);
                return <div>{index + 1}</div>;
            },
            enableSorting: false,
        },
        {
            accessorKey: "studentId",
            header: ({ column }) => {
                return (
                    <div
                        className="cursor-pointer select-none flex items-center gap-1"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Student ID
                        {column.getIsSorted() === "asc" ? " ↑" : column.getIsSorted() === "desc" ? " ↓" : ""}
                    </div>
                );
            },
            sortingFn: (rowA, rowB) => {
                const a = rowA.original.studentId || '';
                const b = rowB.original.studentId || '';
                return b.localeCompare(a); // Descending order
            }
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => {
                const student = row.original;
                return `${student.firstName} ${student.middleName} ${student.lastName}`;
            },
        },
        {
            accessorKey: "dateOfBirth",
            header: "Date of Birth",
            cell: ({ row }) => {
                const dateOfBirth = row.original.dateOfBirth;
                if (!dateOfBirth) return "-";
                const date = new Date(dateOfBirth);
                return format(date, "MMM dd, yyyy");
            },
        },
        {
            accessorKey: "gender",
            header: "Gender",
            cell: ({ row }) => {
                const gender = row.original.gender;
                return gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "-";
            },
        },
        {
            accessorKey: "branches",
            header: "Branches",
            cell: ({ row }) => {
                const student = row.original;
                const branchIds = student.branch ? student.branch.toString().split(',') : [];
                if (branchIds.length === 0) return "-";

                const branchNames = branchIds
                    .map(id => branches.find(b => b.id === Number(id))?.name)
                    .filter(name => name)
                    .join(", ");

                return branchNames || "-";
            },
        },
        {
            accessorKey: "course",
            header: "Courses",
            cell: ({ row }) => {
                const student = row.original;
                const courseIds = student.course ? student.course.toString().split(',') : [];
                if (courseIds.length === 0) return "-";

                const courseNames = courseIds
                    .map(id => courses.find(c => c.id === Number(id))?.name)
                    .filter(name => name)
                    .join(", ");

                return courseNames || "-";
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                let badgeVariant: "default" | "outline" | "secondary" = "outline";

                if (status === "active") {
                    badgeVariant = "default";
                } else if (status === "inactive") {
                    badgeVariant = "secondary";
                } else if (status === "alumni") {
                    badgeVariant = "outline";
                }

                return (
                    status && (
                        <Badge variant={badgeVariant}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                    )
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const student = row.original;

                return (
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost"
                            className="bg-gray-500 hover:bg-gray-600 text-white"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                            title="View Details"
                        >
                            View
                        </Button>
                        <Button
                            variant="ghost"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                        >
                            Edit
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <AppShell>
            <PageHeader
                title="Student Enquiry"
                // description="New Student Enquiry"
                actions={
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        New
                    </Button>
                }
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList>
                    <TabsTrigger value="all">All Students</TabsTrigger>
                    {/* <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="inactive">Discontinued</TabsTrigger>
                    <TabsTrigger value="alumni">Outbreak</TabsTrigger> */}
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <DataTable
                        columns={columns}
                        data={filteredStudents}
                        searchColumns={["firstName","middleName","lastName", "studentId"]}
                        searchPlaceholder="Search by name..."
                        initialSorting={[
                            {
                                id: "studentId",
                                desc: true
                            }
                        ]}
                    />
                </TabsContent>
            </Tabs>

            {/* Student View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Student Details</DialogTitle>
                        <DialogDescription>
                            Comprehensive information about the student.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedStudent && (
                        <div className="space-y-6">
                            {/* Header with Student Name and Status */}
                            <div className="flex justify-between items-start border-b pb-4">
                                <div>
                                    <h3 className="text-xl font-semibold">
                                        {selectedStudent.firstName} {selectedStudent.middleName} {selectedStudent.lastName}
                                    </h3>
                                    <p className="text-sm text-neutral-500 font-bold">Student ID: {selectedStudent.studentId}</p>
                                </div>
                                <Badge variant={selectedStudent.status === "active" ? "default" : (selectedStudent.status === "inactive" ? "secondary" : "outline")}>
                                    {selectedStudent?.status?.charAt(0).toUpperCase() + selectedStudent?.status?.slice(1)}
                                </Badge>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Personal Information */}
                                <Card>
                                    <CardContent className="p-4">
                                        <h4 className="text-sm font-semibold mb-3">Personal Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Date of Birth</span>
                                                <span className="text-sm">
                                                    {selectedStudent.dateOfBirth
                                                        ? format(new Date(selectedStudent.dateOfBirth), "MMM dd, yyyy")
                                                        : "-"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Age</span>
                                                <span className="text-sm">{selectedStudent.age || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Gender</span>
                                                <span className="text-sm">{selectedStudent.gender ? selectedStudent.gender.charAt(0).toUpperCase() + selectedStudent.gender.slice(1) : "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Email</span>
                                                <span className="text-sm">{selectedStudent.email || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Phone</span>
                                                <span className="text-sm">{selectedStudent.phone || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">WhatsApp</span>
                                                <span className="text-sm">{selectedStudent.whatsappNo || "-"}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Address Information */}
                                <Card>
                                    <CardContent className="p-4">
                                        <h4 className="text-sm font-semibold mb-3">Address Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Residence</span>
                                                <span className="text-sm">{selectedStudent.residenceAddress || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Street</span>
                                                <span className="text-sm">{selectedStudent.street || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Community</span>
                                                <span className="text-sm">{selectedStudent.community || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Flat No</span>
                                                <span className="text-sm">{selectedStudent.flatNo || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Course</span>
                                                <span className="text-sm">{selectedStudent.courseNames || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-neutral-500">Branch</span>
                                                <span className="text-sm">{selectedStudent.branchNames || "-"}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Student Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[1400px] max-h-[90vh] flex flex-col gap-4">
                    {/* <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none flex flex-col gap-4"> */}
                    <DialogHeader className="flex flex-row items-center justify-between gap-4">
                        <div>
                            <DialogTitle>Create New Student</DialogTitle>
                            <DialogDescription>
                                Fill in the student details below
                            </DialogDescription>
                        </div>
                        <div className="flex items-center w-1/3">
                            <Label htmlFor="studentId" className="whitespace-nowrap font-semibold text-lg">Student ID :</Label>
                            <div
                                id="studentId"
                                className="flex-1 px-3 py-2 text-gray-700 font-bold"
                            >
                                {formData.studentId}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            {/* <div className="space-y-4"> */}
                            <div className="grid grid-cols-5 gap-4 pb-4 pl-2">
                                <div className="space-y-4 pt-4">
                                    <Label htmlFor="isReRegistering">New registration?</Label>
                                    <select
                                        id="isReRegistering"
                                        name="isReRegistering"
                                        value={formData.isReRegistering}
                                        onChange={(e) =>
                                            handleFieldChange('isReRegistering', e.target.value)
                                        }
                                        className="bg-gray-100 p-2 rounded"
                                    >
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="registrationDate">Registration Date</Label>
                                    <Input
                                        type="date"
                                        id="registrationDate"
                                        name="registrationDate"
                                        value={formData.registrationDate}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            registrationDate: e.target.value,
                                        })}
                                        required
                                        // readOnly
                                        // disabled
                                        className="bg-gray-100"
                                    />
                                </div>

                                {/* Show Registration Fee input only if NOT re-registering */}
                                {formData.isReRegistering === "yes" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="registrationFee">Registration Fee</Label>
                                        <Input
                                            type="number"
                                            id="registrationFee"
                                            name="registrationFee"
                                            value={formData.registrationFee}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    registrationFee: e.target.value,
                                                })
                                            }
                                            required
                                            className="bg-gray-100"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-5 gap-4 pb-4 pl-2 pr-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        // placeholder="Enter first name"
                                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="middleName">Middle Name</Label>
                                    <Input
                                        id="middleName"
                                        name="middleName"
                                        value={formData.middleName ?? ""}
                                        onChange={(e) => handleFieldChange('middleName', e.target.value)}
                                    // placeholder="Enter middle name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName ?? ""}
                                        // placeholder="Enter last name"
                                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        type="date"
                                        value={formData.dateOfBirth ?? ""}
                                        onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input
                                        id="age"
                                        name="age"
                                        type="text"
                                        value={formData.age}
                                        readOnly
                                        className="bg-gray-50"
                                    // placeholder="Age will be calculated automatically"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        name="gender"
                                        value={formData.gender ?? ""}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, gender: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email ?? ""}
                                        onChange={(e) => handleFieldChange('email', e.target.value)}
                                    // placeholder="Enter email address"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={formData.phone ?? ""}
                                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                                        required
                                    // placeholder="Enter phone number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="whatsappNo">WhatsApp Number</Label>
                                    <Input
                                        id="whatsappNo"
                                        name="whatsappNo"
                                        value={formData.whatsappNo ?? ""}
                                        onChange={(e) => handleFieldChange('whatsappNo', e.target.value)}
                                    // placeholder="Enter WhatsApp number"
                                    />
                                </div>

                                {/* <div className="space-y-2">
                                    <Label htmlFor="parentId">Parent</Label>
                                    <Select
                                        name="parentId"
                                        value={(formData.parentId ?? "").toString()}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, parentId: parseInt(value) || 0 })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select parent" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {parents.map((parent: any) => (
                                                <SelectItem key={parent.id} value={parent.id.toString()}>
                                                    {parent.fullName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div> */}
                                              <div className="space-y-2">
                                  <Label htmlFor="parentId">Parent</Label>
                                  <Select
                                    name="parentId"
                                    value={(formData.parentId ?? "").toString()}
                                    onValueChange={(value) => {
                                      if (value === "create_new") {
                                        window.location.href = "/admin/parents?openDialog=create&from=student-enquiry";
                                        return;
                                      }
                                      setFormData({ ...formData, parentId: parseInt(value) || 0 });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {parents.map((parent: any) => (
                                        <SelectItem key={parent.id} value={parent.id.toString()}>
                                          {parent.fullName}
                                        </SelectItem>
                                      ))}
                                      
                                      {/* Divider and Create New option */}
                                      <div className="border-t my-1" />
                                      <SelectItem value="create_new" className="text-blue-600 hover:bg-blue-50 cursor-pointer">
                                        + Create New Parent
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="residenceAddress">Residence Address</Label>
                                    <Input
                                        id="residenceAddress"
                                        name="residenceAddress"
                                        value={formData.residenceAddress ?? ""}
                                        onChange={(e) => handleFieldChange('residenceAddress', e.target.value)}
                                    // placeholder="Enter residence address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="street">Street</Label>
                                    <Input
                                        id="street"
                                        name="street"
                                        value={formData.street ?? ""}
                                        onChange={(e) => handleFieldChange('street', e.target.value)}
                                    // placeholder="Enter street"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="community">Community</Label>
                                    <Input
                                        id="community"
                                        name="community"
                                        value={formData.community ?? ""}
                                        onChange={(e) => handleFieldChange('community', e.target.value)}
                                    // placeholder="Enter community"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="flatNo">Flat No/ House No</Label>
                                    <Input
                                        id="flatNo"
                                        name="flatNo"
                                        value={formData.flatNo ?? ""}
                                        onChange={(e) => handleFieldChange('flatNo', e.target.value)}
                                    // placeholder="Enter flat number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="branch"> Branch <span className="text-red-500">*</span></Label>
                                    {(() => {
                                        const options = branches.map((branch) => ({
                                            label: branch.name,
                                            value: String(branch.id),
                                        }));

                                        const selectedValues = formData.branch ? formData.branch.split(',').map(Number) : [];
                                        const selected = options.filter(opt => selectedValues.includes(parseInt(opt.value)));

                                        return (
                                            <ReactSelect
                                                className="text-sm"
                                                options={options}
                                                value={selected}
                                                onChange={(options) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        branch: options ? options.map(opt => opt.value).join(',') : ''
                                                    }));
                                                }}
                                                // placeholder="Select branch"
                                                isClearable
                                                isSearchable
                                                isMulti
                                                required
                                            />
                                        );
                                    })()}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="course">Course <span className="text-red-500">*</span></Label>
                                    {(() => {
                                        const options = courses.map((course) => ({
                                            label: course.name,
                                            value: String(course.id),
                                        }));

                                        const selectedValues = formData.course ? formData.course.split(',').map(Number) : [];
                                        const selected = options.filter(opt => selectedValues.includes(parseInt(opt.value)));

                                        return (
                                            <ReactSelect
                                                className="text-sm"
                                                options={options}
                                                value={selected}
                                                onChange={(options) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        course: options ? options.map(opt => opt.value).join(',') : ''
                                                    }));
                                                }}
                                                // placeholder="Select course"
                                                isClearable
                                                isSearchable
                                                isMulti
                                                required
                                            />
                                        );
                                    })()}
                                </div>
                            </div>

                            <DialogFooter className="pb-4 pr-6">
                                <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-primary text-white hover:bg-primary/80" disabled={createStudentMutation.isPending}>
                                    {createStudentMutation.isPending ? "Creating..." : "Create Student"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Student Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[1400px] max-h-[90vh] flex flex-col gap-4">
                    <DialogHeader className="flex flex-row items-center justify-between gap-4">
                        <div>
                            <DialogTitle>Edit Student</DialogTitle>
                            <DialogDescription>
                                Edit the student's information.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center w-1/3">
                            <Label htmlFor="studentId" className="whitespace-nowrap font-semibold text-lg">Student ID :</Label>
                            <div
                                id="studentId"
                                className="flex-1 px-3 py-2 text-gray-700 font-bold"
                            >
                                {formData.studentId}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        {selectedStudent && (
                            <form onSubmit={handleEditStudentSubmit}>
                                <div className="grid grid-cols-5 gap-4 pb-4">
                                    <div className="space-y-4 pt-4">
                                        <Label htmlFor="isReRegistering">New Registration?</Label>
                                        <select
                                            id="isReRegistering"
                                            name="isReRegistering"
                                            value={formData.isReRegistering}
                                            onChange={(e) =>
                                                handleFieldChange('isReRegistering', e.target.value)
                                            }
                                            className="bg-gray-100 p-2 rounded"
                                        >
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="registrationDate">Registration Date</Label>
                                        <Input
                                            type="date"
                                            id="registrationDate"
                                            name="registrationDate"
                                            value={formData.registrationDate ?? ""}
                                            required
                                            readOnly
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="registrationFee">Registration Fee</Label>
                                        <Input
                                            type="number"
                                            id="registrationFee"
                                            name="registrationFee"
                                            value="100"
                                            required
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-5 gap-4 pb-4">


                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={(e) => handleFieldChange('firstName', e.target.value)}
                                            placeholder="Enter first name"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="middleName">Middle Name</Label>
                                        <Input
                                            id="middleName"
                                            name="middleName"
                                            value={formData.middleName ?? ""}
                                            onChange={(e) => handleFieldChange('middleName', e.target.value)}
                                            placeholder="Enter middle name"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName ?? ""}
                                            onChange={(e) => handleFieldChange('lastName', e.target.value)}
                                            placeholder="Enter last name"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="dateOfBirth"
                                            name="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth ?? ""}
                                            onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="age">Age</Label>
                                        <Input
                                            id="age"
                                            name="age"
                                            type="text"
                                            value={formData.age}
                                            readOnly
                                            className="bg-gray-50"
                                            placeholder="Age will be calculated automatically"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select
                                            name="gender"
                                            value={formData.gender || ""}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, gender: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email || ""}
                                            onChange={(e) => handleFieldChange('email', e.target.value)}
                                            placeholder="Enter email address"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            value={formData.phone || ""}
                                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                                            placeholder="Enter phone number"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="whatsappNo">WhatsApp Number</Label>
                                        <Input
                                            id="whatsappNo"
                                            name="whatsappNo"
                                            value={formData.whatsappNo || ""}
                                            onChange={(e) => handleFieldChange('whatsappNo', e.target.value)}
                                            placeholder="Enter WhatsApp number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="parentId">Parent</Label>
                                        <Select
                                            name="parentId"
                                            value={formData.parentId?.toString() ?? ""}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, parentId: parseInt(value) })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select parent" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parents.map((parent) => (
                                                    <SelectItem key={parent.id} value={parent.id.toString()}>
                                                        {parent.fullName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="street">Street</Label>
                                        <Input
                                            id="street"
                                            name="street"
                                            value={formData.street || ""}
                                            onChange={(e) => handleFieldChange('street', e.target.value)}
                                            placeholder="Enter street"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="community">Community</Label>
                                        <Input
                                            id="community"
                                            name="community"
                                            value={formData.community || ""}
                                            onChange={(e) => handleFieldChange('community', e.target.value)}
                                            placeholder="Enter community"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="residenceAddress">Residence Address</Label>
                                        <Input
                                            id="residenceAddress"
                                            name="residenceAddress"
                                            value={formData.residenceAddress || ""}
                                            onChange={(e) => handleFieldChange('residenceAddress', e.target.value)}
                                            placeholder="Enter residence address"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="flatNo">Flat No/House No</Label>
                                        <Input
                                            id="flatNo"
                                            name="flatNo"
                                            value={formData.flatNo || ""}
                                            onChange={(e) => handleFieldChange('flatNo', e.target.value)}
                                            placeholder="Enter flat number"
                                        />
                                    </div>

                                    {/* <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            name="status"
                                            value={formData.status ?? ""}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, status: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="alumni">Alumni</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div> */}

                                    <div className="space-y-2">
                                        <Label htmlFor="branch">Branch <span className="text-red-500">*</span></Label>
                                        {(() => {
                                            const options = branches.map((branch) => ({
                                                label: branch.name,
                                                value: String(branch.id),
                                            }));

                                            const selectedValues = formData.branch ? formData.branch.split(',').map(Number) : [];
                                            const selected = options.filter(opt => selectedValues.includes(parseInt(opt.value)));

                                            return (
                                                <ReactSelect
                                                    className="text-sm"
                                                    options={options}
                                                    value={selected}
                                                    onChange={(options) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            branch: options ? options.map(opt => opt.value).join(',') : ''
                                                        }));
                                                    }}
                                                    // placeholder="Select branch"
                                                    isClearable
                                                    isSearchable
                                                    isMulti
                                                />
                                            );
                                        })()}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="course">Course <span className="text-red-500">*</span></Label>
                                        {(() => {
                                            const options = courses.map((course) => ({
                                                label: course.name,
                                                value: String(course.id),
                                            }));

                                            const selectedValues = formData.course ? formData.course.split(',').map(Number) : [];
                                            const selected = options.filter(opt => selectedValues.includes(parseInt(opt.value)));

                                            return (
                                                <ReactSelect
                                                    className="text-sm"
                                                    options={options}
                                                    value={selected}
                                                    onChange={(options) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            course: options ? options.map(opt => opt.value).join(',') : ''
                                                        }));
                                                    }}
                                                    // placeholder="Select course"
                                                    isClearable
                                                    isSearchable
                                                    isMulti
                                                />
                                            );
                                        })()}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={updateStudentMutation.isPending}>
                                        {updateStudentMutation.isPending ? "Updating..." : "Update Student"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </AppShell>
    );
}