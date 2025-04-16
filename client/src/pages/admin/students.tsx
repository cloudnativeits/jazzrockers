import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
  PlusCircle, 
  EyeIcon, 
  Edit, 
  Trash2, 
  UserCheck, 
  KeyRound, 
  UserPlus 
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Student, InsertStudent, User } from "@shared/schema";
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

export default function AdminStudents() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for creating a new student
  const [formData, setFormData] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    course: "",
    batch: "",
    branch: "",
    status: "active",
    parentId: 0,
    enrollmentDate: new Date().toISOString().split('T')[0]
  });

  // Fetch students
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });
  
  // Fetch users for parent selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch courses, batches and branches
  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ["/api/batches"],
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });
  
  // Filter only parent users for dropdown
  const parents = users.filter((user: any) => user.role === "parent");

  // Helper function to generate username
  const generateUsername = (firstName: string, lastName: string) => {
    const sanitizedFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const sanitizedLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
    return `${sanitizedFirstName}.${sanitizedLastName}`;
  };

  // Helper function to generate random password
  const generatePassword = () => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Handle first name and last name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // If both first and last name are present, generate username
      if (name === 'firstName' || name === 'lastName') {
        if (newData.firstName && newData.lastName) {
          newData.username = generateUsername(newData.firstName, newData.lastName);
          // Only generate password if it's not already set
          if (!newData.password) {
            newData.password = generatePassword();
          }
        }
      }
      
      return newData;
    });
  };

  // Handle input change for create/edit forms
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle branch change
  const handleBranchChange = (value: string) => {
    setFormData({
      ...formData,
      branch: value,
      batch: "", // Reset only batch when branch changes
    });
  };

  // Handle course change
  const handleCourseChange = (value: string) => {
    setFormData({
      ...formData,
      course: value,
      batch: "", // Reset only batch when course changes
    });
  };

  // Filter batches based on selected course and branch
  const filteredBatches = batches.filter((batch) => {
    if (!formData.course || !formData.branch) return false;
    
    // Find the selected course and branch
    const course = courses.find(c => c.id === Number(formData.course));
    const branch = branches.find(b => b.id === Number(formData.branch));
    
    if (!course || !branch) return false;

    // Get first two letters of course and branch names
    const coursePrefix = course.name.slice(0, 2).toUpperCase();
    const branchPrefix = branch.name.split(' ')[0].slice(0, 2).toUpperCase();
    const expectedPrefix = coursePrefix + branchPrefix;
    
    // Check if batch name starts with the combined prefix
    return batch.name.toUpperCase().startsWith(expectedPrefix);
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      // First create the user account
      const userResponse = await apiRequest("POST", "/api/users", {
        username: data.username,
        password: data.password,
        role: "student",
        fullName: `${data.firstName} ${data.lastName}`,
        email: data.email
      });
      const user = await userResponse.json();

      // Then create the student with the user ID
      const studentData = {
        ...data,
        userId: user.id
      };
      const res = await apiRequest("POST", "/api/students", studentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Student created successfully with login credentials",
      });
      // Reset form
      setFormData({
        studentId: "",
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        dateOfBirth: "",
        gender: "",
        email: "",
        phone: "",
        address: "",
        course: "",
        batch: "",
        branch: "",
        status: "active",
        parentId: 0,
        enrollmentDate: new Date().toISOString().split('T')[0]
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create student: ${error.message}`,
        variant: "destructive",
      });
    }
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

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number, password: string }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/reset-password`, { password });
      return await res.json();
    },
    onSuccess: () => {
      setIsResetPasswordDialogOpen(false);
      setNewPassword("");
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to reset password: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Open student details dialog
  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  // Handle edit student
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      username: student.username,
      password: student.password || "",
      dateOfBirth: student.dateOfBirth || "",
      gender: student.gender || "",
      email: student.email || "",
      phone: student.phone || "",
      address: student.address || "",
      course: student.course || "",
      batch: student.batch || "",
      branch: student.branch || "",
      status: student.status,
      parentId: student.parentId,
      enrollmentDate: student.enrollmentDate
    });
    setIsEditDialogOpen(true);
  };

  // Handle reset password
  const handleResetPassword = (student: Student) => {
    // Find the user associated with this student
    const user = users.find((user: any) => user.id === student.userId);
    if (user) {
      setSelectedStudent(student);
      setIsResetPasswordDialogOpen(true);
    } else {
      toast({
        title: "Error",
        description: "No user account found for this student",
        variant: "destructive",
      });
    }
  };

  // Handle create student submit
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    createStudentMutation.mutate(formData as InsertStudent);
  };

  // Handle edit student submit
  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent) {
      updateStudentMutation.mutate({ 
        id: selectedStudent.id, 
        data: formData
      });
    }
  };

  // Handle reset password submit
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent && selectedStudent.userId) {
      resetPasswordMutation.mutate({ 
        userId: selectedStudent.userId, 
        password: newPassword 
      });
    }
  };

  // Filter students based on active tab
  const filteredStudents = students.filter((student: Student) => {
    if (activeTab === "all") return true;
    return student.status === activeTab;
  });

  // Student table columns
  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "studentId",
      header: "Student ID",
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const student = row.original;
        return `${student.firstName} ${student.lastName}`;
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
      accessorKey: "course",
      header: "Course",
      cell: ({ row }) => {
        const courseId = Number(row.original.course);
        const course = courses.find((c) => c.id === courseId);
        console.log('Course:', { courseId, course, allCourses: courses });
        return course ? course.name : courseId;
      },
    },
    {
      accessorKey: "batch",
      header: "Batch",
      cell: ({ row }) => {
        const batchId = Number(row.original.batch);
        const batch = batches.find((b) => b.id === batchId);
        console.log('Batch:', { batchId, batch, allBatches: batches });
        return batch ? batch.name : batchId;
      },
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => {
        const branchId = Number(row.original.branch);
        const branch = branches.find((b) => b.id === branchId);
        console.log('Branch:', { branchId, branch, allBranches: branches });
        return branch ? branch.name : branchId;
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
          <Badge variant={badgeVariant}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
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
              size="icon"
              onClick={() => handleViewStudent(student)}
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleEditStudent(student)}
              title="Edit Student"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleResetPassword(student)}
              title="Reset Password"
            >
              <KeyRound className="h-4 w-4 text-amber-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell>
      <PageHeader 
        title="Students" 
        description="Manage all students enrolled in Jazzrockers."
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Student
          </Button>
        }
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="alumni">Alumni</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <DataTable 
            columns={columns} 
            data={filteredStudents} 
            searchColumn="studentId"
            searchPlaceholder="Search by ID or name..."
          />
        </TabsContent>
      </Tabs>
      
      {/* Student View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about the student.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-sm text-neutral-500">ID: {selectedStudent.studentId}</p>
                </div>
                <Badge variant={selectedStudent.status === "active" ? "default" : (selectedStudent.status === "inactive" ? "secondary" : "outline")}>
                  {selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-2">Personal Information</h4>
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
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-2">Enrollment Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Branch</span>
                        <span className="text-sm">{selectedStudent.branch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Enrollment Date</span>
                        <span className="text-sm">{format(new Date(selectedStudent.enrollmentDate), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Address</span>
                      <span className="text-sm">{selectedStudent.address || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Parent ID</span>
                      <span className="text-sm">{selectedStudent.parentId}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex space-x-4">
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditStudent(selectedStudent);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Student
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleResetPassword(selectedStudent);
                  }}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create Student Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col gap-4">
          <DialogHeader className="flex-none">
            <DialogTitle>Create New Student</DialogTitle>
            <DialogDescription>
              Fill in the student details below
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleCreateStudent}>
              <div className="grid grid-cols-2 gap-4 pb-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input 
                      id="studentId" 
                      name="studentId"
                      value={formData.studentId} 
                      onChange={handleInputChange}
                      placeholder="E.g., STU12345" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      name="firstName"
                      value={formData.firstName} 
                      onChange={handleNameChange}
                      placeholder="Enter first name" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName"
                      value={formData.lastName} 
                      onChange={handleNameChange}
                      placeholder="Enter last name" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input 
                      id="dateOfBirth" 
                      name="dateOfBirth"
                      type="date" 
                      value={formData.dateOfBirth} 
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      name="gender" 
                      value={formData.gender} 
                      onValueChange={(value) => 
                        setFormData({...formData, gender: value})
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
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      name="username"
                      value={formData.username} 
                      onChange={handleInputChange}
                      placeholder="Username will be auto-generated" 
                      required
                      readOnly
                    />
                    <p className="text-sm text-muted-foreground">Auto-generated from first and last name</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      name="password"
                      type="text"
                      value={formData.password} 
                      onChange={handleInputChange}
                      placeholder="Password will be auto-generated" 
                      required
                      readOnly
                    />
                    <p className="text-sm text-muted-foreground">Auto-generated secure password</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      value={formData.email} 
                      onChange={handleInputChange}
                      placeholder="Enter email address" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      value={formData.phone} 
                      onChange={handleInputChange}
                      placeholder="Enter phone number" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      name="address"
                      value={formData.address} 
                      onChange={handleInputChange}
                      placeholder="Enter address" 
                    />
                  </div>
                  
                  {/* Course Selection - Independent */}
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Select 
                      name="course" 
                      value={formData.course} 
                      onValueChange={handleCourseChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name} ({course.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Branch Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select 
                      name="branch" 
                      value={formData.branch} 
                      onValueChange={handleBranchChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name} ({branch.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Batch Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch</Label>
                    <Select 
                      name="batch" 
                      value={formData.batch} 
                      onValueChange={(value) => handleInputChange({ target: { name: "batch", value } } as any)}
                      disabled={!formData.course || !formData.branch}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !formData.course || !formData.branch 
                            ? "Select course and branch first" 
                            : filteredBatches.length === 0 
                              ? "No batches available" 
                              : "Select batch"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredBatches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id.toString()}>
                            {batch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.course && formData.branch && filteredBatches.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        No batches found for this course and branch combination
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parentId">Parent</Label>
                    <Select 
                      name="parentId" 
                      value={formData.parentId.toString()} 
                      onValueChange={(value) => 
                        setFormData({...formData, parentId: parseInt(value)})
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
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createStudentMutation.isPending}>
                  {createStudentMutation.isPending ? "Creating..." : "Create Student"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col gap-4">
          <DialogHeader className="flex-none">
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Modify the student's information.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {selectedStudent && (
              <form onSubmit={handleEditStudentSubmit}>
                <div className="grid grid-cols-2 gap-4 pb-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input 
                        id="studentId" 
                        name="studentId"
                        value={formData.studentId} 
                        onChange={handleInputChange}
                        placeholder="E.g., STU12345" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        name="firstName"
                        value={formData.firstName} 
                        onChange={handleNameChange}
                        placeholder="Enter first name" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        name="lastName"
                        value={formData.lastName} 
                        onChange={handleNameChange}
                        placeholder="Enter last name" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input 
                        id="dateOfBirth" 
                        name="dateOfBirth"
                        type="date" 
                        value={formData.dateOfBirth} 
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        name="gender" 
                        value={formData.gender || ""} 
                        onValueChange={(value) => 
                          setFormData({...formData, gender: value})
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
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        name="username"
                        value={formData.username} 
                        onChange={handleInputChange}
                        placeholder="Enter username" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        name="password"
                        type="password"
                        value={formData.password} 
                        onChange={handleInputChange}
                        placeholder="Enter new password" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        value={formData.email || ""} 
                        onChange={handleInputChange}
                        placeholder="Enter email address" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={formData.phone || ""} 
                        onChange={handleInputChange}
                        placeholder="Enter phone number" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        name="address"
                        value={formData.address || ""} 
                        onChange={handleInputChange}
                        placeholder="Enter address" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        name="status" 
                        value={formData.status} 
                        onValueChange={(value) => 
                          setFormData({...formData, status: value})
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
                    </div>
                    
                    {/* Course Selection - Independent */}
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Select 
                        name="course" 
                        value={formData.course} 
                        onValueChange={handleCourseChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.name} ({course.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Branch Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Select 
                        name="branch" 
                        value={formData.branch} 
                        onValueChange={handleBranchChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id.toString()}>
                              {branch.name} ({branch.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Batch Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="batch">Batch</Label>
                      <Select 
                        name="batch" 
                        value={formData.batch} 
                        onValueChange={(value) => handleInputChange({ target: { name: "batch", value } } as any)}
                        disabled={!formData.course || !formData.branch}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !formData.course || !formData.branch 
                              ? "Select course and branch first" 
                              : filteredBatches.length === 0 
                                ? "No batches available" 
                                : "Select batch"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredBatches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id.toString()}>
                              {batch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.course && formData.branch && filteredBatches.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          No batches found for this course and branch combination
                        </p>
                      )}
                    </div>
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
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this student.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password" 
                    required 
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsResetPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}