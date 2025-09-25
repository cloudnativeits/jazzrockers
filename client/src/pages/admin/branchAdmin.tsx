import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import ReactSelect from "react-select";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { Course, Employee, Schedule, Studio } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, PlusCircle, Trash2, Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formatTimeTo12Hour } from "@/lib/utils";

// Brand Schema
const brandFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

// Department Schema
const departmentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brandId: z.number().min(1, "Brand is required"),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

// Schedule Schema
const scheduleFormSchema = z.object({
  day: z.string().min(1, "At least one day must be selected"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

// Form schema
const courseFormSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  brandId: z.number().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  fee: z.number().min(1, "Fee must be greater than 0"),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

// Form schema for batch
const batchFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  courseId: z.number().min(1, "Course is required"),
  perDayValue: z.number({
    required_error: "Per day value is required",
    invalid_type_error: "Per day value must be a number",
  }).min(0.01, "Per day value must be at least 0.01"),
  teacherId: z.number().min(1, "Teacher is required"),
  startDate: z
    .string()
    .min(1, "Start date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  endDate: z
    .string()
    .refine(
      (val) => val === "" || !isNaN(Date.parse(val)),
      "Invalid date format"
    )
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  schedules: z
    .array(
      z.object({
        day: z.string().min(1, "Day is required"),
        startTime: z
          .string()
          .min(1, "Start time is required")
          .refine(isValidTime, "Invalid time format"), // Add time validation
        endTime: z
          .string()
          .min(1, "End time is required")
          .refine(isValidTime, "Invalid time format"), // Add time validation
        duration: z.number().min(1, "Duration must be positive").optional(),
      })
    )
    .min(1, "At least one schedule is required"),
  roomNumber: z.string().optional(),
  capacity: z.number().optional(),
  category: z.string().min(1, "Category is required"),
  branch: z.string().min(1, "Branch is required"),
  status: z.enum(["active", "completed", "cancelled"]).default("active"),
});

// Helper function for time validation
function isValidTime(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time); // HH:MM format
}

type BatchFormValues = z.infer<typeof batchFormSchema>;

// Form schema for branch
const branchFormSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  brandIds: z.array(z.number()).min(1, "At least one brand is required"),
  phone: z.string().min(1, "Phone is required"),
  manager: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

// Form schema for transportationMode
const transportationModeFormSchema = z.object({
  mode: z.string().min(1, "Mode is required"),
  rate: z.number().min(1, "Rate must be greater than 0"),
  perDayValue: z.number({
    required_error: "Per day value is required",
    invalid_type_error: "Per day value must be a number",
  }).min(0.01, "Per day value must be at least 0.01"),
});

type TransportationModeFormValues = z.infer<
  typeof transportationModeFormSchema
>;

const studioFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  description: z.string().optional(),
});

type studioSchemaType = z.infer<typeof studioFormSchema>;

export default function BranchAdmin() {
  const [activeTab, setActiveTab] = useState("batches");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateBatchDialogOpen, setIsCreateBatchDialogOpen] = useState(false);
  const [isCreateBranchDialogOpen, setIsCreateBranchDialogOpen] =
    useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [isEditBranchDialogOpen, setIsEditBranchDialogOpen] = useState(false);
  const [isDeleteBranchDialogOpen, setIsDeleteBranchDialogOpen] =
    useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [isEditBatchDialogOpen, setIsEditBatchDialogOpen] = useState(false);
  const [isDeleteBatchDialogOpen, setIsDeleteBatchDialogOpen] = useState(false);
  const [isCreateDepartmentDialogOpen, setIsCreateDepartmentDialogOpen] =
    useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [isEditDepartmentDialogOpen, setIsEditDepartmentDialogOpen] =
    useState(false);
  const [isDeleteDepartmentDialogOpen, setIsDeleteDepartmentDialogOpen] =
    useState(false);
  const [isCreateScheduleDialogOpen, setIsCreateScheduleDialogOpen] =
    useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [isEditScheduleDialogOpen, setIsEditScheduleDialogOpen] =
    useState(false);
  const [isDeleteScheduleDialogOpen, setIsDeleteScheduleDialogOpen] =
    useState(false);
  const [selectedDepartmentForBatch, setSelectedDepartmentForBatch] = useState<
    number | null
  >(null);
  const [
    isCreateTransportationDialogOpen,
    setIsCreateTransportationDialogOpen,
  ] = useState(false);
  const [isEditTransportationDialogOpen, setIsEditTransportationDialogOpen] =
    useState(false);
  const [
    isDeleteTransportationDialogOpen,
    setIsDeleteTransportationDialogOpen,
  ] = useState(false);
  const [selectedTransportationMode, setSelectedTransportationMode] =
    useState<TransportationModeRow | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<any>(null);

  const [isStudioDialogOpen, setIsStudioDialogOpen] = useState<{
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  }>({
    create: false,
    update: false,
    delete: false,
  });
  const [isCreateBrandDialogOpen, setIsCreateBrandDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [isEditBrandDialogOpen, setIsEditBrandDialogOpen] = useState(false);
  const [isDeleteBrandDialogOpen, setIsDeleteBrandDialogOpen] = useState(false);

  const { toast } = useToast();

  const [filters, setFilters] = useState({
    name: "",
    brandId: "",
    courseId: "",
    perDayValue: "",
    branch: "",
    category: "",
    day: "",
    startTime: "",
    endTime: "",
    duration: "",
    teacherId: "",
    roomNumber: "",
    capacity: "",
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const calculateDuration = (index: number) => {
    const schedules = batchForm.getValues("schedules");
    const { startTime, endTime } = schedules[index];

    if (!startTime || !endTime) return;

    const startDate = new Date(`2000-01-01T${startTime}`);
    const endDate = new Date(`2000-01-01T${endTime}`);

    const diffMs = endDate.getTime() - startDate.getTime();

    // In hours
    // const durationHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    // In minutes
    const durationMinutes = Math.round(diffMs / (1000 * 60));

    schedules[index].duration = durationMinutes;
    batchForm.setValue("schedules", schedules);
    // batchForm.setValue("duration", durationMinutes);
  };
  const calculateDurationForEditBatch = (index: number) => {
    const schedules = editBatchForm.getValues("schedules");
    const { startTime, endTime } = schedules[index];

    if (!startTime || !endTime) return;

    const startDate = new Date(`2000-01-01T${startTime}`);
    const endDate = new Date(`2000-01-01T${endTime}`);

    const diffMs = endDate.getTime() - startDate.getTime();

    // In hours
    // const durationHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    // In minutes
    const durationMinutes = Math.round(diffMs / (1000 * 60));

    schedules[index].duration = durationMinutes;
    editBatchForm.setValue("schedules", schedules);
    // batchForm.setValue("duration", durationMinutes);
  };

  // const studios = [
  //   { id: 1, name: "Studio 1" },
  //   { id: 2, name: "Studio 2" },
  //   { id: 3, name: "Studio 3" },
  //   { id: 4, name: "Studio 4" },
  //   { id: 5, name: "Studio 5" },
  //   { id: 6, name: "Studio 6" },
  //   { id: 7, name: "Studio 7" },
  //   { id: 8, name: "Studio 8" },
  //   { id: 9, name: "Studio 9" },
  //   { id: 10, name: "Studio 10" },
  // ];

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: brands = [], isLoading: isLoadingBrands } = useQuery<any[]>({
    queryKey: ["/api/brands"],
  });

  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery<
    any[]
  >({
    queryKey: ["/api/departments"],
  });

  const { data: schedules = [], isLoading: isLoadingSchedules } = useQuery<
    any[]
  >({
    queryKey: ["/api/schedules"],
  });

  const { data: batches = [], isLoading: isLoadingBatches } = useQuery<any[]>({
    queryKey: ["/api/batches"],
  });

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<
    Employee[]
  >({
    queryKey: ["/api/employees"],
  });

  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<any[]>(
    {
      queryKey: ["/api/branches"],
    }
  );

  const { data: studiosData = [], isLoading: isLoadingStudios } = useQuery<
    any[]
  >({
    queryKey: ["/api/studio"],
  });

  const { data: transportations = [], isLoading: isLoadingTransportations } =
    useQuery<any[]>({
      queryKey: ["/api/transportationModes"],
    });

  // Filter only active teachers
  const teachers = employees.filter(
    (employee: any) =>
      employee.position === "teacher" && employee.status === "active"
  );

  const getSchedule = (batchId: number) => {
    const schedule = schedules.filter((s: Schedule) => s.batchId === batchId);
    return schedule.map((s: Schedule) => ({
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
    }));
  };

  const batchStrength: React.FC<{ row: any }> = ({ row }) => {
    const [count, setCount] = React.useState<number | null>(null);
  
    React.useEffect(() => {
      const batchId = row.original.id;
      fetch(`/api/student-count?batchId=${batchId}`)
        .then(res => res.json())
        .then(data => setCount(data.studentCount))
        .catch(() => setCount(0));
    }, [row.original.id]);
  
    return (
      <div style={{ textAlign: "center" }}>
        {count !== null ? count : "Loading..."}
      </div>
    );
  };  

  // Brand form
  const brandForm = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const editBrandForm = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  //Departments form
  const departmentForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      brandId: 0,
      description: "",
    },
  });

  const editDepartmentForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      brandId: 0,
      description: "",
    },
  });

  //Schedule form
  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      day: "",
      startTime: "",
      endTime: "",
    },
  });

  const editScheduleForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      day: "",
      startTime: "",
      endTime: "",
    },
  });

  // Course form
  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: "",
      name: "",
      brandId: 0,
      category: "music",
      fee: 0,
    },
  });

  // Edit Course form
  const editForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: "",
      name: "",
      brandId: 0,
      category: "",
      fee: 0,
    },
  });

  // Batch form
  const batchForm = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      courseId: 0,
      teacherId: 0,
      perDayValue: 0.00,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      schedules: [
        {
          day: "",
          startTime: "",
          endTime: "",
          duration: 0,
        },
      ],
      roomNumber: "",
      capacity: 0,
      category: "dance",
      branch: "",
      status: "active",
    },
  });

  const editBatchForm = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      courseId: 0,
      teacherId: 0,
      perDayValue: 0.00,
      startDate: "",
      endDate: "",
      schedules: [
        {
          day: "",
          startTime: "",
          endTime: "",
          duration: 0,
        },
      ],
      roomNumber: "",
      capacity: 0,
      category: "dance",
      branch: "",
      status: "active",
    },
  });

  // Transportation form
  const transportationModeForm = useForm<TransportationModeFormValues>({
    resolver: zodResolver(transportationModeFormSchema),
    defaultValues: {
      mode: "",
      rate: 0,
      perDayValue: 0.00,
    },
  });

  //Studio form
  const studioForm = useForm<studioSchemaType>({
    resolver: zodResolver(studioFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Helper function to generate batch name preview
  const generateBatchName = (
    branchCode: string,
    courseCode: string,
    serialNumber: number
  ) => {
    return `${branchCode.toUpperCase()}${courseCode.toUpperCase()}${serialNumber
      .toString()
      .padStart(4, "0")}`;
  };

  useEffect(() => {
    const courseId = batchForm.watch("courseId");
    const branchId = batchForm.watch("branch");

    if (courseId && branchId) {
      const course = courses.find((c) => c.id === Number(courseId));
      const branch = branches.find((b) => b.name === branchId);

      if (course && branch) {
        const existingBatches = batches.filter(
          (batch) =>
            batch.branch === branchId && batch.courseId === Number(courseId)
        );

        const serialNumbers = existingBatches.map((batch) => {
          const match = batch.name.match(/\d+$/);
          return match ? parseInt(match[0], 10) : 0;
        });

        const highestSerial =
          serialNumbers.length > 0 ? Math.max(...serialNumbers) : 1000;

        const nextSerial = highestSerial + 1;
        const batchName = generateBatchName(
          branch.code,
          course.code,
          nextSerial
        );

        batchForm.setValue("name", batchName);
      }
    }
  }, [
    batchForm.watch("courseId"),
    batchForm.watch("branch"),
    courses,
    branches,
  ]);

  // Branch form
  const branchForm = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      code: "",
      name: "",
      phone: "",
      manager: "",
      brandIds: [],
      status: "active",
    },
  });

  // Brand table columns
  const brandColumns: ColumnDef<any>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ table, row }) => {
        const sortedRows = table.getSortedRowModel().rows;
        const index = sortedRows.findIndex((r) => r.id === row.id);
        return <div>{index + 1}</div>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Brand Name
            {column.getIsSorted() === "asc"
              ? " ↑"
              : column.getIsSorted() === "desc"
                ? " ↓"
                : ""}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.name || "";
        const b = rowB.original.name || "";
        return b.localeCompare(a);
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div>{row.getValue("description")}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const brand = row.original;

        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
              onClick={() => handleEditBrand(brand)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white bg-red-600 hover:bg-red-300"
              onClick={() => handleDeleteBrand(brand)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  //Department table columns
  const departmentColumns: ColumnDef<any>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ row }) => <div>{row.index + 1}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Department
            {column.getIsSorted() === "asc"
              ? " ↑"
              : column.getIsSorted() === "desc"
                ? " ↓"
                : ""}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.name || "";
        const b = rowB.original.name || "";
        return b.localeCompare(a);
      },
    },
    {
      accessorKey: "brandId",
      header: "Brand",
      cell: ({ row }) => {
        const brandId = row.getValue("brandId") as number;
        const brand = brands.find((brand) => brand.id === brandId);
        return brand ? <div>{brand.name}</div> : "Unknown Brand";
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div>{row.getValue("description")}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const department = row.original;

        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
              onClick={() => handleEditDepartment(department)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white bg-red-600 hover:bg-red-300"
              onClick={() => handleDeleteDepartment(department)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // Schedule table columns
  const scheduleColumns: ColumnDef<Schedule>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ row }) => <div>{row.index + 1}</div>,
    },
    {
      accessorKey: "day",
      header: "Day",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("day")}</div>
      ),
    },
    {
      accessorKey: "startTime",
      header: "Start Time",
      cell: ({ row }) => {
        const time = new Date(`1970-01-01T${row.getValue("startTime")}`);
        const formattedTime = time.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return <div className="font-medium">{formattedTime}</div>;
      },
    },
    {
      accessorKey: "endTime",
      header: "End Time",
      cell: ({ row }) => {
        const time = new Date(`1970-01-01T${row.getValue("endTime")}`);
        const formattedTime = time.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return <div className="font-medium">{formattedTime}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
            onClick={() => handleEditSchedule(row.original)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white bg-red-600 hover:bg-red-300"
            onClick={() => handleDeleteSchedule(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // STUDIO TABLE COLUMNS
  const studioColumns: ColumnDef<Studio>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ row }) => <div>{row.index + 1}</div>,
    },
    // {
    //   accessorKey: "name",
    //   header: "Name",
    //   cell: ({ row }) => (
    //     <div className="font-medium">{row.getValue("name")}</div>
    //   ),
    // },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            {column.getIsSorted() === "asc"
              ? " ↑"
              : column.getIsSorted() === "desc"
                ? " ↓"
                : ""}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium" >{row.getValue("name")}</div>
      ),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.name || "";
        const b = rowB.original.name || "";
        return b.localeCompare(a);
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div>{row.getValue("description")}</div>
      ),
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
            onClick={() => handleEditStudio(row.original)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white bg-red-600 hover:bg-red-300"
            onClick={() => handleDeleteStudio(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Course table columns
  const courseColumns: ColumnDef<Course>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ table, row }) => {
        const sortedRows = table.getSortedRowModel().rows;
        const index = sortedRows.findIndex((r) => r.id === row.id);
        return <div>{index + 1}</div>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Course Code
            {column.getIsSorted() === "asc"
              ? " ↑"
              : column.getIsSorted() === "desc"
                ? " ↓"
                : ""}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium" >{row.getValue("code")}</div>
      ),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.code || "";
        const b = rowB.original.code || "";
        return b.localeCompare(a);
      },
    },
    {
      accessorKey: "name",
      header: "Course Name",
      cell: ({ row }) => (
        <div>{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "brandId",
      header: "Brand",
      cell: ({ row }) => {
        const brandId = row.getValue("brandId") as number;
        const brand = brands.find((brand) => brand.id === brandId);
        return brand ? <div>{brand.name}</div> : "Unknown Brand";
      },
    },
    {
      accessorKey: "category",
      header: "Department",
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return <div>{category.charAt(0).toUpperCase() + category.slice(1)}</div>;
      },
    },
    {
      accessorKey: "fee",
      header: "Fee (Per month)",
      cell: ({ row }) => <div>{row.getValue("fee")}</div>,
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
              className="bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
              onClick={() => handleEditCourse(course)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white bg-red-600 hover:bg-red-300"
              onClick={() => handleDeleteCourse(course)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // Batch table columns
  const batchColumns: ColumnDef<any>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ table, row }) => {
        const sortedRows = table.getSortedRowModel().rows;
        const index = sortedRows.findIndex((r) => r.id === row.id);
        return <div style={{ textAlign: "center" }}>{index + 1}</div>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Batch Name
            {column.getIsSorted() === "asc"
              ? " ↑"
              : column.getIsSorted() === "desc"
                ? " ↓"
                : ""}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.name || "";
        const b = rowB.original.name || "";
        return b.localeCompare(a);
      },
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => (
        <div>{row.getValue("branch")}</div>
      ),
    },
    {
      accessorKey: "category",
      header: "Department",
      cell: ({ row }) => {
        const departmentId = parseInt(row.getValue("category") as string);
        const department = departments.find((d: any) => d.id === departmentId);
        return department ? department.name : "Unknown Department";
      },
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
    // {
    //   accessorKey: "schedules",
    //   header: "Schedule",
    //   cell: ({ row }) => {
    //     const schedule = row.original;
    //     return getSchedule(schedule.id).map((schedule, index) => (
    //       <div key={index} className={index > 0 ? "mt-1 pt-1 border-t" : ""}>
    //         {schedule.day} - {schedule.startTime} - {schedule.endTime} - {schedule.duration}
    //       </div>
    //     ));
    //   },
    // },
    {
      accessorKey: "day",
      header: "Day",
      cell: ({ row }) => {
        const schedule = row.original;
        return getSchedule(schedule.id).map((s, index) => (
          <div key={index} className={index > 0 ? "mt-1 pt-1 border-t" : ""}>
            {s.day}
          </div>
        ));
      },
    },
    {
      accessorKey: "startTime",
      header: "Start Time",
      cell: ({ row }) => {
        const schedule = row.original;
        return getSchedule(schedule.id).map((s, index) => (
          <div key={index} className={index > 0 ? "mt-1 pt-1 border-t" : ""}>
            {formatTimeTo12Hour(s.startTime)}
          </div>
        ));
      },
    },
    {
      accessorKey: "endTime",
      header: "End Time",
      cell: ({ row }) => {
        const schedule = row.original;
        return getSchedule(schedule.id).map((s, index) => (
          <div key={index} className={index > 0 ? "mt-1 pt-1 border-t" : ""}>
            {formatTimeTo12Hour(s.endTime)}
          </div>
        ));
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const schedule = row.original;
        return getSchedule(schedule.id).map((s, index) => (
          <div key={index} className={index > 0 ? "mt-1 pt-1 border-t" : ""}>
            {s.duration} mins
          </div>
        ));
      },
    },
    {
      accessorKey: "teacherId",
      header: "Teacher",
      cell: ({ row }) => {
        const teacherId = row.getValue("teacherId") as number;
        const employee = employees.find((e: Employee) => e.id === teacherId);
        return employee ? employee.firstName + " " + employee.middleName + " " + employee.lastName : "Unknown Teacher";
      },
    },
    // {
    //   accessorKey: "roomNumber",
    //   header: "Studio",
    //   cell: ({ row }) => {
    //     const studioName = row.getValue("roomNumber");
    //     const studio = studios.find(
    //       (s) => s.id.toString() === studioName?.toString()
    //     );
    //     return studio ? studio.name : studioName;
    //   },
    // },
    {
      accessorKey: "capacity",
      header: "Strength",
      cell: batchStrength
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let badgeVariant: "default" | "destructive" | "outline" | "secondary" =
          "outline";

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
              className="bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
              onClick={() => handleEditBatch(batch)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white bg-red-600 hover:bg-red-300"
              onClick={() => handleDeleteBatch(batch)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // Branch table columns
  const branchColumns: ColumnDef<any>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ table, row }) => {
        const sortedRows = table.getSortedRowModel().rows;
        const index = sortedRows.findIndex((r) => r.id === row.id);
        return <div>{index + 1}</div>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Branch Code
            {column.getIsSorted() === "asc"
              ? " ↑"
              : column.getIsSorted() === "desc"
                ? " ↓"
                : ""}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("code")}</div>
      ),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.code || "";
        const b = rowB.original.code || "";
        return b.localeCompare(a);
      },
    },
    {
      accessorKey: "name",
      header: "Branch Name",
      cell: ({ row }) => (
        <div>{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "brandIds",
      header: "Brands",
      cell: ({ row }) => {
        const branchBrandIds = row.getValue("brandIds") as number[];
        if (!branchBrandIds || !Array.isArray(branchBrandIds) || branchBrandIds.length === 0) return "-";
        const branchBrands = brands.filter(brand => branchBrandIds.includes(brand.id));
        return branchBrands.map(b => b.name).join(", ");
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
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
        const badgeClass =
          status === "active"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
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
              className="bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
              onClick={() => handleEditBranch(branch)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white bg-red-600 hover:bg-red-300"
              onClick={() => handleDeleteBranch(branch)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // Transportation table columns
  interface TransportationModeRow {
    id: number;
    mode: string;
    rate: number;
    perDayValue: number;
  }

  const transportationModeColumns: ColumnDef<TransportationModeRow>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ row }: { row: { index: number } }) => <div>{row.index + 1}</div>,
    },
    {
      accessorKey: "mode",
      header: ({ column }) => {
        return (
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Transportation Mode
            {column.getIsSorted() === "asc"
              ? " ↑"
              : column.getIsSorted() === "desc"
                ? " ↓"
                : ""}
          </div>
        );
      },
      cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
        <div className="font-medium">{row.getValue("mode")}</div>
      ),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.mode || "";
        const b = rowB.original.mode || "";
        return b.localeCompare(a);
      },
    },
    {
      accessorKey: "rate",
      header: "Rate",
      cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
        <div>{row.getValue("rate")}</div>
      ),
    },
    {
      accessorKey: "perDayValue",
      header: "Per Day Value",
      cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
        <div>{row.getValue("perDayValue")}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: TransportationModeRow } }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
            onClick={() => handleEditTransportationMode(row.original)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white bg-red-600 hover:bg-red-300"
            onClick={() => handleDeleteTransportationMode(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Submit Create Brand
  const onCreateBrandSubmit = async (data: BrandFormValues) => {
    try {
      const response = await apiRequest("POST", "/api/brands", data);
      await queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      setIsCreateBrandDialogOpen(false);
      brandForm.reset();
      toast({
        title: "Brand created",
        description: "The brand has been created successfully.",
      });
    } catch (error: any) {
      console.error("Brand creation error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Submit Edit Brand
  const onEditBrandSubmit = async (data: BrandFormValues) => {
    if (!selectedBrand) return;
    try {
      await apiRequest("PUT", `/api/brands/${selectedBrand.id}`, data);
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      setIsEditBrandDialogOpen(false);
      setSelectedBrand(null);
      toast({
        title: "Brand updated",
        description: "The brand has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Brand update error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditBrand = (brand: any) => {
    setSelectedBrand(brand);
    editBrandForm.reset({
      name: brand.name,
      description: brand.description || "",
    });
    setIsEditBrandDialogOpen(true);
  };

  const handleDeleteBrand = (brand: any) => {
    setSelectedBrand(brand);
    setIsDeleteBrandDialogOpen(true);
  };

  // Delete Brand
  const deleteBrand = async () => {
    if (!selectedBrand) return;
    try {
      await apiRequest("DELETE", `/api/brands/${selectedBrand.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      setIsDeleteBrandDialogOpen(false);
      setSelectedBrand(null);
      toast({
        title: "Brand deleted",
        description: "The brand has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Brand delete error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  //Submit Create Department
  const onCreateDepartmentSubmit = async (data: DepartmentFormValues) => {
    try {
      const response = await apiRequest("POST", "/api/departments", data);
      await queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsCreateDepartmentDialogOpen(false);
      departmentForm.reset();
      toast({
        title: "Department created",
        description: "The department has been created successfully.",
      });
    } catch (error: any) {
      console.error("Department creation error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Submit edit department form
  const onEditDepartmentSubmit = async (data: DepartmentFormValues) => {
    if (!selectedDepartment) return;
    try {
      await apiRequest(
        "PUT",
        `/api/departments/${selectedDepartment.id}`,
        data
      );
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsEditDepartmentDialogOpen(false);
      setSelectedDepartment(null);
      toast({
        title: "Department updated",
        description: "The department has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditDepartment = (department: any) => {
    setSelectedDepartment(department);
    editDepartmentForm.reset({
      name: department.name,
      brandId: department.brandId,
      description: department.description || "",
    });
    setIsEditDepartmentDialogOpen(true);
  };

  const handleDeleteDepartment = (department: any) => {
    setSelectedDepartment(department);
    setIsDeleteDepartmentDialogOpen(true);
  };

  const handleDeleteDepartmentSubmit = async () => {
    if (!selectedDepartment) return;
    try {
      await apiRequest("DELETE", `/api/departments/${selectedDepartment.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsDeleteDepartmentDialogOpen(false);
      setSelectedDepartment(null);
      toast({
        title: "Department deleted",
        description: "The department has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  //Submit Create Schedule
  const onCreateScheduleSubmit = async (data: ScheduleFormValues) => {
    try {
      const response = await apiRequest("POST", "/api/schedules", data);
      await queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsCreateScheduleDialogOpen(false);
      scheduleForm.reset();
      toast({
        title: "Success",
        description: "Schedule created successfully.",
      });
    } catch (error: any) {
      console.error("Schedule creation error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  //handle edit schedule
  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    editScheduleForm.reset({
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
    setIsEditScheduleDialogOpen(true);
  };

  const onEditScheduleSubmit = async (data: ScheduleFormValues) => {
    if (!selectedSchedule) return;
    try {
      await apiRequest("PUT", `/api/schedules/${selectedSchedule.id}`, data);
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsEditScheduleDialogOpen(false);
      setSelectedSchedule(null);
      toast({
        title: "Schedule updated",
        description: "The schedule has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSchedule = async () => {
    if (!selectedSchedule) return;
    try {
      await apiRequest("DELETE", `/api/schedules/${selectedSchedule.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsDeleteScheduleDialogOpen(false);
      setSelectedSchedule(null);
      toast({
        title: "Schedule deleted",
        description: "The schedule has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  //handle delete schedule
  const handleDeleteSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteScheduleDialogOpen(true);
  };

  // Handle edit course
  const handleEditCourse = (course: Course) => {
    const department = departments.find(
      (d) =>
        d.name.trim().toLowerCase() === course.category.trim().toLowerCase()
    );

    editForm.reset({
      code: course.code,
      name: course.name,
      brandId: course.brandId,
      category: course.category,
      fee: Number(course.fee),
    });

    setSelectedCourse(course);
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
  const handleCreateBatch = async (data: BatchFormValues) => {
    try {
      // First create the batch
      const batchResponse = await apiRequest("POST", "/api/batches", {
        name: data.name,
        courseId: data.courseId,
        perDayValue: data.perDayValue,
        teacherId: data.teacherId,
        startDate: data.startDate,
        endDate: data.endDate || null, // Convert empty to null
        roomNumber: data.roomNumber || null,
        capacity: data.capacity,
        category: data.category,
        branch: data.branch,
        status: data.status,
      });

      if (!batchResponse.ok) throw new Error("Batch creation failed");
      const batchData = await batchResponse.json();

      // Then create schedules for each day

      // for (const schedule of data.schedules) {
      //   await apiRequest("POST", "/api/schedules", {
      //     batchId: batchData.id,
      //     ...schedule,
      //   });
      // }
      const schedulePromises = data.schedules.map((schedule) =>
        apiRequest("POST", "/api/schedules", {
          batchId: batchData.id,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          duration: schedule.duration,
        })
      );

      const scheduleResults = await Promise.all(schedulePromises);
      const failedSchedules = scheduleResults.filter((r) => !r.ok);

      if (failedSchedules.length > 0) {
        throw new Error(`${failedSchedules.length} schedules failed to create`);
      }

      // Invalidate queries and reset form
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/batches"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/schedules"] }),
      ]);
      setIsCreateBatchDialogOpen(false);
      batchForm.reset();
      toast({
        title: "Success",
        description: "Batch created successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive",
      });
    }
  };

  // Create transportation submit handler
  const onCreateTransportationModeSubmit = async (
    data: TransportationModeFormValues
  ) => {
    try {
      const response = await apiRequest("POST", "/api/transportationMode", {
        mode: data.mode,
        rate: Number(data.rate),
        perDayValue: Number(data.perDayValue),
      });
      await queryClient.invalidateQueries({
        queryKey: ["/api/transportationModes"],
      });
      setIsCreateTransportationDialogOpen(false);
      transportationModeForm.reset();
      toast({
        title: "Success",
        description: "Transportation mode created successfully",
      });
    } catch (error) {
      console.error("Transportation mode creation error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create transportation mode",
        variant: "destructive",
      });
    }
  };

  // Create branch submit handler
  const onCreateBranchSubmit = async (data: BranchFormValues) => {
    try {
      const branchResponse = await apiRequest("POST", "/api/branches", data);
      if (!branchResponse.ok) throw new Error("Branch creation failed");
      const branchData = await branchResponse.json();

      const brandAssociationPromises = data.brandIds.map((brandId) =>
        apiRequest("POST", "/api/branch_brands", {
          branchId: branchData.id,
          brandId,
        })
      );

      const results = await Promise.all(brandAssociationPromises);
      const failed = results.filter((res) => !res.ok);

      if (failed.length > 0) {
        await apiRequest("DELETE", `/api/branches/${branchData.id}`);
        throw new Error(`${failed.length} brand associations failed`);
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setIsCreateBranchDialogOpen(false);
      branchForm.reset();
      toast({
        title: "Success",
        description: "Branch created successfully",
      });
    } catch (error) {
      console.error("Branch creation error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create branch",
        variant: "destructive",
      });
    }
  };

  // Edit branch submit handler
  const onEditBranchSubmit = async (data: BranchFormValues) => {
    if (!selectedBranch) return;

    try {
      // 1. Update branch details
      const branchResponse = await apiRequest("PUT", `/api/branches/${selectedBranch.id}`, {
        code: data.code,
        name: data.name,
        phone: data.phone,
        manager: data.manager,
        status: data.status
      });
      
      if (!branchResponse.ok) throw new Error("Branch update failed");

      // 2. Delete existing brand associations
      await apiRequest("DELETE", `/api/branch_brands/${selectedBranch.id}`);

      // 3. Create new brand associations
      const brandAssociationPromises = data.brandIds.map((brandId) =>
        apiRequest("POST", "/api/branch_brands", {
          branchId: selectedBranch.id,
          brandId,
        })
      );

      const results = await Promise.all(brandAssociationPromises);
      const failed = results.filter((res) => !res.ok);

      if (failed.length > 0) {
        throw new Error(`${failed.length} brand associations failed`);
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setIsEditBranchDialogOpen(false);
      setSelectedBranch(null);
      toast({
        title: "Branch updated",
        description: "The branch has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Branch update error:", error);
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
      code: branch.code,
      name: branch.name,
      phone: branch.phone,
      manager: branch.manager || "",
      brandIds: branch.brandIds || [],
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
      const response = await apiRequest(
        "DELETE",
        `/api/branches/${selectedBranch.id}`
      );
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

  const toHHMM = (time: string) => time?.slice(0, 5) || "";

  // Handle edit batch
  const handleEditBatch = (batch: any) => {
    setSelectedBatch(batch);
    editBatchForm.reset({
      name: batch.name,
      courseId: batch.courseId,
      perDayValue: Number(batch.perDayValue),
      teacherId: batch.teacherId,
      startDate: batch.startDate,
      endDate: batch.endDate,
      schedules: batch.schedules.map((s: any) => ({
        day: s.day,
        startTime: toHHMM(s.startTime),
        endTime: toHHMM(s.endTime),
        duration: s.duration,
      })),
      roomNumber: batch.roomNumber,
      capacity: batch.capacity,
      category: batch.category,
      branch: batch.branch,
      status: batch.status,
    });
    setIsEditBatchDialogOpen(true);
  };

  // Handle delete batch
  const handleDeleteBatch = (batch: any) => {
    setSelectedBatch(batch);
    setIsDeleteBatchDialogOpen(true);
  };

  // Edit batch submit handler
  const handleUpdateBatch = async (batch: BatchFormValues) => {
    try {
      if (!selectedBatch?.id) return;

      // Update batch details
      const batchResponse = await apiRequest(
        "PUT",
        `/api/batches/${selectedBatch.id}`,
        {
          name: batch.name,
          courseId: batch.courseId,
          perDayValue: batch.perDayValue,
          teacherId: batch.teacherId,
          startDate: batch.startDate,
          endDate: batch.endDate || null,
          roomNumber: batch.roomNumber || null,
          capacity: batch.capacity,
          category: batch.category,
          branch: batch.branch,
          status: batch.status,
        }
      );

      if (!batchResponse.ok) throw new Error("Batch updation failed");
      const batchData = await batchResponse.json();
      const deleteResponse = await apiRequest(
        "DELETE",
        `/api/batch/schedules/${batchData.id}`
      );
      if (!deleteResponse.ok) throw new Error("Failed to delete old schedules");

      const schedulePromises = batch.schedules.map((schedule) =>
        apiRequest("POST", "/api/schedules", {
          batchId: selectedBatch.id,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          duration: schedule.duration,
        })
      );

      const scheduleResults = await Promise.all(schedulePromises);
      const failedSchedules = scheduleResults.filter((r: any) => !r.ok);

      if (failedSchedules.length > 0) {
        throw new Error(`${failedSchedules.length} schedules failed to create`);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/batches"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/schedules"] }),
      ]);
      setIsEditBatchDialogOpen(false);
      editBatchForm.reset();

      toast({
        title: "Success",
        description: "Batch updated successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update batch",
        variant: "destructive",
      });
    }
  };

  // Delete batch
  const deleteBatch = async () => {
    if (!selectedBatch) return;

    try {
      const response = await apiRequest(
        "DELETE",
        `/api/batches/${selectedBatch.id}`
      );
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

  // handle create studio
  const handleCreateStudio = async (data: studioSchemaType) => {
    try {
      await apiRequest("POST", "/api/studio", data);
      await queryClient.invalidateQueries({ queryKey: ["/api/studio"] });
      setIsStudioDialogOpen({ create: false, update: false, delete: false });
      studioForm.reset();
      toast({
        title: "Success",
        description: "Studio created successfully",
      });
    } catch (error) {
      console.error("studio creation error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create studio",
        variant: "destructive",
      });
    }
  };

  //handle edit studio
  const handleEditStudio = (studio: Studio) => {
    setSelectedStudio(studio);
    studioForm.reset({
      name: studio.name,
      description: studio.description,
    });
    setIsStudioDialogOpen({ create: false, update: true, delete: false });
  };

  const onEditStudioSubmit = async (data: studioSchemaType) => {
    if (!selectedStudio) return;

    try {
      const response = await apiRequest(
        "PUT",
        `/api/studio/${selectedStudio.id}`,
        data
      );
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/studio"] });
        setIsStudioDialogOpen({ create: false, update: false, delete: false });
        setSelectedStudio(null);
        toast({
          title: "Studio updated",
          description: "The studio has been updated successfully.",
        });
      } else {
        throw new Error("Failed to update studio");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudio = (studio: Studio) => {
    setSelectedStudio(studio);
    setIsStudioDialogOpen({ delete: true, create: false, update: false });
  };

  //  Delete branch
  const deleteStudio = async () => {
    if (!selectedStudio) return;

    try {
      const response = await apiRequest(
        "DELETE",
        `/api/studio/${selectedStudio.id}`
      );
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/studio"] });
        setIsStudioDialogOpen({ create: false, update: false, delete: false });
        setSelectedStudio(null);
        toast({
          title: "Studio deleted",
          description: "The studio has been deleted successfully.",
        });
      } else {
        throw new Error("Failed to delete studio");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredCourses = useMemo(() => {
    if (!selectedDepartmentForBatch) return courses;
    const selectedDept = departments.find(
      (dept) => dept.id === selectedDepartmentForBatch
    );
    if (!selectedDept) return courses;
    return courses.filter((course) => {
      if (!course.category) return false;

      const normalizeString = (str: string) => {
        return str.toLowerCase().replace(/[-\s]/g, "");
      };

      const normalizedCategory = normalizeString(course.category);
      const normalizedDeptName = normalizeString(selectedDept.name);

      return normalizedCategory === normalizedDeptName;
    });
  }, [courses, selectedDepartmentForBatch, departments]);

  const handleEditTransportationMode = (
    transportationMode: TransportationModeRow
  ) => {
    setSelectedTransportationMode(transportationMode);
    transportationModeForm.reset({
      mode: transportationMode.mode,
      rate: transportationMode.rate,
      perDayValue: transportationMode.perDayValue,
    });
    setIsEditTransportationDialogOpen(true);
  };

  const handleDeleteTransportationMode = (
    transportationMode: TransportationModeRow
  ) => {
    setSelectedTransportationMode(transportationMode);
    setIsDeleteTransportationDialogOpen(true);
  };

  // Delete transportation mode
  const deleteTransportationMode = async () => {
    if (!selectedTransportationMode) return;
    try {
      await apiRequest(
        "DELETE",
        `/api/transportationMode/${selectedTransportationMode.id}`
      );
      queryClient.invalidateQueries({ queryKey: ["/api/transportationModes"] });
      setIsDeleteTransportationDialogOpen(false);
      setSelectedTransportationMode(null);
      toast({
        title: "Transportation mode deleted",
        description: "Transportation mode deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onEditTransportationModeSubmit = async (
    data: TransportationModeFormValues
  ) => {
    if (!selectedTransportationMode) return;

    try {
      const response = await apiRequest(
        "PUT",
        `/api/transportationMode/${selectedTransportationMode.id}`,
        {
          mode: data.mode,
          rate: Number(data.rate),
          perDayValue: Number(data.perDayValue),
        }
      );
      await queryClient.invalidateQueries({
        queryKey: ["/api/transportationModes"],
      });
      setIsEditTransportationDialogOpen(false);
      transportationModeForm.reset();
      setSelectedTransportationMode(null);
      toast({
        title: "Success",
        description: "Transportation mode updated successfully",
      });
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update transportation mode",
        variant: "destructive",
      });
    }
  };

  // Search Filter---

  // const filteredData = batches.filter((item) => {
  //   const course = courses.find((c) => c.id === item.courseId)?.name || "";
  //   const teacher = employees.find((e) => e.id === item.teacherId)?.fullName || "";
  //   const studio = studios.find((s) => s.id.toString() === item.roomNumber?.toString())?.name || "";
  //   const schedule = getSchedule(item.id);

  //   return (
  //     item.name.toLowerCase().includes(filters.name.toLowerCase()) &&
  //     course.toLowerCase().includes(filters.courseId.toLowerCase()) &&
  //     schedule.some((s) => s.day.toLowerCase().includes(filters.day.toLowerCase())) &&
  //     schedule.some((s) => s.startTime.toLowerCase().includes(filters.startTime.toLowerCase())) &&
  //     schedule.some((s) => s.endTime.toLowerCase().includes(filters.endTime.toLowerCase())) &&
  //     teacher.toLowerCase().includes(filters.teacherId.toLowerCase()) &&
  //     studio.toLowerCase().includes(filters.roomNumber.toLowerCase()) &&
  //     item.capacity.toString().includes(filters.capacity)
  //   );
  // });  
  
  // Select Filter
  const filteredData = batches.filter((batch) => {
    const schedules = getSchedule(batch.id);
    const selectedBranch = branches.find((b) => b.id.toString() === filters.branch)?.name;
    const course = courses.find((c) => c.id === batch.courseId);
    const derivedBrandId = course?.brandId?.toString() || null;

    const matchesBrand = !filters.brandId || derivedBrandId === filters.brandId;
    
    const matchesBranch =
      !filters.branch || batch.branch === selectedBranch;

    const matchesCourse =
      !filters.courseId || batch.courseId === Number(filters.courseId);

    const matchesTeacher =
      !filters.teacherId || batch.teacherId === Number(filters.teacherId);

    const matchesDepartment =
      !filters.category || batch.category === filters.category;

    const matchesDay =
      !filters.day || schedules.some((s) => s.day === filters.day);

    const matchesRoom =
      !filters.roomNumber || batch.roomNumber?.toString() === filters.roomNumber;

    const matchesName =
      !filters.name || batch.name.toLowerCase().includes(filters.name.toLowerCase());

    const matchesStartTime =
      !filters.startTime || schedules.some((s) => s.startTime === filters.startTime);

    const matchesEndTime =
      !filters.endTime || schedules.some((s) => s.endTime === filters.endTime);

    return (
      matchesBrand &&
      matchesBranch &&
      matchesCourse &&
      matchesDepartment &&
      matchesTeacher &&
      matchesDay &&
      matchesRoom &&
      matchesName &&
      matchesStartTime &&
      matchesEndTime
    );
  });

  return (
    <AppShell>
      <PageHeader
        title="Branch Admin"
        description="Manage Branch Admin"
        actions={
          <Button
            onClick={() => {
              if (activeTab === "courses") {
                setIsCreateDialogOpen(true);
              } else if (activeTab === "batches") {
                setIsCreateBatchDialogOpen(true);
              } else if (activeTab === "branches") {
                setIsCreateBranchDialogOpen(true);
              } else if (activeTab === "departments") {
                setIsCreateDepartmentDialogOpen(true);
              } else if (activeTab === "brands") {
                setIsCreateBrandDialogOpen(true);
              } else if (activeTab === "schedules") {
                setIsCreateScheduleDialogOpen(true);
              } else if (activeTab === "transportation") {
                setIsCreateTransportationDialogOpen(true);
              } else if (activeTab === "studio") {
                setIsStudioDialogOpen({ create: true });
              }
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {activeTab === "courses"
              ? "New Course"
              : activeTab === "batches"
                ? "New Batch"
                // : activeTab === "schedules"
                //   ? "New Schedule"
                  : activeTab === "transportation"
                    ? "New Transportation"
                    : activeTab === "brands"
                    ? "New Brand"
                    : activeTab === "departments"
                      ? "New Department"
                      : activeTab === "studio"
                        ? "New Studio"
                        : "New Branch"}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="studio">Studio</TabsTrigger>
          <TabsTrigger value="transportation">Transportation</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          {/* <TabsTrigger value="schedules">Schedules</TabsTrigger> */}
          
        </TabsList>

        <TabsContent value="brands" className="mt-6">
          <DataTable
            columns={brandColumns}
            data={brands}
            searchColumns={["name"]}
            searchPlaceholder="Search by brands..."
            initialSorting={[{ id: "name", desc: true }]}
          />
        </TabsContent>
          
        <TabsContent value="departments" className="mt-6">
          <DataTable
            columns={departmentColumns}
            data={departments}
            searchColumns={["name"]}
            searchPlaceholder="Search by departments..."
            initialSorting={[{ id: "name", desc: true }]}
          />
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <DataTable
            columns={courseColumns}
            data={courses}
            searchColumns={["name", "code", "category", "fee", "brandId"]}
            searchPlaceholder="Search by course..."
            initialSorting={[{ id: "code", desc: true }]}
          />
        </TabsContent>

        <TabsContent value="batches" className="mt-6">
          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <input
              className="border px-2 py-1 text-sm"
              placeholder="Filter by name"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
            <input
              className="border px-2 py-1 text-sm"
              placeholder="Filter by course"
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
            />
            <input
              className="border px-2 py-1 text-sm"
              placeholder="Filter by day"
              value={filters.day}
              onChange={(e) => setFilters({ ...filters, day: e.target.value })}
            />
            <input
              className="border px-2 py-1 text-sm"
              placeholder="Filter by start time"
              value={filters.startTime}
              onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
            />
            <input
              className="border px-2 py-1 text-sm"
              placeholder="Filter by end time"
              value={filters.endTime}
              onChange={(e) => setFilters({ ...filters, endTime: e.target.value })}
            />
            <input
              className="border px-2 py-1 text-sm"
              placeholder="Filter by teacher"
              value={filters.teacherId}
              onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}
            />
            <input
              className="border px-2 py-1 text-sm"
              placeholder="Filter by studio"
              value={filters.roomNumber}
              onChange={(e) => setFilters({ ...filters, roomNumber: e.target.value })}
            />
            <input
              className="border px-2 py-1 text-sm"
              placeholder="Filter by capacity"
              value={filters.capacity}
              onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}
            />
          </div> */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-2">
            {/* Batch Name Filter */}
            {/* <select
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="border px-2 py-1 text-sm rounded-lg h-10 px-2 text-base"
            >
              <option value="">All Batch Names</option>
              {[...new Set(batches.map((b) => b.name))].map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select> */}
            <ReactSelect
              value={filters.name ? { label: filters.name, value: filters.name } : null}
              onChange={(selectedOption) =>
                setFilters({ ...filters, name: selectedOption?.value || "" })
              }
              options={[
                { label: "All Batches", value: "" },
                ...[...new Set(batches.map((b) => b.name))].map((name) => ({
                  label: name,
                  value: name,
                })),
              ]}
              isClearable
              placeholder="Select Batch"
              className="w-full text-sm"
            />

            {/* <select
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              className="border px-2 py-1 text-sm rounded-lg h-10 px-2 text-base"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select> */}

            <ReactSelect
              value={
                filters.brandId
                  ? {
                      label: brands.find((b) => b.id.toString() === filters.brandId)?.name,
                      value: filters.brandId,
                    }
                  : null
              }
              onChange={(selectedOption) =>
                setFilters({ ...filters, brandId: selectedOption?.value || "" })
              }
              options={[
                { label: "All Brands", value: "" },
                ...brands.map((b) => ({
                  label: b.name,
                  value: b.id.toString(),
                })),
              ]}
              isClearable
              placeholder="Select Brand"
              className="w-full text-sm"
            />

            <ReactSelect
              value={
                filters.branch
                  ? {
                      label: branches.find((b) => b.id.toString() === filters.branch)?.name,
                      value: filters.branch,
                    }
                  : null
              }
              onChange={(selectedOption) =>
                setFilters({ ...filters, branch: selectedOption?.value || "" })
              }
              options={[
                { label: "All Branches", value: "" },
                ...branches.map((b) => ({
                  label: b.name,
                  value: b.id.toString(),
                })),
              ]}
              isClearable
              placeholder="Select Branch"
              className="w-full text-sm"
            />

            {/* Category Filter */}
            <ReactSelect
              value={filters.category ? { label: departments.find((c) => c.id === Number(filters.category))?.name, value: filters.category } : null}
              onChange={(selectedOption) =>
                setFilters({ ...filters, category: selectedOption?.value || "" })
              }
              options={[
                { label: "All Departments", value: "" },
                ...departments.map((c) => ({
                  label: c.name,
                  value: c.id.toString(),
                })),
              ]}
              isClearable
              placeholder="Select Department"
              className="w-full text-sm"
            />

            {/* Course Filter */}
            {/* <select
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
              className="border px-2 py-1 text-sm rounded-lg h-10 px-2 text-base"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select> */}
            <ReactSelect
              value={filters.courseId ? { label: courses.find((c) => c.id === Number(filters.courseId))?.name, value: filters.courseId } : null}
              onChange={(selectedOption) =>
                setFilters({ ...filters, courseId: selectedOption?.value || "" })
              }
              options={[
                { label: "All Courses", value: "" },
                ...courses.map((c) => ({
                  label: c.name,
                  value: c.id.toString(),
                })),
              ]}
              isClearable
              placeholder="Select Course"
              className="w-full text-sm"
            />

            {/* Teacher Filter */}
            {/* <select
              value={filters.teacherId}
              onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}
              className="border px-2 py-1 text-sm rounded-lg h-10 px-2 text-base"
            >
              <option value="">All Teachers</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </select> */}
            <ReactSelect
              value={filters.teacherId ? { label: employees.find((e) => e.id === Number(filters.teacherId))?.firstName + " " + employees.find((e) => e.id === Number(filters.teacherId))?.middleName + " " + employees.find((e) => e.id === Number(filters.teacherId))?.lastName, value: filters.teacherId } : null}
              onChange={(selectedOption) =>
                setFilters({ ...filters, teacherId: selectedOption?.value || "" })
              }
              options={[
                { label: "All Teachers", value: "" },
                ...employees.map((e) => ({
                  label: e.firstName + " " + e.middleName + " " + e.lastName,
                  value: e.id.toString(),
                })),
              ]}
              isClearable
              placeholder="Select Teacher"
              className="w-full text-sm"
            />

            {/* Day Filter */}
            {/* <select
              value={filters.day}
              onChange={(e) => setFilters({ ...filters, day: e.target.value })}
              className="border px-2 py-1 text-sm rounded-lg h-10 px-2 text-base"
            >
              <option value="">All Days</option>
              {[...new Set(batches.flatMap((b) => getSchedule(b.id).map((s) => s.day)))].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select> */}
            <ReactSelect
              value={filters.day ? { label: filters.day, value: filters.day } : null}
              onChange={(selectedOption) =>
                setFilters({ ...filters, day: selectedOption?.value || "" })
              }
              options={[
                { label: "All Days", value: "" },
                ...[...new Set(batches.flatMap((b) => getSchedule(b.id).map((s) => s.day)))].map((day) => ({
                  label: day,
                  value: day,
                })),
              ]}
              isClearable
              placeholder="Select Day"
              className="w-full text-sm"
            />

            {/* Studio Filter */}
            {/* <select
              value={filters.roomNumber}
              onChange={(e) => setFilters({ ...filters, roomNumber: e.target.value })}
              className="border px-2 py-1 text-sm rounded-lg h-10 px-2 text-base"
            >
              <option value="">All Studios</option>
              {studios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select> */}

            {/* Start Time Filter */}
            {/* <select
              value={filters.startTime}
              onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
              className="border px-2 py-1 text-sm rounded-lg h-10 px-2 text-base"
            >
              <option value="">All Start Times</option>
              {[...new Set(
                batches.flatMap((b) =>
                  getSchedule(b.id).map((s) => s.startTime)
                )
              )].map((time) => (
                <option key={time} value={time}>
                  {formatTimeTo12Hour(time)}
                </option>
              ))}
            </select> */}

            {/* End Time Filter */}
            {/* <select
              value={filters.endTime}
              onChange={(e) => setFilters({ ...filters, endTime: e.target.value })}
              className="border px-2 py-1 text-sm rounded-lg h-10 px-2 text-base"
            >
              <option value="">All End Times</option>
              {[...new Set(
                batches.flatMap((b) =>
                  getSchedule(b.id).map((s) => s.endTime)
                )
              )].map((time) => (
                <option key={time} value={time}>
                  {formatTimeTo12Hour(time)}
                </option>
              ))}
            </select> */}
          </div>
          <DataTable
            columns={batchColumns}
            data={filteredData}
            // searchColumns={["name","category","course","teacher","schedules","roomNumber", "branch"]}
            searchPlaceholder="Search by batch name, departments, courses, teacher, schedule, studio..."
            initialSorting={[{ id: "name", desc: true }]}
          />
        </TabsContent>

        <TabsContent value="branches" className="mt-6">
          <DataTable
            columns={branchColumns}
            data={branches}
            searchColumns={["name", "code", "manager"]}
            searchPlaceholder="Search branches..."
            initialSorting={[{ id: "code", desc: true }]}
          />
        </TabsContent>

        <TabsContent value="schedules" className="mt-6">
          <DataTable
            columns={scheduleColumns}
            data={schedules}
            searchColumns={["day"]}
            searchPlaceholder="Search schedules..."
          />
        </TabsContent>

        <TabsContent value="transportation" className="mt-6">
          <DataTable
            columns={transportationModeColumns}
            data={transportations}
            searchColumns={["mode", "rate"]}
            searchPlaceholder="Search transportation modes..."
            initialSorting={[{ id: "mode", desc: true }]}
          />
        </TabsContent>

        <TabsContent value="studio" className="mt-6">
          <DataTable
            columns={studioColumns}
            data={studiosData}
            searchColumns={["name"]}
            searchPlaceholder="Search Studio..."
            initialSorting={[{ id: "name", desc: true }]}
          />
        </TabsContent>
      </Tabs>

      {/* Create Brand Dialog */}
      <Dialog
        open={isCreateBrandDialogOpen}
        onOpenChange={(open) => {
          setIsCreateBrandDialogOpen(open);
          if (!open) {
            brandForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Brand</DialogTitle>
            <DialogDescription>
              Add a new brand to jazzrockers. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <Form {...brandForm}>
            <form
              onSubmit={brandForm.handleSubmit(onCreateBrandSubmit)}
              className="space-y-4"
            >
              <FormField
                control={brandForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={brandForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Create Brand</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Brand Dialog  */}
      <Dialog
        open={isEditBrandDialogOpen}
        onOpenChange={setIsEditBrandDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>
              Edit a brand in jazzrockers. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <Form {...editBrandForm}>
            <form
              onSubmit={editBrandForm.handleSubmit(onEditBrandSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editBrandForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editBrandForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        {...field}
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

      {/* Delete Brand Dialog */}
      <Dialog
        open={isDeleteBrandDialogOpen}
        onOpenChange={setIsDeleteBrandDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this brand? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteBrandDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={deleteBrand}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Department Dialog */}
      <Dialog
        open={isCreateDepartmentDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDepartmentDialogOpen(open);
          if (!open) {
            departmentForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
            <DialogDescription>
              Add a new department to jazzrockers. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <Form {...departmentForm}>
            <form
              onSubmit={departmentForm.handleSubmit(onCreateDepartmentSubmit)}
              className="space-y-4"
            >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={departmentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={departmentForm.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select
                      onValueChange={value => field.onChange(Number(value))}
                      value={field.value?.toString() ?? ''}
                    >
                      <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>                
              <FormField
                control={departmentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Create Department</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog
        open={isEditDepartmentDialogOpen}
        onOpenChange={setIsEditDepartmentDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Edit the department details below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...editDepartmentForm}>
            <form
              onSubmit={editDepartmentForm.handleSubmit(onEditDepartmentSubmit)}
            >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={editDepartmentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editDepartmentForm.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Brand</FormLabel>
                    <Select
                      onValueChange={value => field.onChange(Number(value))}
                      value={field.value?.toString() ?? ""}
                    >
                      <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
              <FormField
                control={editDepartmentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        {...field}
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

      {/* Delete Department Dialog */}
      <Dialog
        open={isDeleteDepartmentDialogOpen}
        onOpenChange={setIsDeleteDepartmentDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this department? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDepartmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartmentSubmit}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Course Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          courseForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Add a new course to jazzrockers. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <Form {...courseForm}>
            <form
              onSubmit={courseForm.handleSubmit(onCreateCourseSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={courseForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={courseForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={courseForm.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <Select
                        onValueChange={value => field.onChange(Number(value))}
                        value={field.value?.toString() ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id.toString()}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          {departments.map((department) => (
                            <SelectItem
                              key={department.id}
                              value={department.name}
                            >
                              {department.name}
                            </SelectItem>
                          ))}
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
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit">Create Course</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Batch Dialog */}
      <Dialog
        open={isCreateBatchDialogOpen}
        onOpenChange={(open) => {
          setIsCreateBatchDialogOpen(open);
          if (!open) {
            batchForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>
                Add a new batch to an existing course. Click save when you're
                done.
              </DialogDescription>
            </div>
            <div className="flex items-center w-1/3">
              <Label
                htmlFor="batchName"
                className="whitespace-nowrap font-semibold text-lg"
              >
                Batch Name :
              </Label>
              <div
                id="batchName"
                className="flex-1 px-3 py-2 text-gray-700 font-bold"
              >
                {batchForm.watch("name")}
              </div>
            </div>
          </DialogHeader>

          <Form {...batchForm}>
            <form
              onSubmit={batchForm.handleSubmit(handleCreateBatch)}
              className="space-y-4 py-4"
            >
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={batchForm.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedDepartmentForBatch(parseInt(value));
                          // batchForm.setValue('courseId', '');
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem
                              key={department.id}
                              value={department.id.toString()}
                            >
                              {department.name}
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
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value?.toString()}
                        disabled={!selectedDepartmentForBatch}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                selectedDepartmentForBatch
                                  ? "Select a course"
                                  : "Please select a department first"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredCourses.map((course) => (
                            <SelectItem
                              key={course.id}
                              value={course.id.toString()}
                            >
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
                  name="perDayValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Per Day Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? undefined : parseFloat(val));
                          }}
                        />
                      </FormControl>
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
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem
                              key={teacher.id}
                              value={teacher.id.toString()}
                            >
                              {teacher.firstName + " " + teacher.middleName + " " + teacher.lastName}
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
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
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
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={batchForm.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Studio</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Studio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studiosData.map((studio) => (
                            <SelectItem
                              key={studio.id}
                              value={studio.id.toString()}
                            >
                              {studio.name}
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
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strength</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter strength"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={batchForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
              <div className="space-y-1">
                <FormField
                  control={batchForm.control}
                  name="schedules"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-2">
                          <Label>Schedule</Label>
                          <div className="flex items-end gap-4 w-full mb-2">
                            <div className="flex-1 text-sm font-medium">
                              Select Day
                            </div>
                            <div className="flex-1 text-sm font-medium">
                              Start Time
                            </div>
                            <div className="flex-1 text-sm font-medium">
                              End Time
                            </div>
                            <div className="flex-1 text-sm font-medium">
                              Duration (In Mins)
                            </div>
                            <div className="w-10" />
                          </div>
                          <div className="space-y-4">
                            {batchForm
                              .watch("schedules")
                              ?.map((schedule, index) => (
                                <div
                                  key={index}
                                  className="flex items-end gap-4 w-full"
                                >
                                  <div className="flex-1 space-y-1">
                                    <Select
                                      value={schedule.day}
                                      onValueChange={(value) => {
                                        const schedules = [
                                          ...batchForm.getValues("schedules"),
                                        ];
                                        schedules[index].day = value;
                                        batchForm.setValue(
                                          "schedules",
                                          schedules
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select day" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {daysOfWeek.map((day) => (
                                          <SelectItem key={day} value={day}>
                                            {day}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <input
                                      type="time"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      value={schedule.startTime}
                                      onChange={(e) => {
                                        const schedules = [
                                          ...batchForm.getValues("schedules"),
                                        ];
                                        schedules[index].startTime =
                                          e.target.value;
                                        batchForm.setValue(
                                          "schedules",
                                          schedules
                                        );
                                        calculateDuration(index);
                                      }}
                                    />
                                  </div>

                                  <div className="flex-1 space-y-1">
                                    <input
                                      type="time"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      value={schedule.endTime}
                                      onChange={(e) => {
                                        const schedules = [
                                          ...batchForm.getValues("schedules"),
                                        ];
                                        schedules[index].endTime =
                                          e.target.value;
                                        batchForm.setValue(
                                          "schedules",
                                          schedules
                                        );
                                        calculateDuration(index);
                                      }}
                                    />
                                  </div>

                                  <div className="flex-1 space-y-1">
                                    <Input
                                      type="number"
                                      readOnly
                                      value={schedule.duration ?? ""}
                                      className="w-full"
                                    />
                                  </div>

                                  <div className="w-10 flex-shrink-0">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => {
                                        const schedules = batchForm
                                          .getValues("schedules")
                                          .filter((_, i) => i !== index);
                                        batchForm.setValue(
                                          "schedules",
                                          schedules
                                        );
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const schedules = [
                                  ...(batchForm.getValues("schedules") || []),
                                ];
                                schedules.push({
                                  day: "",
                                  startTime: "",
                                  endTime: "",
                                  duration: 0,
                                });
                                batchForm.setValue("schedules", schedules);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add Schedule
                            </Button>
                          </div>
                        </div>
                      </FormControl>
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
      <Dialog
        open={isCreateBranchDialogOpen}
        onOpenChange={(open) => {
          setIsCreateBranchDialogOpen(open);
          if (!open) {
            branchForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
            <DialogDescription>
              Add a new branch to jazzrockers. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <Form {...branchForm}>
            <form
              onSubmit={branchForm.handleSubmit(onCreateBranchSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={branchForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="brandIds"
                  render={({ field }) => {
                    // const selectedIds = field.value || [];
                    const selectedIds = Array.isArray(field.value) ? field.value : [];
                    return (
                      <FormItem>
                        <FormLabel>Brands</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {selectedIds.length
                                ? brands
                                    .filter((brand) => selectedIds.includes(brand.id))
                                    .map((brand) => brand.name)
                                    .join(", ")
                                : "Select brands"}
                              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-2 max-h-60 overflow-auto">
                            {brands.map((brand) => {
                              const isChecked = selectedIds.includes(brand.id);
                              return (
                                <div
                                  key={brand.id}
                                  className="flex items-center space-x-2 cursor-pointer py-1"
                                  onClick={() => {
                                    const newValue = isChecked
                                      ? selectedIds.filter((id: number) => id !== brand.id)
                                      : [...selectedIds, brand.id];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <Checkbox checked={isChecked} />
                                  <span>{brand.name}</span>
                                </div>
                              );
                            })}
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                {/* <FormField
                  control={branchForm.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <Select
                        onValueChange={value => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id.toString()}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
                <FormField
                  control={branchForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input
                          {...field}
                          value={field.value ?? ""}
                        />
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
              </div>
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
            <form
              onSubmit={editForm.handleSubmit(onEditCourseSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <Select
                        onValueChange={value => field.onChange(Number(value))}
                        value={field.value?.toString() ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id.toString()}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem
                              key={department.id}
                              value={department.name}
                            >
                              {department.name}
                            </SelectItem>
                          ))}
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
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
              Are you sure you want to delete this course? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 border border-red-100 bg-red-50 rounded-md">
            <p className="text-sm text-red-500">
              Warning: Deleting this course will remove all associated data
              including batches, enrollments, and attendance records.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteCourse}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog
        open={isEditBranchDialogOpen}
        onOpenChange={setIsEditBranchDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <Form {...branchForm}>
            <form
              onSubmit={branchForm.handleSubmit(onEditBranchSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={branchForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="brandIds"
                  render={({ field }) => {
                    // Convert field value to array of numbers
                    const selectedIds = Array.isArray(field.value) ? field.value.map(Number) : [];
                    return (
                      <FormItem>
                        <FormLabel>Brands</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {selectedIds.length
                                ? brands
                                    .filter((brand) => selectedIds.includes(brand.id))
                                    .map((brand) => brand.name)
                                    .join(", ")
                                : "Select brands"}
                              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-2 max-h-60 overflow-auto">
                            {brands.map((brand) => {
                              const isChecked = selectedIds.includes(brand.id);
                              return (
                                <div
                                  key={brand.id}
                                  className="flex items-center space-x-2 cursor-pointer py-1"
                                  onClick={() => {
                                    const newValue = isChecked
                                      ? selectedIds.filter((id) => id !== brand.id)
                                      : [...selectedIds, brand.id];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <Checkbox checked={isChecked} />
                                  <span>{brand.name}</span>
                                </div>
                              );
                            })}
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={branchForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* <FormField
                  control={branchForm.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <Select
                        onValueChange={value => field.onChange(Number(value))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem
                              key={brand.id}
                              value={String(brand.id)}
                            >
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
                <FormField
                  control={branchForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
              </div>

              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirmation Dialog */}
      <Dialog
        open={isDeleteBranchDialogOpen}
        onOpenChange={setIsDeleteBranchDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this branch? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 border border-red-100 bg-red-50 rounded-md">
            <p className="text-sm text-red-500">
              Warning: Deleting this branch will remove all associated data
              including batches, enrollments, and attendance records.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteBranchDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteBranch}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Batch Dialog */}
      {/* <Dialog open={isEditBatchDialogOpen} onOpenChange={setIsEditBatchDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Edit the batch details below. Click save when done.
            </DialogDescription>
          </DialogHeader>

          <Form {...editBatchForm}>
            <form onSubmit={editBatchForm.handleSubmit(onEditBatchSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editBatchForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Batch Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBatchForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map((department) => (
                            <SelectItem key={department.id} value={department.id.toString()}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBatchForm.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Branch</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches?.map((branch) => (
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
                  control={editBatchForm.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Course</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses?.map((course) => (
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
                  control={editBatchForm.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Teacher</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers?.map((teacher) => (
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

                <FormField
                  control={editBatchForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editBatchForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBatchForm.control}
                  name="schedules"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Schedule</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Select
                            onValueChange={(value) => {
                              const currentValues = field.value ? field.value.split(',') : [];
                              const valueSet = new Set(currentValues);
                              
                              if (valueSet.has(value)) {
                                valueSet.delete(value);
                              } else {
                                valueSet.add(value);
                              }
                              
                              field.onChange(Array.from(valueSet).join(','));
                            }}
                            value={field.value?.split(',')[0] || ''}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                {field.value ? 
                                  <span className="text-sm">
                                    {field.value.split(',').join(', ')}
                                  </span>
                                  : 
                                  <SelectValue placeholder="Select schedules" />
                                }
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {schedules.map((schedule) => (
                                <SelectItem 
                                  key={schedule.id} 
                                  value={schedule.day}
                                  className="flex items-center space-x-2"
                                >
                                  <div className="flex items-center">
                                    <Checkbox 
                                      checked={field.value?.split(',').includes(schedule.day)}
                                      className="mr-2"
                                    />
                                    <span>
                                      {schedule.day} ({formatTimeTo12Hour(schedule.startTime)} - {formatTimeTo12Hour(schedule.endTime)})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBatchForm.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Studio</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Studio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studios?.map((studio) => (
                            <SelectItem key={studio.id} value={studio.id.toString()}>
                              {studio.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBatchForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter batch capacity"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editBatchForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="mb-4">
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
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog> */}

      <Dialog
        open={isEditBatchDialogOpen}
        onOpenChange={setIsEditBatchDialogOpen}
      >
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <DialogTitle>Edit Batch</DialogTitle>
              <DialogDescription>
                Edit an existing batch. Click save when you're
                done.
              </DialogDescription>
            </div>
            <div className="flex items-center w-1/3">
              <Label
                htmlFor="batchName"
                className="whitespace-nowrap font-semibold text-lg"
              >
                Batch Name :
              </Label>
              <div
                id="batchName"
                className="flex-1 px-3 py-2 text-gray-700 font-bold"
              >
                {editBatchForm.watch("name")}
              </div>
            </div>
          </DialogHeader>

          <Form {...{ ...editBatchForm }}>
            <form
              onSubmit={editBatchForm.handleSubmit(handleUpdateBatch)}
              className="space-y-4 py-4"
            >
              <div className="grid grid-cols-4 gap-4">
                {/* <FormField
                  control={batchForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Auto-generated" readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
                <FormField
                  control={editBatchForm.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                  control={editBatchForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedDepartmentForBatch(parseInt(value));
                          // batchForm.setValue('courseId', '');
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem
                              key={department.id}
                              value={department.id.toString()}
                            >
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBatchForm.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value?.toString()}
                        disabled={!selectedDepartmentForBatch}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                selectedDepartmentForBatch
                                  ? "Select a course"
                                  : "Please select a department first"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredCourses.map((course) => (
                            <SelectItem
                              key={course.id}
                              value={course.id.toString()}
                            >
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
                  control={editBatchForm.control}
                  name="perDayValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Per Day Value</FormLabel>
                      <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          // If empty, clear the field
                          if (val === "") {
                            field.onChange(undefined);
                          } else {
                            const parsed = parseFloat(val);
                            field.onChange(isNaN(parsed) ? undefined : parsed);
                          }
                        }}
                      />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBatchForm.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem
                              key={teacher.id}
                              value={teacher.id.toString()}
                            >
                              {teacher.firstName + " " + teacher.middleName + " " + teacher.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editBatchForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editBatchForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editBatchForm.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Studio</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Studio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studiosData.map((studio) => (
                            <SelectItem
                              key={studio.id}
                              value={studio.id.toString()}
                            >
                              {studio.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBatchForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strength</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter strength"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
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
                /> */}
                <FormField
                  control={editBatchForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
              <div className="space-y-1">
                <FormField
                  control={editBatchForm.control}
                  name="schedules"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-2">
                          <Label>Schedule</Label>
                          <div className="flex items-end gap-4 w-full mb-2">
                            <div className="flex-1 text-sm font-medium">
                              Select Day
                            </div>
                            <div className="flex-1 text-sm font-medium">
                              Start Time
                            </div>
                            <div className="flex-1 text-sm font-medium">
                              End Time
                            </div>
                            <div className="flex-1 text-sm font-medium">
                              Duration (In Mins)
                            </div>
                            <div className="w-10" />
                          </div>
                          <div className="space-y-4">
                            {editBatchForm
                              .watch("schedules")
                              ?.map((schedule, index) => (
                                <div
                                  key={index}
                                  className="flex items-end gap-4 w-full"
                                >
                                  <div className="flex-1 space-y-1">
                                    <Select
                                      value={schedule.day}
                                      onValueChange={(value) => {
                                        const schedules = [
                                          ...editBatchForm.getValues(
                                            "schedules"
                                          ),
                                        ];
                                        schedules[index].day = value;
                                        editBatchForm.setValue(
                                          "schedules",
                                          schedules
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select day" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {daysOfWeek.map((day) => (
                                          <SelectItem key={day} value={day}>
                                            {day}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <input
                                      type="time"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      value={schedule.startTime}
                                      onChange={(e) => {
                                        const schedules = [
                                          ...editBatchForm.getValues(
                                            "schedules"
                                          ),
                                        ];
                                        schedules[index].startTime =
                                          e.target.value;
                                        editBatchForm.setValue(
                                          "schedules",
                                          schedules
                                        );
                                        calculateDurationForEditBatch(index);
                                      }}
                                    />
                                  </div>

                                  <div className="flex-1 space-y-1">
                                    <input
                                      type="time"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      value={schedule.endTime}
                                      onChange={(e) => {
                                        const schedules = [
                                          ...editBatchForm.getValues(
                                            "schedules"
                                          ),
                                        ];
                                        schedules[index].endTime =
                                          e.target.value;
                                        editBatchForm.setValue(
                                          "schedules",
                                          schedules
                                        );
                                        calculateDurationForEditBatch(index);
                                      }}
                                    />
                                  </div>

                                  <div className="flex-1 space-y-1">
                                    <Input
                                      type="number"
                                      readOnly
                                      value={schedule.duration ?? ""}
                                      className="w-full"
                                    />
                                  </div>

                                  <div className="w-10 flex-shrink-0">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => {
                                        const schedules = editBatchForm
                                          .getValues("schedules")
                                          .filter((_, i) => i !== index);
                                        editBatchForm.setValue(
                                          "schedules",
                                          schedules
                                        );
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const schedules = [
                                  ...(editBatchForm.getValues("schedules") ||
                                    []),
                                ];
                                schedules.push({
                                  day: "",
                                  startTime: "",
                                  endTime: "",
                                  duration: 0,
                                });
                                editBatchForm.setValue("schedules", schedules);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add Schedule
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit">Update Batch</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Batch Dialog */}
      <Dialog
        open={isDeleteBatchDialogOpen}
        onOpenChange={setIsDeleteBatchDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this batch? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteBatchDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteBatch}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog
        open={isCreateScheduleDialogOpen}
        onOpenChange={setIsCreateScheduleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Add new schedule. Click save when done.
            </DialogDescription>
          </DialogHeader>
          <Form {...scheduleForm}>
            <form
              onSubmit={scheduleForm.handleSubmit(onCreateScheduleSubmit)}
              className="space-y-8"
            >
              <FormField
                control={scheduleForm.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Days</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {daysOfWeek.map((day) => (
                          <div
                            key={day}
                            className="flex items-center space-x-2 font-normal"
                          >
                            <Checkbox
                              id={`day-${day}`}
                              checked={field.value.split("-").includes(day)}
                              onCheckedChange={(checked) => {
                                const currentDays = field.value
                                  ? field.value.split("-")
                                  : [];
                                const newDays = checked
                                  ? [...currentDays, day]
                                  : currentDays.filter((d) => d !== day);
                                field.onChange(newDays.join("-"));
                              }}
                            />
                            <label
                              htmlFor={`day-${day}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {day}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Create Schedule</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog
        open={isEditScheduleDialogOpen}
        onOpenChange={setIsEditScheduleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Please enter the new schedule details
            </DialogDescription>
          </DialogHeader>
          <Form {...editScheduleForm}>
            <form
              onSubmit={editScheduleForm.handleSubmit(onEditScheduleSubmit)}
              className="space-y-8"
            >
              <FormField
                control={editScheduleForm.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {daysOfWeek.map((day) => (
                          <div
                            key={day}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`day-${day}`}
                              checked={field.value.split("-").includes(day)}
                              onCheckedChange={(checked) => {
                                const currentDays = field.value
                                  ? field.value.split("-")
                                  : [];
                                const newDays = checked
                                  ? [...currentDays, day]
                                  : currentDays.filter((d) => d !== day);
                                field.onChange(newDays.join("-"));
                              }}
                            />
                            <label
                              htmlFor={`day-${day}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {day}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editScheduleForm.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editScheduleForm.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
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

      {/* Delete Schedule Dialog */}
      <Dialog
        open={isDeleteScheduleDialogOpen}
        onOpenChange={setIsDeleteScheduleDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be
              undone. This will permanently delete the schedule.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteSchedule}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE STUDIO */}
      <Dialog
        open={isStudioDialogOpen.create}
        onOpenChange={(open) => {
          setIsStudioDialogOpen({ create: open });
          if (!open) {
            studioForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Studio</DialogTitle>
            <DialogDescription>
              Add new studio. Click save when done.
            </DialogDescription>
          </DialogHeader>
          <Form {...studioForm}>
            <form
              onSubmit={studioForm.handleSubmit(handleCreateStudio)}
              className="space-y-8"
            >
              <FormField
                control={studioForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Studio Name</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={studioForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Create Studio</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* UPDATE STUDIO */}
      <Dialog
        open={isStudioDialogOpen.update}
        onOpenChange={(open) => {
          setIsStudioDialogOpen({ update: open });
          if (!open) {
            studioForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Studio</DialogTitle>
            <DialogDescription>
              Edit studio. Click save when done.
            </DialogDescription>
          </DialogHeader>
          <Form {...studioForm}>
            <form
              onSubmit={studioForm.handleSubmit(onEditStudioSubmit)}
              className="space-y-8"
            >
              <FormField
                control={studioForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Studio Name</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={studioForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Update Studio</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* DELETE STUIO*/}
      <Dialog
        open={isStudioDialogOpen.delete}
        onOpenChange={() =>
          setIsStudioDialogOpen({ delete: false, update: false, create: false })
        }
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Studio</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this studio? This action cannot be
              undone. This will permanently delete the studio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setIsStudioDialogOpen({
                  delete: false,
                  update: false,
                  create: false,
                })
              }
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteStudio}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Transportation Mode Dialog */}
      <Dialog
        open={isCreateTransportationDialogOpen}
        onOpenChange={(isOpen) => {
          setIsCreateTransportationDialogOpen(isOpen);
          if (!isOpen) {
            transportationModeForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Transportation Mode</DialogTitle>
            <DialogDescription>
              Add a new transportation mode. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...transportationModeForm}>
            <form
              onSubmit={transportationModeForm.handleSubmit(
                onCreateTransportationModeSubmit
              )}
              className="space-y-8"
            >
              <FormField
                control={transportationModeForm.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transportation Name</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
              <FormField
                control={transportationModeForm.control}
                name="rate"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={value || ""}
                        onChange={(e) => onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={transportationModeForm.control}
                name="perDayValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Per Day Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? undefined : parseFloat(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
              />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCreateTransportationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Transportation Mode</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Transportation Mode Dialog */}
      <Dialog
        open={isEditTransportationDialogOpen}
        onOpenChange={(isOpen) => {
          setIsEditTransportationDialogOpen(isOpen);
          if (!isOpen) {
            transportationModeForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transportation Mode</DialogTitle>
            <DialogDescription>
              Edit transportation mode. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...transportationModeForm}>
            <form
              onSubmit={transportationModeForm.handleSubmit(
                onEditTransportationModeSubmit
              )}
              className="space-y-8"
            >
              <FormField
                control={transportationModeForm.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transportation Name</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
              <FormField
                control={transportationModeForm.control}
                name="rate"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={value || ""}
                        onChange={(e) => onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={transportationModeForm.control}
                  name="perDayValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Per Day Value</FormLabel>
                      <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          // If empty, clear the field
                          if (val === "") {
                            field.onChange(undefined);
                          } else {
                            const parsed = parseFloat(val);
                            field.onChange(isNaN(parsed) ? undefined : parsed);
                          }
                        }}
                      />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsEditTransportationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Edit Transportation Mode</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Transportation Mode Dialog */}
      <Dialog
        open={isDeleteTransportationDialogOpen}
        onOpenChange={setIsDeleteTransportationDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Transportation Mode</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transportation mode? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteTransportationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteTransportationMode}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}