import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PlusCircle, UserPlus, Eye, Edit, Trash2, UserCog, MailIcon, PhoneIcon, MapPinIcon, CalendarIcon, BadgeIndianRupee } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Employee, User, Course, Branch } from "@shared/schema";
import { getInitials, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Controller, useForm } from "react-hook-form";
import { TeacherFormValues, TeacherSchema } from "@/schema/teacherSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { it } from "@faker-js/faker/.";

export default function AdminTeachers() {
  const [activeTab, setActiveTab] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Add this inside your component, near other state declarations
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(TeacherSchema),
    defaultValues: {
      employeeId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      phoneNumber: 0,
      whatsappNumber: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      salary: "",
      bankAccount: "",
      ifscIbanBsb: "",
      branch: [],
      specialization: "",
      residenceAddress: "",
      street: "",
      community: "",
      flatNumber: "",
      status: "active",
    },
  });

  // Fetch employees (filter for teachers only)
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });


  // Filter only teacher positions
  const teachers = useMemo(() => {
    return employees
      .filter((employee: Employee) => employee.position === "teacher")
      .sort((a, b) => {
        const numA = parseInt(a.employeeId.replace('TCR', ''));
        const numB = parseInt(b.employeeId.replace('TCR', ''));
        return numB - numA;
      });
  }, [employees]);

  const nextTeacherId = useMemo(() => {
    if (!teachers || teachers.length === 0) return "TCR100";
    const lastIdNumber = parseInt(teachers[0].employeeId.replace('TCR', ''));
    return `TCR${lastIdNumber + 1}`;
  }, [teachers]);



  // Generate the next teacher ID
  const generateNextTeacherId = () => {
    if (teachers.length === 0) {
      return 'TCR100'; // Starting ID if no teachers exist
    }
    const lastTeacher = teachers[0];
    const lastIdNumber = parseInt(lastTeacher.employeeId.replace('TCR', ''));
    return `TCR${lastIdNumber + 1}`;
  };



  // Fetch users to get teacher details
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch courses for specialization options
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch branches
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  // Group courses by category
  const coursesByCategory = courses.reduce((acc: { [key: string]: Course[] }, course: Course) => {
    if (!acc[course.category]) {
      acc[course.category] = [];
    }
    acc[course.category].push(course);
    return acc;
  }, {});

  // Handle view teacher details
  const handleViewTeacher = (teacher: Employee) => {
    setSelectedTeacher(teacher);
    setIsViewDialogOpen(true);
  };

  


  

  // Get user details for a teacher
  const getUserDetails = (userId: number): User | undefined => {
    return users.find((user: User) => user.id === userId);
  };

  // Get branch name from ID
  const getBranchName = (branchId: string) => {
    // const branch = branches.find((b: any) => b.id.toString() === branchId);
    const branch = branches.find((b: any) => Number(b.id) === Number(branchId));
    return branch ? branch.name : 'Unknown';
  };

  // Format salary without currency symbol
  const formatSalaryWithoutSymbol = (salary: number) => {
    return salary.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleEditTeacher = (teacher: Employee) => {
    setIsViewDialogOpen(false);
    setSelectedTeacher(teacher);
    reset({
      employeeId: teacher.employeeId,
      firstName: teacher.firstName,
      middleName: teacher.middleName || "",
      lastName: teacher.lastName,
      email: teacher.email || "",
      username: teacher.userName,
      password: teacher.password,
      phoneNumber: teacher.phoneNumber || 0,
      whatsappNumber: teacher.whatsappNumber || 0,
      joiningDate: new Date(teacher.joiningDate).toISOString().split('T')[0],
      salary: teacher.salary.toString(),
      bankAccount: teacher.bankAccount || "",
      ifscIbanBsb: teacher.ifscIbanBsb || "",
      branch: Array.isArray(teacher.branch) ? teacher.branch : teacher.branch.split(',').map(b => b.trim()),
      specialization: teacher.specialization || "",
      residenceAddress: teacher.residenceAddress || "",
      street: teacher.street || "",
      community: teacher.community || "",
      flatNumber: teacher.flatNumber || "",
      // status: teacher.status,
    });
    setIsEditDialogOpen(true);
  };

  const updateTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormValues) => {
      const teacherData = {
        employeeId: data.employeeId,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        userName: data.username,
        password: data.password,
        phoneNumber: data.phoneNumber,
        whatsappNumber: data.whatsappNumber,
        joiningDate: data.joiningDate,
        email: data.email,
        salary: Number(data.salary),
        bankAccount: data.bankAccount,
        ifscIbanBsb: data.ifscIbanBsb,
        status: data.status,
        branch: data.branch,
        residenceAddress: data.residenceAddress,
        street: data.street,
        community: data.community,
        flatNumber: data.flatNumber,
        specialization: data.specialization || null
      };

      const res = await apiRequest("PUT", `/api/employees/${selectedTeacher?.id}`, teacherData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Teacher updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update teacher: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleUpdateTeacher = (data: TeacherFormValues) => {
    updateTeacherMutation.mutate(data);
  };

  const deleteTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      // Add debug logging
      console.log("Attempting to delete teacher ID:", selectedTeacher.id);

      const response = await fetch(`http://localhost:5000/api/employees/${selectedTeacher.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include' // If using cookies
      });

      console.log("Delete response:", response);

      if (response.status === 204) {
        await queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
        setSelectedTeacher(null);
        toast({
          title: "Teacher deleted",
          description: "The teacher has been deleted successfully.",
        });
        setIsDeleteDialogOpen(false);
      } else {
        const text = await response.text();
        console.error("Unexpected response:", text);
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete teacher",
        variant: "destructive",
      });
    }
  };

  // Teacher table columns
  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "employeeId",
      header: "ID",
    },
    {
      accessorKey: "firstName",
      header: "Name",
      cell: ({ row }) => {
        const teacher = row.original;
        const user = getUserDetails(teacher.userId);

        return (
          <div className="flex items-center">
            <div>
              <div className="font-medium">{teacher.firstName} {teacher.middleName}{teacher.lastName}</div>
              <div className="text-xs text-muted-foreground">{teacher.email || ""}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "joiningDate",
      header: "Joining Date",
      cell: ({ row }) => {
        return format(new Date(row.original.joiningDate), "MMM dd, yyyy");
      },
    },
    {
      accessorKey: "salary",
      header: "Basic Salary",
      cell: ({ row }) => {
        return formatSalaryWithoutSymbol(Number(row.original.salary));
      },
    },
    // {
    //   accessorKey: "branch",
    //   header: "Branch",
    //   cell: ({ row }) => {
    //     return getBranchName(row.original.branch);
    //   },
    // },
    // CORRECTED AND MORE ROBUST VERSION
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => {
        // This variable might be a string like "1,5" or an array [1, 5]
        const branchData = row.original.branch;

        // Handle cases where data is null, undefined, or an empty string
        if (!branchData) {
          return <span className="text-muted-foreground">N/A</span>;
        }

        // This is the crucial part:
        // 1. Check if the data is already an array.
        // 2. If it's not, assume it's a string and use .split(',') to create an array.
        const branchIds = Array.isArray(branchData)
          ? branchData
          : String(branchData).split(',');

        // Now, branchIds is guaranteed to be an array, so we can map it safely.
        const branchNames = branchIds
          .map(id => getBranchName(String(id).trim())) // .trim() is added for safety
          .join(", ");

        return <div>{branchNames}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeVariant: "default" | "success" | "destructive" | "outline" = "outline";

        if (status === "active") {
          badgeVariant = "success";
        } else if (status === "inactive") {
          badgeVariant = "destructive";
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
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {/* <Button
            variant="ghost"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
            onClick={() => handleEditTeacher(row.original)}
          >
            Edit
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white bg-red-600 hover:bg-red-300"
            onClick={() => handleDeleteTeacher(row.original)}
          >
            Delete
          </Button>
          <Button
            variant="ghost"
            className="bg-gray-500 hover:bg-gray-600 text-white"
            size="sm"
            onClick={() => handleViewTeacher(row.original)}
            title="View Details"
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  const handleDeleteTeacher = (teacher: Employee) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };


  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    userId: "",
    position: "",
    userName: "",
    password: "",
    phoneNumber: "",
    whatsappNumber: "",
    specialization: "",
    residenceAddress: "",
    street: "",
    community: "",
    flatNumber: "",
    joiningDate: new Date().toISOString().split('T')[0],
    salary: "",
    bankAccount: "",
    ifscIbanBsb: "",
    branch: [],
    status: "active"
  });

  // Helper function to generate username
  const generateUsername = (firstName: string) => {
    const sanitizedName = firstName.toLowerCase().replace(/[^a-z]/g, '');
    return `t.${sanitizedName}`;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Generate username from email when email changes
      if (name === 'email' && value) {
        newData.userName = value; // Set username to be the same as email
        // Only generate password if it's not already set
        if (!newData.password) {
          newData.password = generatePassword();
        }
      }

      // Keep the existing firstName logic if you still need it
      if (name === 'firstName' && value && !newData.email) {
        newData.userName = generateUsername(value);
        if (!newData.password) {
          newData.password = generatePassword();
        }
      }

      return newData;
    });
  };

  

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const parseBranchId = (items: any): string[] => {
    const result: string[] = [];

    // Make sure we have an array
    const values = Array.isArray(items) ? items : [items];

    values.forEach((item) => {
      if (typeof item === 'string') {
        // Remove curly braces and quotes, then split by comma
        const cleaned = item.replace(/[{}"]/g, '');
        const parts = cleaned.split(',').map((id) => id.trim()).filter(Boolean);
        console.log("Parsed from item:", item, "=>", parts);
        result.push(...parts);
      } else {
        result.push(item?.toString() || '');
      }
    });

    console.log("Final flattened result:", result);
    return result;
  };


  // Filter teachers based on active tab
  const filteredTeachers = teachers
  .map(teacher => ({
    ...teacher,
    // Normalize the branch data to always be an array of strings
    branch: parseBranchId(teacher.branch)
  }))
  .filter((teacher) => {
    if (activeTab === "all") return true;
    if (activeTab === teacher.status) return true;
    return false;
  });



  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (data: any) => {
      let userId = null;
      try {
        // First create the user account
        const userResponse = await apiRequest("POST", "/api/users", {
          username: data.userName,
          password: data.password,
          role: "teacher",
          fullName: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phoneNumber,
          address: data.residenceAddress
        });

        const user = await userResponse.json();
        userId = user.id; // Store the user ID for potential rollback

        // Then create the teacher record with the updated schema
        const teacherData = {
          employeeId: data.employeeId,
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          userId: user.id,
          position: "teacher",
          userName: data.userName,
          password: data.password,
          phoneNumber: data.phoneNumber,
          whatsappNumber: data.whatsappNumber,
          joiningDate: data.joiningDate,
          email: data.email,
          salary: Number(data.salary),
          bankAccount: data.bankAccount,
          ifscIbanBsb: data.ifscIbanBsb,
          status: data.status,
          branch: data.branch,
          residenceAddress: data.residenceAddress,
          street: data.street,
          community: data.community,
          flatNumber: data.flatNumber,
          specialization: data.specialization || null
        };

        const res = await apiRequest("POST", "/api/employees", teacherData);
        const teacher = await res.json();

        return teacher;
      } catch (error) {
        console.error('Error creating teacher:', error);

        // If we created a user but failed to create teacher, delete the user
        if (userId) {
          try {
            await apiRequest("DELETE", `/api/users/${userId}`);
            console.log('Rolled back user creation due to teacher creation failure');
          } catch (deleteError) {
            console.error('Failed to rollback user creation:', deleteError);
          }
        }

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Teacher created successfully with login credentials",
      });
      // Reset form
      setFormData({
        employeeId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        userId: "",
        position: "",
        userName: "",
        phoneNumber: "",
        whatsappNumber: "",
        residenceAddress: "",
        street: "",
        community: "",
        flatNumber: "",
        specialization: "",
        joiningDate: new Date().toISOString().split('T')[0],
        salary: "",
        bankAccount: "",
        ifscIbanBsb: "",
        branch: [],
        password: "",
        status: "active"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create teacher: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = ['employeeId', 'firstName', 'lastName', 'email', 'specialization', 'branch', 'salary'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    createTeacherMutation.mutate(formData);
  };

  return (
    <AppShell>
      <PageHeader
        title="Teachers"
        description="Manage music teachers across all branches."
        actions={
          <Button
            onClick={() => {
              const nextTeacherId = generateNextTeacherId(); // Safely generated at click time
              setFormData(prev => ({
                ...prev,
                employeeId: nextTeacherId,
                joiningDate: new Date().toISOString().split('T')[0],
                status: "active",
                // Optional: reset other fields here
              }));
              setIsCreateDialogOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>

        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={columns}
            data={filteredTeachers}
            searchColumns={["employeeId"]}
            searchPlaceholder="Search teachers..."
          />
        </TabsContent>
      </Tabs>

      {/* View Teacher Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
            <DialogDescription>
              View comprehensive information about the teacher.
            </DialogDescription>
          </DialogHeader>

          {selectedTeacher && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <Avatar className="h-14 w-14 mr-4">
                    <AvatarFallback className="text-lg">
                      {getUserDetails(selectedTeacher.userId)?.fullName ?
                        getInitials(getUserDetails(selectedTeacher.userId)!.fullName) :
                        "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {getUserDetails(selectedTeacher.userId)?.fullName || "Unknown"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTeacher.employeeId} · Teacher
                    </p>
                  </div>
                </div>
                <Badge variant={selectedTeacher.status === "active" ? "success" : "destructive"}>
                  {selectedTeacher.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-3">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MailIcon className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">
                            {getUserDetails(selectedTeacher.userId)?.email || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <PhoneIcon className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">
                            {getUserDetails(selectedTeacher.userId)?.phone || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Address</p>
                          <p className="text-sm text-muted-foreground">
                            {getUserDetails(selectedTeacher.userId)?.address || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-3">Employment Details</h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Joining Date</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(selectedTeacher.joiningDate), "MMMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <BadgeIndianRupee className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Basic Salary</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(Number(selectedTeacher.salary))} per month
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Branch</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedTeacher.branch
                              ? branches
                                .filter((branch: Branch) =>
                                  parseBranchId(selectedTeacher.branch).includes(branch.id.toString())
                                )
                                .map((branch: Branch) => branch.name)
                                .join(", ")
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedTeacher.bankAccount && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-2">Bank Details</h4>
                    <p className="text-sm">{selectedTeacher.bankAccount}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-3 mt-4">
                <Button variant="outline"
                  onClick={() => handleEditTeacher(selectedTeacher)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>

                {/* <Button variant="default">
                  <UserCog className="mr-2 h-4 w-4" />
                  View Payroll
                </Button> */}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Teacher Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[950px] max-h-[90vh] flex flex-col gap-5">
          <DialogHeader className="flex flex-row items-center justify-between gap-4">
            <div>

              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new teacher to Jazzrockers.
              </DialogDescription>
            </div>
            <div className="flex items-center w-1/3">
              <Label htmlFor="studentId" className="whitespace-nowrap font-semibold text-lg">Teacher ID:</Label>
              <div
                id="studentId"
                className="flex-1 px-3 py-2 text-gray-700 font-bold"
              >
                {nextTeacherId}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleCreateTeacher}>
              {/* <div className="mb-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm font-medium">Teacher ID: <span className="font-bold">{nextTeacherId}</span></p>
              </div> */}
              <div className="grid grid-cols-3 gap-4 pb-4">
                {/* Row 1 */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name<span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    // placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                  // placeholder="Enter middle name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name<span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    // placeholder="Enter last name"
                    required
                  />
                </div>

                {/* Row 2 */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email<span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    // placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username<span className="text-red-500">*</span></Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.userName}
                    // placeholder="Auto-generated"
                    readOnly
                    disabled
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password<span className="text-red-500">*</span></Label>
                  <Input
                    id="password"
                    name="password"
                    type="text"
                    value={formData.password}
                    // placeholder="Auto-generated"
                    readOnly
                    disabled
                    required
                  />
                </div>

                {/* Row 3 */}
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date<span className="text-red-500">*</span></Label>
                  <Input
                    id="joiningDate"
                    name="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  // placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">Whatsapp Number</Label>
                  <Input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleInputChange}
                  // placeholder="Enter whatsapp number"
                  />
                </div>

                {/* Row 4 */}
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {formData.branch && formData.branch.length > 0
                          ? branches
                            .filter((branch) => formData.branch.includes(branch.id))
                            .map((branch) => branch.name)
                            .join(", ")
                          : "Select Branch"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-60 overflow-auto p-2">
                      {branches.map((branch) => {
                        const isChecked = formData.branch.includes(branch.id);
                        return (
                          <div
                            key={branch.id}
                            className="flex items-center space-x-2 cursor-pointer rounded-md p-2 hover:bg-accent"
                            onClick={() => {
                              const selectedIds = formData.branch || [];
                              const newValue = isChecked
                                ? selectedIds.filter((id) => id !== branch.id)
                                : [...selectedIds, branch.id];
                              handleSelectChange("branch", newValue);
                            }}
                          >
                            <Checkbox checked={isChecked} id={`branch-${branch.id}`} />
                            <label htmlFor={`branch-${branch.id}`} className="cursor-pointer">
                              {branch.name}
                            </label>
                          </div>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Course</Label>
                  <Select
                    name="specialization"
                    value={formData.specialization}
                    onValueChange={(value) => handleSelectChange("specialization", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course: Course) => (
                        <SelectItem key={course.id} value={course.name}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">
                    Basic Salary<span className="text-red-500">*</span>
                  </Label>

                  <Input
                    id="salary"
                    name="salary"
                    type="number"
                    value={formData.salary}
                    onChange={handleInputChange}
                    // placeholder="Enter monthly salary"
                    required
                  />
                </div>

                {/* Row 5 */}
                <div className="space-y-2">
                  <Label htmlFor="residenceAddress">Residential Address</Label>
                  <Input
                    id="residenceAddress"
                    name="residenceAddress"
                    value={formData.residenceAddress}
                    onChange={handleInputChange}
                  // placeholder="Enter residential address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                  // placeholder="Enter Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="community">Community</Label>
                  <Input
                    id="community"
                    name="community"
                    value={formData.community}
                    onChange={handleInputChange}
                  // placeholder="Enter community"
                  />
                </div>

                {/* Row 6 */}
                <div className="space-y-2">
                  <Label htmlFor="flatNumber">Flat Number</Label>
                  <Input
                    id="flatNumber"
                    name="flatNumber"
                    value={formData.flatNumber}
                    onChange={handleInputChange}
                  // placeholder="Enter flat number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Bank Account</Label>
                  <Input
                    id="bankAccount"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                  // placeholder="Enter bank account details"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscIbanBsb">IFSC/IBAN/BSB</Label>
                  <Input
                    id="ifscIbanBsb"
                    name="ifscIbanBsb"
                    value={formData.ifscIbanBsb}
                    onChange={handleInputChange}
                  // placeholder="Enter IFSC/IBAN/BSB"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTeacherMutation.isPending}>
                  {createTeacherMutation.isPending ? "Creating..." : "Add Teacher"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[950px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Teacher</DialogTitle>
            <DialogDescription>
              Update the details for this teacher at Jazzrockers.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(handleUpdateTeacher)}
            className="grid grid-cols-3 max-sm:grid-cols-1 gap-4"
          >
            {/* Row 1 */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => <Input id="firstName" {...field} />}
              />
              {errors?.firstName && (
                <p className="text-sm text-red-500">{errors.firstName?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Controller
                name="middleName"
                control={control}
                render={({ field }) => <Input id="middleName" {...field} />}
              />
              {errors?.middleName && (
                <p className="text-sm text-red-500">{errors.middleName?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => <Input id="lastName" {...field} />}
              />
              {errors?.lastName && (
                <p className="text-sm text-red-500">{errors.lastName?.message}</p>
              )}
            </div>

            {/* Row 2 */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input id="email" type="email" {...field} />}
              />
              {errors?.email && (
                <p className="text-sm text-red-500">{errors.email?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Controller
                name="username"
                control={control}
                render={({ field }) => <Input id="username" disabled {...field} />}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input id="password" type="password" disabled {...field} />
                )}
              />
            </div>

            {/* Row 3 */}
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Controller
                name="joiningDate"
                control={control}
                render={({ field }) => (
                  <Input id="joiningDate" type="date" {...field} />
                )}
              />
              {errors?.joiningDate && (
                <p className="text-sm text-red-500">{errors.joiningDate?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => <Input id="phone" {...field} />}
              />
              {errors?.phoneNumber && (
                <p className="text-sm text-red-500">{errors.phoneNumber?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">Whatsapp Number</Label>
              <Controller
                name="whatsappNumber"
                control={control}
                render={({ field }) => <Input id="whatsapp" {...field} />}
              />
              {errors?.whatsappNumber && (
                <p className="text-sm text-red-500">
                  {errors.whatsappNumber?.message}
                </p>
              )}
            </div>

            {/* Row 4 */}
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Controller
                name="branch"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {field.value && (field.value as string[]).length > 0
                          ? branches
                            .filter((branch: Branch) =>
                              (field.value as string[]).some((item: string) =>
                                parseBranchId(item).includes(branch.id.toString())
                              )
                            )
                            .map((branch: Branch) => branch.name)
                            .join(", ")
                          : "Select branches..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-60 overflow-auto p-2">
                      {branches.map((branch) => {
                        // Use the same parsing logic as in the display
                        const isChecked = field.value?.some((item: string) =>
                          parseBranchId(item).includes(branch.id.toString())
                        );

                        return (
                          <div
                            key={branch.id}
                            className="flex items-center space-x-2 cursor-pointer rounded-md p-2 hover:bg-accent"
                            onClick={() => {
                              // Parse all current values to get clean IDs
                              const currentIds = field.value
                                ? (field.value as string[]).flatMap(item => parseBranchId(item))
                                : [];

                              const newValue = isChecked
                                ? currentIds.filter(id => id !== branch.id.toString())
                                : [...currentIds, branch.id.toString()];

                              field.onChange(newValue);
                            }}
                          >
                            <Checkbox
                              checked={isChecked}
                              id={`branch-${branch.id}`}
                            />
                            <label htmlFor={`branch-${branch.id}`} className="cursor-pointer">
                              {branch.name}
                            </label>
                          </div>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors?.branch && (
                <p className="text-sm text-red-500">{errors.branch?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Course</Label>
              <Controller
                name="specialization"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(coursesByCategory).map(([category, courses]) => (
                        <div key={category}>
                          <SelectItem value={category} disabled className="font-semibold">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                          {courses.map((course: Course) => (
                            <SelectItem key={course.id} value={course.name}>
                              {course.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors?.specialization && (
                <p className="text-sm text-red-500">
                  {errors.specialization?.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Basic Salary</Label>
              <Controller
                name="salary"
                control={control}
                render={({ field }) => (
                  <Input id="salary" type="number" {...field} />
                )}
              />
              {errors?.salary && (
                <p className="text-sm text-red-500">{errors.salary?.message}</p>
              )}
            </div>

            {/* Row 5 */}
            <div className="space-y-2">
              <Label htmlFor="residenceAddress">Residential Address</Label>
              <Controller
                name="residenceAddress"
                control={control}
                render={({ field }) => <Input id="residenceAddress" {...field} />}
              />
              {errors?.residenceAddress && (
                <p className="text-sm text-red-500">
                  {errors.residenceAddress?.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Controller
                name="street"
                control={control}
                render={({ field }) => <Input id="street" {...field} />}
              />
              {errors?.street && (
                <p className="text-sm text-red-500">{errors.street?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="community">Community</Label>
              <Controller
                name="community"
                control={control}
                render={({ field }) => <Input id="community" {...field} />}
              />
              {errors?.community && (
                <p className="text-sm text-red-500">{errors.community?.message}</p>
              )}
            </div>

            {/* Row 6 */}
            <div className="space-y-2">
              <Label htmlFor="flatNumber">Flat Number</Label>
              <Controller
                name="flatNumber"
                control={control}
                render={({ field }) => <Input id="flatNumber" {...field} />}
              />
              {errors?.flatNumber && (
                <p className="text-sm text-red-500">{errors.flatNumber?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank Account</Label>
              <Controller
                name="bankAccount"
                control={control}
                render={({ field }) => <Input id="bankAccount" {...field} />}
              />
              {errors?.bankAccount && (
                <p className="text-sm text-red-500">{errors.bankAccount?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifscIbanBsb">IFSC/IBAN/BSB</Label>
              <Controller
                name="ifscIbanBsb"
                control={control}
                render={({ field }) => <Input id="ifscIbanBsb" {...field} />}
              />
              {errors?.ifscIbanBsb && (
                <p className="text-sm text-red-500">{errors.ifscIbanBsb?.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors?.status && (
                <p className="text-sm text-red-500">{errors.status?.message}</p>
              )}
            </div>

            <div className="col-span-3 flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateTeacherMutation.isPending}>
                {updateTeacherMutation.isPending ? "Updating..." : "Update Teacher"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Parent Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this teacher? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteTeacher}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}