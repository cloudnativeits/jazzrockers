import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Home, BookOpen } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Course, Employee } from "@shared/schema";

// Form schema
const courseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  fee: z.number().min(1, "Fee must be greater than 0"),
  duration: z.number().min(1, "Duration must be at least 1 week"),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

// Form schema for batch
const batchFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  courseId: z.number().min(1, "Course is required"),
  teacherId: z.number().min(1, "Teacher is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  daysOfWeek: z.string().min(1, "Days of week are required"),
  roomNumber: z.string().optional(),
  capacity: z.number().optional(),
  category: z.string().min(1, "Category is required"),
  branch: z.string().min(1, "Branch is required"),
  status: z.enum(["active", "completed", "cancelled"]).default("active"),
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

// Form schema for branch
const branchFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().nullable(),
  manager: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

export default function AdminCourses() {
  const [activeTab, setActiveTab] = useState("courses");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateBatchDialogOpen, setIsCreateBatchDialogOpen] = useState(false);
  const [isCreateBranchDialogOpen, setIsCreateBranchDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [isEditBranchDialogOpen, setIsEditBranchDialogOpen] = useState(false);
  const [isDeleteBranchDialogOpen, setIsDeleteBranchDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [isEditBatchDialogOpen, setIsEditBatchDialogOpen] = useState(false);
  const [isDeleteBatchDialogOpen, setIsDeleteBatchDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch batches
  const { data: batches = [], isLoading: isLoadingBatches } = useQuery<any[]>({
    queryKey: ["/api/batches"],
  });

  // Fetch employees
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  // Filter only active teachers
  const teachers = employees.filter((employee: any) => 
    employee.position === "teacher" && employee.status === "active"
  );

  // Course form
  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "music",
      fee: 0,
      duration: 8,
    },
  });

  // Edit form
  const editForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "music",
      fee: 0,
      duration: 8,
    },
  });

  // Batch form
  const batchForm = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      courseId: 0,
      teacherId: 0,
      startDate: "",
      endDate: "",
      startTime: "17:00",
      endTime: "18:00",
      daysOfWeek: "Mon,Thu",
      roomNumber: "",
      capacity: 0,
      category: "dance",
      branch: "",
      status: "active",
    },
  });

  // Branch form
  const branchForm = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      manager: "",
      status: "active",
    },
  });

  // Helper function to generate batch name
  const generateBatchName = (courseCode: string, branchCode: string, teacherCode: string, category: string) => {
    // TODO: Implement logic to get next serial number
    const serialNumber = "01"; // This should be dynamic based on existing batches
    const year = new Date().getFullYear().toString().slice(-2);
    return `${courseCode}${branchCode}${serialNumber}${year}`;
  };

  // Course table columns
  const courseColumns: ColumnDef<Course>[] = [
    {
      accessorKey: "name",
      header: "Course Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "category",
      header: "Department",
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        let badgeClass = "bg-blue-100 text-blue-800";
        
        if (category === "dance") {
          badgeClass = "bg-orange-100 text-orange-800";
        } else if (category === "art") {
          badgeClass = "bg-green-100 text-green-800";
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Badge>
        );
      },
    },
      {
        accessorKey: "fee",
        header: "Fee (Per month)",
      cell: ({ row }) => (
        <div className="font-mono">{row.getValue("fee")}</div>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duration (weeks)",
      cell: ({ row }) => row.getValue("duration"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const course = row.original;
        
        return (
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleEditCourse(course)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDeleteCourse(course)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Batch table columns
  const batchColumns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Batch Name",
    },
    {
      accessorKey: "courseId",
      header: "Course",
      cell: ({ row }) => {
        const courseId = row.getValue("courseId") as number;
        const course = courses.find((c: Course) => c.id === courseId);
        return course ? course.name : "Unknown Course";
      },
    },
    {
      accessorKey: "category",
      header: "Department",
    },
    {
      accessorKey: "teacherId",
      header: "Teacher",
      cell: ({ row }) => {
        const teacherId = row.getValue("teacherId") as number;
        const employee = employees.find((e: Employee) => e.id === teacherId);
        return employee ? employee.fullName : "Unknown Teacher";
      },
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("startDate"));
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("endDate"));
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "outline";
        
        if (status === "active") {
          badgeVariant = "secondary";
        } else if (status === "completed") {
          badgeVariant = "default";
        } else if (status === "cancelled") {
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
        const batch = row.original;
        
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => handleEditBatch(batch)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => handleDeleteBatch(batch)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Branch table columns
  const branchColumns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Branch Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.getValue("email") || "-",
    },
    {
      accessorKey: "manager",
      header: "Manager",
      cell: ({ row }) => row.getValue("manager") || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const badgeClass = status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
        return (
          <Badge variant="outline" className={badgeClass}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const branch = row.original;
        
        return (
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleEditBranch(branch)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDeleteBranch(branch)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Handle edit course
  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    editForm.reset({
      name: course.name,
      description: course.description || "",
      category: course.category,
      fee: Number(course.fee),
      duration: course.duration,
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete course
  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  // Submit create course form
  const onCreateCourseSubmit = async (data: CourseFormValues) => {
    try {
      await apiRequest("POST", "/api/courses", data);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsCreateDialogOpen(false);
      courseForm.reset();
      toast({
        title: "Course created",
        description: "The course has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Submit edit course form
  const onEditCourseSubmit = async (data: CourseFormValues) => {
    if (!selectedCourse) return;
    
    try {
      await apiRequest("PUT", `/api/courses/${selectedCourse.id}`, data);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsEditDialogOpen(false);
      setSelectedCourse(null);
      toast({
        title: "Course updated",
        description: "The course has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete course
  const deleteCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      await apiRequest("DELETE", `/api/courses/${selectedCourse.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      toast({
        title: "Course deleted",
        description: "The course has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Create batch submit handler
  const onCreateBatchSubmit = async (data: BatchFormValues) => {
    try {
      // Get the course details for the course code
      const selectedCourse = courses.find(c => c.id === data.courseId);
      if (!selectedCourse) {
        throw new Error("Course not found");
      }

      const courseCode = selectedCourse.name.slice(0, 2).toUpperCase();
      
      // Get branch code from the selected branch
      const selectedBranch = branches.find(b => b.name === data.branch);
      if (!selectedBranch) {
        throw new Error("Branch not found");
      }
      
      // Generate branch code from branch name (first two letters)
      const branchCode = data.branch.slice(0, 2).toUpperCase();

      // Generate the batch name
      const batchName = generateBatchName(courseCode, branchCode, "LA", data.category.slice(0, 1).toUpperCase());

      // Format the data to match the server schema
      const batchData = {
        name: batchName,
        courseId: data.courseId,
        teacherId: data.teacherId,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        daysOfWeek: data.daysOfWeek,
        roomNumber: data.roomNumber || null,
        capacity: data.capacity || 10,
        category: data.category,
        branch: data.branch,
        status: data.status
      };

      console.log('Submitting batch data:', batchData);

      await apiRequest("POST", "/api/batches", batchData);
      
      await queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      setIsCreateBatchDialogOpen(false);
      batchForm.reset();
      
      toast({
        title: "Success",
        description: "Batch created successfully",
      });
    } catch (error) {
      console.error('Batch creation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create batch",
        variant: "destructive",
      });
    }
  };

  // Create branch submit handler
  const onCreateBranchSubmit = async (data: BranchFormValues) => {
    try {
      await apiRequest("POST", "/api/branches", data);
      await queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setIsCreateBranchDialogOpen(false);
      branchForm.reset();
      toast({
        title: "Success",
        description: "Branch created successfully",
      });
    } catch (error) {
      console.error('Branch creation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create branch",
        variant: "destructive",
      });
    }
  };

  // Edit branch submit handler
  const onEditBranchSubmit = async (data: BranchFormValues) => {
    if (!selectedBranch) return;
    
    try {
      await apiRequest("PUT", `/api/branches/${selectedBranch.id}`, data);
      await queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setIsEditBranchDialogOpen(false);
      setSelectedBranch(null);
      toast({
        title: "Branch updated",
        description: "The branch has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle edit branch
  const handleEditBranch = (branch: any) => {
    setSelectedBranch(branch);
    branchForm.reset({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email || "",
      manager: branch.manager || "",
      status: branch.status,
    });
    setIsEditBranchDialogOpen(true);
  };

  // Handle delete branch
  const handleDeleteBranch = (branch: any) => {
    setSelectedBranch(branch);
    setIsDeleteBranchDialogOpen(true);
  };

  // Delete branch
  const deleteBranch = async () => {
    if (!selectedBranch) return;
    
    try {
      const response = await apiRequest("DELETE", `/api/branches/${selectedBranch.id}`);
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
        setIsDeleteBranchDialogOpen(false);
        setSelectedBranch(null);
        toast({
          title: "Branch deleted",
          description: "The branch has been deleted successfully.",
        });
      } else {
        throw new Error("Failed to delete branch");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle edit batch
  const handleEditBatch = (batch: any) => {
    setSelectedBatch(batch);
    batchForm.reset({
      courseId: batch.courseId,
      teacherId: batch.teacherId,
      startDate: batch.startDate,
      endDate: batch.endDate,
      startTime: batch.startTime,
      endTime: batch.endTime,
      daysOfWeek: batch.daysOfWeek,
      roomNumber: batch.roomNumber,
      capacity: batch.capacity,
      category: batch.category,
      branch: batch.branch,
      status: batch.status
    });
    setIsEditBatchDialogOpen(true);
  };

  // Handle delete batch
  const handleDeleteBatch = (batch: any) => {
    setSelectedBatch(batch);
    setIsDeleteBatchDialogOpen(true);
  };

  // Edit batch submit handler
  const onEditBatchSubmit = async (data: BatchFormValues) => {
    if (!selectedBatch) return;
    
    try {
      const response = await apiRequest("PUT", `/api/batches/${selectedBatch.id}`, data);
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
        setIsEditBatchDialogOpen(false);
        setSelectedBatch(null);
        toast({
          title: "Batch updated",
          description: "The batch has been updated successfully.",
        });
      } else {
        throw new Error("Failed to update batch");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete batch
  const deleteBatch = async () => {
    if (!selectedBatch) return;
    
    try {
      const response = await apiRequest("DELETE", `/api/batches/${selectedBatch.id}`);
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
        setIsDeleteBatchDialogOpen(false);
        setSelectedBatch(null);
        toast({
          title: "Batch deleted",
          description: "The batch has been deleted successfully.",
        });
      } else {
        throw new Error("Failed to delete batch");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Courses & Batches" 
        description="Manage courses and batches offered by Jazzrockers."
        actions={
          <Button onClick={() => {
            if (activeTab === "courses") {
              setIsCreateDialogOpen(true);
            } else if (activeTab === "batches") {
              setIsCreateBatchDialogOpen(true);
            } else if (activeTab === "branches") {
              setIsCreateBranchDialogOpen(true);
            }
          }}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {activeTab === "courses" ? "New Course" : 
             activeTab === "batches" ? "New Batch" : 
             "New Branch"}
          </Button>
        }
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses" className="mt-6">
          <DataTable 
            columns={courseColumns} 
            data={courses} 
            searchColumn="name"
            searchPlaceholder="Search courses..."
          />
        </TabsContent>
        
        <TabsContent value="batches" className="mt-6">
          <DataTable 
            columns={batchColumns} 
            data={batches} 
            searchColumn="name"
            searchPlaceholder="Search batches..."
          />
        </TabsContent>
        
        <TabsContent value="branches" className="mt-6">
          <DataTable 
            columns={branchColumns} 
            data={branches} 
            searchColumn="name"
            searchPlaceholder="Search branches..."
          />
        </TabsContent>
      </Tabs>
      
      {/* Create Course Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Add a new course to Jazzrockers. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...courseForm}>
            <form onSubmit={courseForm.handleSubmit(onCreateCourseSubmit)} className="space-y-4">
              <FormField
                control={courseForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Piano Basics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={courseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter course description" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={courseForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="dance">Dance</SelectItem>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="finearts">Fine Arts</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={courseForm.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee (Per month)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter course fee" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={courseForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (weeks)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter duration in weeks" 
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Create Course</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Create Batch Dialog */}
      <Dialog open={isCreateBatchDialogOpen} onOpenChange={setIsCreateBatchDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>
              Add a new batch to an existing course. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...batchForm}>
            <form onSubmit={batchForm.handleSubmit(onCreateBatchSubmit)} className="space-y-4 py-4">
              <FormField
                control={batchForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Morning Batch 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={batchForm.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={batchForm.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={batchForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={batchForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={batchForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" defaultValue="17:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={batchForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" defaultValue="18:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                
              <FormField
                control={batchForm.control}
                name="daysOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days of Week</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select days" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Mon,Thu">Monday, Thursday</SelectItem>
                          <SelectItem value="Tue,Fri">Tuesday, Friday</SelectItem>
                          <SelectItem value="Wed,Sat">Wednesday, Saturday</SelectItem>
                          <SelectItem value="Sat,Sun">Saturday, Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={batchForm.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Room 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={batchForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter capacity" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={batchForm.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.name}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={batchForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dance">Dance</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="finearts">Fine Arts</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={batchForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit">Create Batch</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Create Branch Dialog */}
      <Dialog open={isCreateBranchDialogOpen} onOpenChange={setIsCreateBranchDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
            <DialogDescription>
              Add a new branch to Jazzrockers. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...branchForm}>
            <form onSubmit={branchForm.handleSubmit(onCreateBranchSubmit)} className="space-y-4">
              <FormField
                control={branchForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Al Nahda Branch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={branchForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Al Nahda, Dubai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={branchForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +971 4 1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={branchForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. alnahda@jazzrockers.com" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={branchForm.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} value={field.value ?? ""}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={branchForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Create Branch</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditCourseSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Piano Basics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter course description" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="dance">Dance</SelectItem>
                          <SelectItem value="art">Art</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee (Per month)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter course fee" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (weeks)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter duration in weeks" 
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Course Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 border border-red-100 bg-red-50 rounded-md">
            <p className="text-sm text-red-500">
              Warning: Deleting this course will remove all associated data including batches, enrollments, and attendance records.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteCourse}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Branch Dialog */}
      <Dialog open={isEditBranchDialogOpen} onOpenChange={setIsEditBranchDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...branchForm}>
            <form onSubmit={branchForm.handleSubmit(onEditBranchSubmit)} className="space-y-4">
              <FormField
                control={branchForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Al Nahda Branch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={branchForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Al Nahda, Dubai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={branchForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +971 4 1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={branchForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. alnahda@jazzrockers.com" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={branchForm.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={branchForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Branch Confirmation Dialog */}
      <Dialog open={isDeleteBranchDialogOpen} onOpenChange={setIsDeleteBranchDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this branch? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 border border-red-100 bg-red-50 rounded-md">
            <p className="text-sm text-red-500">
              Warning: Deleting this branch will remove all associated data including batches, enrollments, and attendance records.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteBranchDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteBranch}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Batch Dialog */}
      <Dialog open={isEditBatchDialogOpen} onOpenChange={setIsEditBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Edit the batch details below
            </DialogDescription>
          </DialogHeader>
          
          <Form {...batchForm}>
            <form onSubmit={batchForm.handleSubmit(onEditBatchSubmit)} className="space-y-4">
              <FormField
                control={batchForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                {/* <Button variant="outline" onClick={() => setIsEditBatchDialogOpen(false)}>Cancel</Button> */}
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Batch Dialog */}
      <Dialog open={isDeleteBatchDialogOpen} onOpenChange={setIsDeleteBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this batch? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteBatchDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteBatch}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
