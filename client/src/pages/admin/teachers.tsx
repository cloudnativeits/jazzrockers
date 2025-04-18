import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Employee, User, Course } from "@shared/schema";
import { getInitials, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

export default function AdminTeachers() {
  const [activeTab, setActiveTab] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Employee | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees (filter for teachers only)
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  // Filter only teacher positions
  const teachers = employees.filter((employee: Employee) => employee.position === "teacher");

  // Fetch users to get teacher details
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch courses for specialization options
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch branches
  const { data: branches = [] } = useQuery({
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

  // Filter teachers based on active tab
  const filteredTeachers = teachers.filter((teacher: Employee) => {
    if (activeTab === "all") return true;
    if (activeTab === teacher.status) return true;
    return false;
  });

  // Get user details for a teacher
  const getUserDetails = (userId: number): User | undefined => {
    return users.find((user: User) => user.id === userId);
  };

  // Get branch name from ID
  const getBranchName = (branchId: string) => {
    const branch = branches.find((b: any) => b.id.toString() === branchId);
    return branch ? branch.name : 'Unknown';
  };

  // Format salary without currency symbol
  const formatSalaryWithoutSymbol = (salary: number) => {
    return salary.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Teacher table columns
  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "employeeId",
      header: "ID",
    },
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => {
        const teacher = row.original;
        const user = getUserDetails(teacher.userId);
        
        return (
          <div className="flex items-center">
            <div>
              <div className="font-medium">{teacher.fullName}</div>
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
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => {
        return getBranchName(row.original.branch);
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
      cell: ({ row }) => {
        const teacher = row.original;
        
        return (
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleViewTeacher(teacher)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  const [formData, setFormData] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    specialization: "",
    joiningDate: new Date().toISOString().split('T')[0],
    salary: "",
    bankAccount: "",
    branch: "",
    username: "",
    password: "",
    status: "active"
  });

  // Helper function to generate username
  const generateUsername = (fullName: string) => {
    const sanitizedName = fullName.toLowerCase().replace(/[^a-z]/g, '');
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

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Generate username when full name changes
      if (name === 'fullName' && value) {
        newData.username = generateUsername(value);
        // Only generate password if it's not already set
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

  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // First create the user account
        const userResponse = await apiRequest("POST", "/api/users", {
          username: data.username,
          password: data.password,
          role: "teacher",
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          address: data.address
        });
        const user = await userResponse.json();

        // Then create the teacher record with the updated schema
        const teacherData = {
          employeeId: data.employeeId,
          fullName: data.fullName,
          userId: user.id,
          position: "teacher",
          joiningDate: data.joiningDate,
          email: data.email,
          salary: Number(data.salary),
          bankAccount: data.bankAccount || null,
          status: data.status,
          branch: data.branch,
          specialization: data.specialization || null
        };
        
        console.log('Creating teacher with data:', teacherData); // Debug log
        const res = await apiRequest("POST", "/api/employees", teacherData);
        return await res.json();
      } catch (error) {
        console.error('Error creating teacher:', error);
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
        fullName: "",
        email: "",
        phone: "",
        address: "",
        specialization: "",
        joiningDate: new Date().toISOString().split('T')[0],
        salary: "",
        bankAccount: "",
        branch: "",
        username: "",
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
    const requiredFields = ['employeeId', 'fullName', 'email', 'specialization', 'branch', 'salary'];
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
          <Button onClick={() => setIsCreateDialogOpen(true)}>
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
            searchColumn="employeeId"
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
                          <p className="text-sm text-muted-foreground">{selectedTeacher.branch}</p>
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
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
                <Button variant="default">
                  <UserCog className="mr-2 h-4 w-4" />
                  View Payroll
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create Teacher Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col gap-4">
          <DialogHeader className="flex-none">
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new teacher to Jazzrockers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleCreateTeacher}>
              <div className="grid grid-cols-2 gap-4 pb-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input 
                      id="employeeId" 
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      placeholder="Enter employee ID"
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required 
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

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      name="username"
                      value={formData.username}
                      placeholder="Username will be auto-generated"
                      readOnly
                      required 
                    />
                    <p className="text-sm text-muted-foreground">Auto-generated from full name</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      name="password"
                      type="text"
                      value={formData.password}
                      placeholder="Password will be auto-generated"
                      readOnly
                      required 
                    />
                    <p className="text-sm text-muted-foreground">Auto-generated secure password</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Select 
                      name="specialization"
                      value={formData.specialization}
                      onValueChange={(value) => handleSelectChange("specialization", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialization" />
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="joiningDate">Joining Date</Label>
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
                    <Label htmlFor="salary">Basic Salary</Label>
                    <Input 
                      id="salary" 
                      name="salary"
                      type="number"
                      value={formData.salary}
                      onChange={handleInputChange}
                      placeholder="Enter monthly salary"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Bank Account</Label>
                    <Input 
                      id="bankAccount" 
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleInputChange}
                      placeholder="Enter bank account details" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select
                      name="branch"
                      value={formData.branch}
                      onValueChange={(value) => handleSelectChange("branch", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch: any) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name}
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
                <Button type="submit" disabled={createTeacherMutation.isPending}>
                  {createTeacherMutation.isPending ? "Creating..." : "Add Teacher"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}