import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import ReactSelect from "react-select";
import * as Accordion from '@radix-ui/react-accordion';
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
  ChevronDown,
  KeyRound,
  UserPlus
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Student, InsertStudent, User, Branch, InsertTransportation, inventory, Schedule } from "@shared/schema";
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
import { capitalizeFirstLetter, cn, formatTimeTo12Hour, getStatusColor } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface StudentFormData extends Omit<InsertStudent, 'age' | 'branch' | 'parentId' | 'course'> {
  age?: string;
  baseFee?: string;
  discountType?: string;
  discountFee?: string;
  discountPercentage?: number;
  discountAmount?: number;
  vat?: string;
  vatAmount?: number;
  totalFee?: number;
  transportation?: string;
  transportationMode?: number;
  transportationFee?: string;
  transportDurationMonths?: number;
  pickingPoint?: string;
  droppingPoint?: string;
  contactPerson?: string;
  pickUpTime?: string;
  dropOffTime?: string;
  transportationAddress?: string;
  transportDiscountType?: string;
  transportDiscountValue?: string;
  transportDiscountAmount?: number;
  transportDiscountPercentage?: number;
  course?: number;
  batch?: number;
  branch?: number;
  parentId?: number;
  isReRegistering?: string;
  registrationFee?: string;
  registrationDate?: string;
  accessories?: string;
  items?: string;
  itemFees?: string;
  qty?: number;
  selectStudent?: string;
}

type TableRow = {
  course: string;
  branch: string;
  batch: string;
  baseFee: string;
  monthsOfYear: string[];
  durationMonths: number;
  discountType: string;
  discountValue: string;
  discountAmount: string;
  totalFee: string;
  totalDiscountAmount: string;
};

export default function BranchAdminStudents() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDetailsDialogOpen, setIsPaymentDetailsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState("");
  const [extraDiscount, setExtraDiscount] = useState(0);

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
    status: "active",
    parentId: 0,
    baseFee: "",
    discountFee: "",
    vat: "",
    vatAmount: 0,
    totalFee: 0,
    isReRegistering: "yes",
    registrationFee: "0",
    registrationDate: new Date().toISOString().split('T')[0],
    transportation: "No",
    transportationMode: 0,
    transportationFee: "",
    transportDurationMonths: 1,
    transportationAddress: "",
    pickingPoint: "",
    droppingPoint: "",
    contactPerson: "",
    pickUpTime: "",
    dropOffTime: "",
    accessories: "No",
    items: "",
    itemFees: "",
    qty: 0,
    selectStudent: "",
  });

  // Fetch dependencies first
  const { data: enrollments = [], isSuccess: enrollmentsLoaded } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: courses = [], isSuccess: coursesLoaded } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: batches = [], isSuccess: batchesLoaded } = useQuery<any[]>({
    queryKey: ["/api/batches"],
  });

  const { data: branches = [], isSuccess: branchesLoaded } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: enrollmentsLoaded && coursesLoaded && batchesLoaded && branchesLoaded,
    select: (data) => {
      return data.map(student => {
        const s = student as any;
        const studentEnrollments = enrollments.filter(e => e.studentId === student.id);

        let totalBaseFee = 0;
        const courseDetails = studentEnrollments.map(enrollment => {
          const course = courses.find(c => c.id === Number(enrollment.courseId));
          const batch = batches.find(b => b.id === Number(enrollment.batchId));
          const branch = branches.find(b => b.id === Number(enrollment.branchId));

          if (course) {
            totalBaseFee += Number(course.fee || 0);
          }

          return {
            courseId: enrollment.courseId,
            courseName: course?.name || '',
            batchId: enrollment.batchId,
            batchName: batch?.name || '',
            branchId: enrollment.branchId,
            branchName: branch?.name || '',
            registrationDate: enrollment.registrationDate,
            registrationFee: enrollment.registrationFee,
            enrollmentDate: enrollment.enrollmentDate
          };
        });

        const registrationFee = String(s.registrationFee || 0);
        const discountAmount = s.discountType === 'percentage'
          ? ((totalBaseFee + Number(registrationFee)) * Number(s.discountPercentage || 0)) / 100
          : Number(s.discountAmount || 0);
        const subtotal = (totalBaseFee + Number(registrationFee)) - discountAmount;
        const vatAmount = subtotal * (Number(s.vat || 0) / 100);
        const totalFee = subtotal + vatAmount;

        return {
          ...student,
          enrollments: courseDetails,
          baseFee: totalBaseFee,
          registrationFee: registrationFee,
          discountAmount: discountAmount,
          vatAmount: vatAmount,
          totalFee: totalFee
        };
      });
    }
  });

  const { data: notJoinedStudents = [] } = useQuery<Student[]>({
    queryKey: ["/api/students/not-joined"],
    queryFn: async () => {
      const res = await fetch("/api/students/not-joined");
      return res.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: transportationModes = [] } = useQuery<any[]>({
    queryKey: ["/api/transportationModes"],
  });

  const { data: transportation = [] } = useQuery<any[]>({
    queryKey: ["/api/transportation"],
  });

  const { data: studentInventory = [] } = useQuery<any[]>({
    queryKey: ["/api/studentInventory"],
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: creditNotes = [] } = useQuery<any[]>({
    queryKey: ["/api/creditNotes"],
  });

  const { data: studentPayments = [] } = useQuery<any[]>({
    queryKey: ["/api/studentPayments"],
  });

  const { data: outstandingSummary } = useQuery<{
    total: number;
    paid: number;
    outstandingAmount: number;
    creditAmount: number;
  }>({
    queryKey: ["/api/outstandingSummary", selectedStudent?.id],
    queryFn: async () => {
      const res = await fetch(`/api/outstandingSummary/${selectedStudent?.id}`);
      return res.json();
    },
    enabled: !!selectedStudent?.id,
  });

  const { data: schedules = [], isLoading: isLoadingSchedules } = useQuery<any[]>({
    queryKey: ["/api/schedules"],
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2099 - (currentYear - 10) + 1 }, (_, i) => currentYear - 10 + i);

  const monthsOfYear = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getSchedule = (batchId: number) => {
    const schedule = schedules.filter((s: Schedule) => s.batchId === batchId);
    return schedule.map((s: Schedule) => ({
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
    }));
  };

  // Filter only parent users for dropdown
  const parents = users.filter((user: any) => user.role === "parent");

  // Helper function to get branch name from ID
  const getBranchName = (branchId: string | number) => {
    const branch = branches.find((b: Branch) => b.id === Number(branchId));
    return branch?.code || "";
  };

  // Generate student ID
  const generateStudentId = (branchId: string) => {
    if (!branchId) return "";

    // Get branch name from ID
    const branchName = getBranchName(branchId);
    if (!branchName) return "";

    // Get the branch prefix (first two letters)
    const branchPrefix = branchName.trim().substring(0, 2).toUpperCase();

    // Get existing student IDs for this branch prefix
    const existingIds = students
      ?.filter(student => student.studentId?.toUpperCase().startsWith(branchPrefix))
      .map(student => {
        const numericPart = student.studentId?.substring(2);
        return numericPart ? parseInt(numericPart) : 0;
      })
      .filter(num => !isNaN(num));

    // Start from 1001 if no existing IDs
    let nextNumber = 1001;

    // If there are existing IDs, find the highest and increment
    if (existingIds && existingIds.length > 0) {
      const highestNumber = Math.max(...existingIds);
      nextNumber = highestNumber + 1;
    }

    return `${branchPrefix}${nextNumber}`;
  };

  // Handle branch selection
  const handleBranchChange = (value: number) => {
    // Generate new student ID based on selected branch
    const newStudentId = generateStudentId(value.toString());

    setFormData(prev => ({
      ...prev,
      branch: value,
      studentId: newStudentId
    }));
  };

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

  // Handle first name and last name changes
  // const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   setFormData(prev => {
  //     const newData = { ...prev, [name]: value };

  //     // If both first and last name are present, generate username
  //     if (name === 'firstName' || name === 'lastName') {
  //       if (newData.firstName && newData.lastName) {
  //         newData.username = generateUsername(newData.firstName, newData.lastName);
  //         // Only generate password if it's not already set
  //         if (!newData.password) {
  //           newData.password = generatePassword();
  //         }
  //       }
  //     }

  //     return newData;
  //   });
  // };

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

      // Calculate vat amount when vat changes
      if (field === 'vat' && value && prev.baseFee) {
        const vat = Number(value);
        const baseFee = Number(prev.baseFee);
        updates.vatAmount = (baseFee * vat) / 100;
      }

      // Calculate total fee when basic fee, discount fee, vat amount changes
      if (field === 'baseFee' || field === 'discountFee' || field === 'vatAmount' || field === 'vat' || field === 'registrationFee') {
        const baseFee = Number(prev.baseFee || 0);
        const registrationFee = Number(prev.registrationFee || 0);
        const discountFee = Number(prev.discountFee || 0);
        const vatAmount = field === 'vat'
          ? (baseFee * Number(value || 0)) / 100  // If vat is changing, use new vat value
          : (prev.vatAmount || 0);                // Otherwise use existing vatAmount
        updates.totalFee = baseFee + registrationFee - discountFee + vatAmount;
      }

      return { ...prev, ...updates };
    });
  };

  const studentOptions = notJoinedStudents.map((student) => ({
    value: student.id,
    label: `${student.firstName} ${student.middleName ?? ""} ${student.lastName}`,
    studentData: student, // store full object for quick access
  }));

  const handleSelectChange = (selectedOption: any) => {
    const selectedStudent = selectedOption?.studentData;

    if (selectedStudent) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        ...formData,
        selectStudent: selectedStudent.id.toString(),
        studentId: selectedStudent.studentId || '',
        isReRegistering: selectedStudent.isReRegistering || '',
        registrationFee: selectedStudent.registrationFee || '',
        registrationDate: selectedStudent.registrationDate || today,
        firstName: selectedStudent.firstName || '',
        middleName: selectedStudent.middleName || '',
        lastName: selectedStudent.lastName || '',
        dateOfBirth: selectedStudent.dateOfBirth || null,
        age: selectedStudent.age?.toString() || '',
        gender: selectedStudent.gender || '',
        email: selectedStudent.email || '',
        phone: selectedStudent.phone || '',
        whatsappNo: selectedStudent.whatsappNo || '',
        street: selectedStudent.street || '',
        community: selectedStudent.community || '',
        residenceAddress: selectedStudent.residenceAddress || '',
        flatNo: selectedStudent.flatNo || '',
        parentId: selectedStudent.parentId || 0,
      });
    }
  };

  // Handle course change
  const handleCourseChange = (value: string) => {
    setFormData({
      ...formData,
      course: Number(value),
      batch: undefined, // Reset only batch when course changes
    });
  };

  // Get filtered batches for a specific row
  const getFilteredBatchesForRow = (rowCourse: string, rowBranch: string) => {
    if (!rowCourse || !rowBranch) return [];

    // Find the selected course and branch
    const course = courses.find(c => c.id === Number(rowCourse));
    const branch = branches.find(b => b.id === Number(rowBranch));

    if (!course || !branch) return [];

    // Return filtered batches that match both course and branch
    return batches.filter(batch =>
      batch.courseId === Number(rowCourse) &&
      batch.branch === branch.name
    );
  };

  // Filter batches based on selected course and branch
  const filteredBatches = batches.filter((batch) => {
    if (!formData.course || !formData.branch) return false;

    // Find the selected course and branch
    const course = courses.find(c => c.id === Number(formData.course));
    const branch = branches.find(b => b.id === Number(formData.branch));

    if (!course || !branch) return false;

    // Return filtered batches that match both course and branch
    return batch.courseId === Number(formData.course) && batch.branch === branch.name;
  });

  // Table row state
  const [tableRows, setTableRows] = useState<TableRow[]>([
    {
      course: "",
      branch: "",
      batch: "",
      baseFee: "",
      monthsOfYear: [],
      durationMonths: 1,
      discountType: "percentage",
      discountValue: "",
      discountAmount: "",
      totalDiscountAmount: "",
      totalFee: ""
    }]);

  // Add new row
  const addRow = () => {
    const emptyRow = {
      course: "",
      branch: "",
      batch: "",
      baseFee: "",
      monthsOfYear: [],
      durationMonths: 1,
      discountType: "percentage",
      discountValue: "",
      discountAmount: "",
      totalDiscountAmount: "",
      totalFee: ""
    };
    setTableRows(currentRows => [...currentRows.map(row => ({ ...row })), emptyRow]);
  };

  const loadDataFromBackend = (backendRows: any) => {
    const convertedRows = backendRows.map((row: any) => ({
      ...row,
      monthsOfYear: row.monthsOfYear
        ? row.monthsOfYear.split(",").map((s: any) => s.trim())
        : [],
    }));
    setTableRows(convertedRows);
  };

  // useEffect(() => {
  //   async function fetchData() {
  //     const backendData = await fetch('/api/student_course_fee').then(res => res.json());
  //     loadDataFromBackend(backendData);
  //   }
  //   fetchData();
  // }, []);

  // Remove row
  const removeRow = (index: number) => {
    if (tableRows.length > 1) {
      const newRows = tableRows.filter((_, i) => i !== index);
      setTableRows(newRows);
    }
  };

  // Handle row change
  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...tableRows];
    newRows[index] = { ...newRows[index], [field]: value };

    // If course is changed, set the base fee from course data
    if (field === 'course') {
      const selectedCourse = courses.find(c => c.id === Number(value));
      if (selectedCourse && selectedCourse.fee) {
        newRows[index].baseFee = selectedCourse.fee.toString();
        calculateRowTotal(newRows, index);
      }
    }

    // Recalculate discount and total if discount type or value changes
    if (field === 'discountType' || field === 'discountValue' || field === 'baseFee' || field === 'durationMonths') {
      calculateRowTotal(newRows, index);
    }

    setTableRows(newRows);
  };

  // Calculate row total based on base fee and discount
  const calculateRowTotal = (rows: any[], index: number) => {
    const row = rows[index];
    const baseFee = parseFloat(row.baseFee) || 0;
    const discountValue = parseFloat(row.discountValue) || 0;
    const durationMonths = parseInt(row.durationMonths) || 1;

    let totalBaseFee = baseFee;
    let discountAmount = 0;

    if (row.discountType === 'percentage') {
      discountAmount = (totalBaseFee * discountValue) / 100;
    } else {
      // Apply amount-type discount only once (not multiplied)
      discountAmount = discountValue;
    }

    row.discountAmount = discountAmount.toFixed(2);
    row.totalFee = (totalBaseFee - discountAmount).toFixed(2);
  };

  // Add Item Table - add new row
  const [itemTableRows, setItemTableRows] = useState([{
    items: "",
    itemName: "",
    itemFees: "",
    qty: 1,
    baseFeeItem: "",
    itemDiscountType: "percentage",
    itemDiscountValue: "",
    itemDiscountAmount: "",
    itemTotalFee: ""
  }]);

  const addItemRow = () => {
    const emptyRow = {
      items: "",
      itemName: "",
      itemFees: "",
      qty: 1,
      baseFeeItem: "",
      itemDiscountType: "percentage",
      itemDiscountValue: "",
      itemDiscountAmount: "",
      itemTotalFee: ""
    };
    setItemTableRows(prevRows => [...prevRows.map(row => ({ ...row })), { ...emptyRow }]);
  };

  // Remove item row
  const removeItemRow = (index: number) => {
    const newRows = itemTableRows.filter((_, i) => i !== index);
    setItemTableRows(newRows);
  };

  // Handle item row change
  const handleItemRowChange = (index: number, field: string, value: string) => {
    const newRows = [...itemTableRows];
    newRows[index] = { ...newRows[index], [field]: value };

    // If course is changed, set the base fee from course data
    if (field === 'items') {
      const selectedItems = inventory.find(i => i.id === Number(value));
      if (selectedItems && selectedItems.amount) {
        newRows[index].itemName = selectedItems.items;
        newRows[index].itemFees = selectedItems.amount.toString();
        const qty = Number(newRows[index].qty) || 1;

        newRows[index].baseFeeItem = (selectedItems.amount * qty).toFixed(2);
        calculateItemRowTotal(newRows, index);
      }
    }

    if (field === 'qty') {
      const amount = parseFloat(newRows[index].itemFees) || 0;
      const qty = parseFloat(value) || 1;
      newRows[index].baseFeeItem = (amount * qty).toFixed(2);
      calculateItemRowTotal(newRows, index);
    }

    // Recalculate discount and total if discount type or value changes
    if (field === 'itemDiscountType' || field === 'itemDiscountValue' || field === 'baseFeeItem') {
      calculateItemRowTotal(newRows, index);
    }
    setItemTableRows(newRows);
  };

  // Calculate item row total based on base fee and discount
  // const calculateItemRowTotal = (rows: { items: string; itemName: string; itemFees: string; baseFeeItem: string; itemDiscountType: string; itemDiscountValue: string; itemDiscountAmount: string; itemTotalFee: string }[], index: number) => {
  //   const { baseFeeItem, itemDiscountType, itemDiscountValue } = rows[index];
  //   let total = parseFloat(baseFeeItem) || 0;

  //   if (itemDiscountType === "percentage") {
  //     total -= (total * (parseFloat(itemDiscountValue) / 100));
  //   } else {
  //     total -= parseFloat(itemDiscountValue);
  //   }
  //   rows[index].itemTotalFee = total.toFixed(2);
  // };

  const calculateItemRowTotal = (
    rows: {
      items: string;
      itemName: string;
      itemFees: string;
      baseFeeItem: string;
      itemDiscountType: string;
      itemDiscountValue: string;
      itemDiscountAmount: string;
      itemTotalFee: string;
    }[],
    index: number
  ) => {
    // const { baseFeeItem, itemDiscountType, itemDiscountValue } = rows[index];
    // let total = parseFloat(baseFeeItem) || 0;

    // // Set discount amount for display
    // let discountAmount = 0;
    // if (itemDiscountType === "percentage") {
    //   discountAmount = (total * (parseFloat(itemDiscountValue) || 0)) / 100;
    // } else {
    //   discountAmount = parseFloat(itemDiscountValue) || 0;
    // }

    // // Update discountAmount field
    // rows[index].itemDiscountAmount = discountAmount.toFixed(2);

    // // Now apply discount to total
    // total -= discountAmount;

    // // Update totalFee
    // rows[index].itemTotalFee = total.toFixed(2);
    const row = rows[index];
    const baseFee = parseFloat(row.baseFeeItem) || 0;
    const discountType = row.itemDiscountType;
    const discountValue = parseFloat(row.itemDiscountValue) || 0;

    // Default values
    let discountAmount = 0;
    let totalFee = baseFee;

    // Apply discount only if discountType and discountValue are provided
    if (discountType && discountValue) {
      if (discountType === "percentage") {
        discountAmount = (baseFee * discountValue) / 100;
      } else if (discountType === "amount") {
        discountAmount = discountValue;
      }
      totalFee = baseFee - discountAmount;
    }

    // Update the row with new values
    row.itemDiscountAmount = discountAmount.toFixed(2);
    row.itemTotalFee = totalFee.toFixed(2);
  };

  const resetForm = () => {
    setFormData({
      studentId: "", firstName: "", middleName: "", lastName: "", dateOfBirth: "", age: "", gender: "", email: "", phone: "", whatsappNo: "", street: "", community: "", residenceAddress: "", flatNo: "", status: "active", parentId: 0, baseFee: "", discountFee: "", vat: "", vatAmount: 0, totalFee: 0, isReRegistering: "yes", registrationFee: "0", registrationDate: new Date().toISOString().split('T')[0], transportation: "No", transportationMode: 0, transportationFee: "", transportDurationMonths: 1, transportationAddress: "", pickingPoint: "", droppingPoint: "", contactPerson: "", pickUpTime: "", dropOffTime: "", accessories: "No", items: "", itemFees: "", qty: 0, selectStudent: "",
    });
    setTableRows([{ course: "", branch: "", batch: "", baseFee: "", monthsOfYear: [], durationMonths: 1, discountType: "percentage", discountValue: "", discountAmount: "", totalFee: "", totalDiscountAmount: "" }]);
    setItemTableRows([{ items: "", itemName: "", itemFees: "", qty: 1, baseFeeItem: "", itemDiscountType: "percentage", itemDiscountValue: "", itemDiscountAmount: "", itemTotalFee: "" }]);
  };

  const generateInvoiceMutation = useMutation({
    mutationFn: async ({ studentId, mode = "current", extraDiscount = 0 }: { studentId: number; mode?: "current" | "manual"; extraDiscount?: number }) => {
      const res = await apiRequest("POST", "/api/invoices", { studentId, mode, extraDiscount });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to generate invoice');
      }
      return res.json();
    },
    onSuccess: (invoice) => {
      toast({
        title: "Invoice Generated",
        description: `Invoice created successfully.`,
      });
      const student = students.find(s => s.id === invoice.studentId);
      setSelectedPayment({
        ...invoice,
        studentName: student ? `${student.firstName} ${student.middleName} ${student.lastName}` : 'N/A',
        studentId: student?.studentId || 'N/A',
      });

      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Invoice Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const selectedStudent = notJoinedStudents.find(s => s.id.toString() === data.selectStudent);

      if (!selectedStudent || !selectedStudent.id) {
        throw new Error('No student selected');
      }

      // Prepare student data for update
      const today = new Date().toISOString().split('T')[0];

      // Filter out null/undefined/empty values
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const studentData = {
        ...cleanedData,
        studentId: data.studentId,
        age: parseInt(data.age || "0"),
        dateOfBirth: data.dateOfBirth && data.dateOfBirth.trim() !== '' ? data.dateOfBirth : null,
        registrationFee: data.registrationFee || "0.00",
        registrationDate: data.registrationDate && data.registrationDate.trim() !== '' ? data.registrationDate : today,
        parentId: data.parentId ?? 0,
        status: "active"
      };

      // Update existing student using PUT endpoint
      const updateResponse = await apiRequest("PUT", `/api/students/${selectedStudent.id}`, studentData);
      const student = await updateResponse.json();

      if (!student) {
        throw new Error('Failed to update student');
      }

      // Create enrollment records and fees for each row in the table
      for (const row of tableRows) {
        if (row.course && row.batch && row.branch) {
          // Create enrollment with proper date handling
          const enrollmentData = {
            studentId: student.id,
            courseId: Number(row.course),
            batchId: Number(row.batch),
            branchId: Number(row.branch),
            enrollmentDate: today,
          };
          const enrollment = await apiRequest("POST", "/api/enrollments", enrollmentData);
          const enrollmentResult = await enrollment.json();

          if (enrollmentResult && enrollmentResult.id) {
            const feeData = {
              enrollmentId: enrollmentResult.id,
              durationMonths: Number(row.durationMonths),
              monthsOfYear: row.monthsOfYear,
              discountType: row.discountType,
              discountValue: Number(row.discountValue),
              totalFee: Number(row.totalFee),
            };
            const fee = await apiRequest("POST", "/api/studentCourseFees", feeData);
            const feeResult = await fee.json();
          }
        }
      }

      // Post inventory items linked to student
      for (const row of itemTableRows) {
        if (row.items && row.qty) {
          const inventoryData = {
            studentId: student.id,
            inventoryId: Number(row.items),  // Assuming 'items' holds inventoryId
            quantity: Number(row.qty),
            discountType: row.itemDiscountType,
            discountValue: row.itemDiscountValue,
            totalAmount: row.itemTotalFee,
            // issuedDate: new Date().toISOString(),
          };
          await apiRequest("POST", "/api/studentInventory", inventoryData);
        }
      }

      // Create transportation record if required
      if (data.transportation === "Yes") {
        const transportationData: InsertTransportation = {
          studentId: student.id,
          transportationNeeded: true,
          modeId: Number(data.transportationMode),
          // fee: data.transportationFee || null,
          durationMonths: data.transportDurationMonths,
          pickingPoint: data.pickingPoint || null,
          droppingPoint: data.droppingPoint || null,
          contactPerson: data.contactPerson || null,
          pickUpTime: data.pickUpTime || null,
          dropOffTime: data.dropOffTime || null,
          address: data.transportationAddress || null,
          discountType: data.transportDiscountType || "amount",
          discountValue: data.transportDiscountValue || "0",
          totalAmount: calculateTotalFees().discountedTransportationFee.toFixed(2) || "0",
          createdAt: new Date(),
        };

        try {
          const response = await apiRequest("POST", "/api/transportation", transportationData);
          const result = await response.json();
        } catch (error) {
          console.error("Failed to create transportation record:", error);
          throw error;
        }
      }

      // Create payment record if fee information is present
      const { totalBaseFee, baseTotalDiscount, totalBaseFeeItem, itemTotalDiscount, registrationFee, transportationFee, transportationDiscount, totalPrice, totalDiscounts, vatAmount, grandTotal } = calculateTotalFees();
      if (grandTotal > 0) {
        const paymentData = {
          invoiceId: `INV-${format(new Date(), 'yyyyMMdd')}-${student.id}`,
          studentId: student.id,
          amount: grandTotal,
          paymentDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          status: 'pending',
          paymentMethod: null,
          remarks: `Total Course Fees: ${totalBaseFee}, Total Item Fees: ${totalBaseFeeItem}, Registration Fee: ${registrationFee}, Total Discounts: ${totalDiscounts}`
        };
        await apiRequest("POST", "/api/payments", paymentData);
      }

      const feeSummary = {
        studentId: student.id,
        totalEnrollmentFee: totalBaseFee,
        enrollmentDiscountType: "amount",
        enrollmentDiscountValue: baseTotalDiscount,
        totalTransportFee: transportationFee || "0.00",
        transportDiscountType: "amount",
        transportDiscountValue: transportationDiscount,
        totalInventoryFee: totalBaseFeeItem || "0.00",
        inventoryDiscountType: "amount",
        inventoryDiscountValue: itemTotalDiscount,
        totalPayable: totalPrice,
        totalDiscount: totalDiscounts,
        vatAmount: vatAmount,
        grandTotal: grandTotal,
      };

      await apiRequest("POST", "/api/student_enrollment_fees", feeSummary);

      return student;
    },
    //   onSuccess: async (student) => {
    //     queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    //     setIsCreateDialogOpen(false);

    //     // Show success toast
    //     toast({
    //       title: "Success",
    //       description: "Student created successfully",
    //     });

    //     // Get the latest payment for this student
    //     try {
    //       const response = await apiRequest("GET", `/api/payments?studentId=${student.id}&latest=true`);
    //       const latestPayment = await response.json();

    //       // Calculate total fees again to ensure we have all the values
    //       const {
    //         totalBaseFee,
    //         totalBaseFeeItem,
    //         registrationFee,
    //         transportationFee,
    //         totalDiscounts,
    //         grandTotal,
    //         baseTotalDiscount,
    //         itemTotalDiscount,
    //         transportationDiscount,
    //         discountedTransportationFee
    //       } = calculateTotalFees();

    //       if (latestPayment) {
    //         const currentDate = new Date();
    //         const dueDate = new Date();
    //         dueDate.setDate(dueDate.getDate() + 30); // Due date is 30 days from now

    //         setSelectedPayment({
    //           ...latestPayment,
    //           invoiceId: `INV-${format(currentDate, 'yyyyMMdd')}-${student.id}`,
    //           studentName: `${student.firstName} ${student.lastName}`,
    //           studentId: student.studentId,
    //           courseFee: totalBaseFee,
    //           courseDiscount: baseTotalDiscount,
    //           itemFee: totalBaseFeeItem,
    //           itemDiscount: itemTotalDiscount,
    //           registrationFee: registrationFee || 0,
    //           transportationFee: transportationFee || 0,
    //           transportationDiscount: transportationDiscount || 0,
    //           totalDiscounts: totalDiscounts,
    //           amount: grandTotal,
    //           dueDate: format(dueDate, 'yyyy-MM-dd'),
    //           paymentDate: format(currentDate, 'yyyy-MM-dd'),
    //           status: 'pending'
    //         });
    //         setIsPaymentDetailsDialogOpen(true);
    //       }
    //     } catch (error) {
    //       console.error("Failed to fetch payment details:", error);
    //     }

    //     // Reset form data
    //     setFormData({
    //       studentId: "",
    //       firstName: "",
    //       middleName: "",
    //       lastName: "",
    //       dateOfBirth: "",
    //       age: "",
    //       gender: "",
    //       email: "",
    //       phone: "",
    //       whatsappNo: "",
    //       parentId: 0,
    //       street: "",
    //       community: "",
    //       residenceAddress: "",
    //       flatNo: "",
    //       baseFee: "",
    //       discountFee: "",
    //       vat: "",
    //       vatAmount: 0,
    //       totalFee: 0,
    //       registrationFee: "",
    //       registrationDate: new Date().toISOString().split('T')[0],
    //       transportation: "No",
    //       transportationMode: 0,
    //       transportationFee: "",
    //       transportationAddress: "",
    //       pickingPoint: "",
    //       droppingPoint: "",
    //       contactPerson: "",
    //       pickUpTime: "",
    //       dropOffTime: "",
    //     });
    //     toast({
    //       title: "Success",
    //       description: "Student created successfully",
    //     });
    //   },
    //   onError: (error) => {
    //     toast({
    //       title: "Error",
    //       description: "Failed to create student",
    //       variant: "destructive",
    //     });
    //   },
    // });
    onSuccess: async (student) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Data Saved",
        description: "Student, enrollment, and item data have been successfully saved.",
      });

      if (isGeneratingInvoice) {
        await generateInvoiceMutation.mutateAsync({ studentId: student.id, mode: "manual", ...(extraDiscount ? { extraDiscount } : {}) });
      } else {
        toast({
          title: "Success",
          description: "Student created successfully",
        });
        setIsCreateDialogOpen(false);
        resetForm();
      }

      setIsGeneratingInvoice(false);
    },
    onError: (error) => {
      setIsGeneratingInvoice(false);
      toast({
        title: "Error",
        description: "Failed to create student data. Please check the form and try again.",
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
    // Find the student's enrollment and course details
    const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
    const studentInventorys = studentInventory.filter(i => i.studentId === student.id);
    const studentTransportations = transportation.filter(t => t.studentId === student.id);
    const studentInvoices = invoices.filter(i => i.studentId === student.id);
    const studentCreditNotes = creditNotes.filter(cn => cn.studentId === student.id);
    // console.log("studentInvoices", studentInvoices);


    // Calculate fee details
    let totalBaseFee = 0;
    const courseDetails = studentEnrollments.map(enrollment => {
      const course = courses.find(c => c.id === Number(enrollment.courseId));
      const batch = batches.find(b => b.id === Number(enrollment.batchId));
      const branch = branches.find(b => b.id === Number(enrollment.branchId));

      if (course) {
        totalBaseFee += Number(course.fee || 0);
      }

      return {
        courseId: enrollment.courseId,
        courseName: course?.name || '',
        batchId: enrollment.batchId,
        batchName: batch?.name || '',
        branchId: enrollment.branchId,
        branchName: branch?.name || '',
        registrationDate: enrollment.registrationDate,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status
      };
    });

    const itemDetails = studentInventorys.map((studentInventory) => {
      const item = inventory.find((i: any) => i.id === Number(studentInventory.inventoryId));

      if (item) {
        totalBaseFee += Number(item.totalAmount || 0);
      }

      return {
        inventoryId: studentInventory.inventoryId,
        inventoryName: item?.items || '',
      };
    });

    const transportationDetails = studentTransportations.map((transportation) => {
      const transportationItem = transportationModes.find((tm: any) => tm.id === Number(transportation.modeId));

      if (transportationItem) {
        totalBaseFee += Number(transportation.totalAmount || 0);
      }

      return {
        transportationNeeded: transportation.transportationNeeded,
        transportationModeId: transportation.transportationModeId,
        transportationModeName: transportationItem?.mode || '',
        pickingPoint: transportation.pickingPoint,
        droppingPoint: transportation.droppingPoint,
        pickUpTime: transportation.pickUpTime,
        dropOffTime: transportation.dropOffTime,
        contactPerson: transportation.contactPerson,
        address: transportation.address,
      };
    });

    const invoiceDetails = studentInvoices.map((invoices) => {
      return {
        invoiceId: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        amountPaid: invoices.amountPaid,
        totalAmount: invoices.totalAmount,
        status: invoices.status,
      };
    });

    const creditNoteDetails = studentCreditNotes.map((creditNotes) => {
      const appliedInvoiceNumber = invoices.find(i => i.id === creditNotes.appliedInvoiceId)?.invoiceNumber;
      const creditToOwnAccount = creditNotes.appliedToType === "Own Account" ? creditNotes.amount : null;
      return {
        creditNoteNumber: creditNotes.creditNoteNumber,
        amount: creditNotes.amount,
        appliedInvoice: appliedInvoiceNumber,
        appliedToType: creditNotes.appliedToType,
        reason: creditNotes.reason,
        status: creditNotes.status,
        generatedMonth: creditNotes.generatedMonth,
        creditToOwnAccount: creditToOwnAccount,
      };
    });

    const totalCreditToOwnAccount = creditNoteDetails
      .filter(note => note.appliedToType === "own account")
      .reduce((sum, note) => sum + parseFloat(note.amount), 0);

    // Calculate fees
    const registrationFee = student.registrationFee;

    // Set the selected student with updated information
    setSelectedStudent({
      ...student,
      enrollments: courseDetails,
      items: itemDetails,
      transportationItems: transportationDetails,
      invoiceItems: invoiceDetails,
      creditNoteItems: creditNoteDetails,
      totalCreditToOwnAccount: totalCreditToOwnAccount,
      baseFee: totalBaseFee,
      registrationFee: registrationFee,
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
    });
    setIsEditDialogOpen(true);
  };

  // Handle create student submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate student selection
    if (!formData.selectStudent) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive",
      });
      return;
    }

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

    // Validate at least one course selection
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

  // Function to get course names for a student
  const getStudentCourses = (studentId: number) => {
    const studentEnrollments = enrollments.filter(e => e.studentId === studentId);
    const seen = new Set<string>();
    const result: {
      course: string;
      batch: string;
      branch: string;
    }[] = [];

    for (const enrollment of studentEnrollments) {
      const course = courses.find(c => c.id === enrollment.courseId)?.name || 'N/A';
      const batch = batches.find(b => b.id === enrollment.batchId)?.name || 'N/A';
      const branch = branches.find(b => b.id === enrollment.branchId)?.name || 'N/A';

      const key = `${course}__${branch}`;

      if (!seen.has(key)) {
        seen.add(key);
        result.push({ course, batch, branch });
      }
    }

    return result;
  };

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
      cell: ({ row }) => (
        <div className="font-medium">{row.original.studentId}</div>
      ),
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
        return getStudentCourses(student.id).map((enrollment, index) => (
          <div key={index} className={index > 0 ? "mt-1 pt-1 border-t" : ""}>
            {enrollment.branch}
          </div>
        ));
      },
    },
    {
      accessorKey: "courses",
      header: "Courses",
      cell: ({ row }) => {
        const student = row.original;
        return getStudentCourses(student.id).map((enrollment, index) => (
          <div key={index} className={index > 0 ? "mt-1 pt-1 border-t" : ""}>
            {enrollment.course}
          </div>
        ));
      },
    },
    {
      accessorKey: "batches",
      header: "Batches",
      cell: ({ row }) => {
        const student = row.original;
        return getStudentCourses(student.id).map((enrollment, index) => (
          <div key={index} className={index > 0 ? "mt-1 pt-1 border-t" : ""}>
            {enrollment.batch}
          </div>
        ));
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
            {/* <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleEditStudent(student)}
              title="Edit Student"
            >
              <Edit className="h-4 w-4" />
            </Button> */}
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

  // Handle course selection and fetch course fee
  const handleCourseSelect = async (courseId: string) => {
    try {
      const selectedCourse = courses.find(c => String(c.id) === courseId);
      if (selectedCourse) {
        setFormData(prev => ({
          ...prev,
          course: Number(courseId),
          baseFee: selectedCourse.fee?.toString() || "0"
        }));
      }
    } catch (error) {
      console.error('Error fetching course fee:', error);
    }
  };

  // Calculate total fees from all rows
  const calculateTotalFees = () => {
    let totalBaseFee = 0;
    let totalBaseFeeItem = 0;
    let totalDiscounts = 0;
    let finalTotal = 0;
    let baseTotalDiscount = 0;
    let itemTotalDiscount = 0;
    
    const parsedExtraDiscount = parseFloat(extraDiscount.toString() || "0");

    const transportationFee = parseFloat(formData.transportationFee || "0") * (formData.transportDurationMonths || 1);
    const transportDiscountValue = parseFloat(formData.transportDiscountValue || "0");

    let transportationDiscount = 0;
    if (formData.transportDiscountType === 'amount') {
      transportationDiscount = transportDiscountValue;
    } else if (formData.transportDiscountType === 'percentage') {
      transportationDiscount = (transportDiscountValue / 100) * transportationFee;
    }

    const discountedTransportationFee = Math.max(0, transportationFee - transportationDiscount);

    // Calculate totals from all rows
    tableRows.forEach(row => {
      const baseFee = parseFloat(row.baseFee) || 0;
      const discountAmount = parseFloat(row.discountAmount) || 0;
      const durationMonths = Number(row.durationMonths) || 1;

      const totalBaseFeeRow = baseFee * durationMonths;
      const totalDiscountAmount = discountAmount * durationMonths;
      const totalFee = totalBaseFeeRow - totalDiscountAmount;

      totalBaseFee += totalBaseFeeRow;
      baseTotalDiscount += totalDiscountAmount;
      finalTotal += totalFee;
    });

    // Calculate totals from the itemTableRows (your items table)
    itemTableRows.forEach(row => {
      const baseFeeItem = parseFloat(row.baseFeeItem) || 0;            // use baseFeeItem from items table
      const discountAmount = parseFloat(row.itemDiscountAmount) || 0;
      const totalFee = parseFloat(row.itemTotalFee) || 0;

      totalBaseFeeItem += baseFeeItem;
      itemTotalDiscount += discountAmount;
      finalTotal += totalFee;
    });

    // Add registration fee and transportation fee
    const registrationFee = parseFloat(formData.registrationFee || "0");
    const totalPrice = totalBaseFee + totalBaseFeeItem + registrationFee + transportationFee;
    finalTotal = finalTotal + registrationFee + discountedTransportationFee - parsedExtraDiscount;
    const vatAmount = finalTotal * 0.05;

    return {
      totalBaseFee,
      totalBaseFeeItem,
      baseTotalDiscount,
      itemTotalDiscount,
      transportationDiscount,
      totalDiscounts: totalDiscounts + transportationDiscount + baseTotalDiscount + itemTotalDiscount,
      registrationFee,
      transportationFee,
      discountedTransportationFee,
      totalPrice,
      vatAmount,
      extraDiscount: parsedExtraDiscount,
      grandTotal: finalTotal
    };
  };

  // Display fee summary
  // const feeSummary = calculateTotalFees();

  // Handle discount type change
  const handleDiscountTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      discountType: value,
      discountFee: '', // Reset discount fee when type changes
    }));
  };

  // Handle discount fee change
  const handleDiscountFeeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      discountFee: value
    }));
  };

  const handleTransportDiscountTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      transportDiscountType: value,
      transportDiscountValue: '', // Reset on type change
    }));
  };

  const handleTransportDiscountValueChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      transportDiscountValue: value,
    }));
  };

  // Calculate fees when relevant fields change
  useEffect(() => {
    const calculateFees = () => {
      const baseFee = Number(formData.baseFee) || 0;
      const registrationFee = Number(formData.registrationFee) || 0;
      const transportationFee = Number(formData.transportationFee) || 0;
      const subtotal = baseFee + registrationFee + transportationFee;

      let discountValue = 0;
      if (formData.discountType === 'percentage' && formData.discountPercentage) {
        discountValue = (subtotal * Number(formData.discountPercentage)) / 100;
      } else if (formData.discountType === 'amount' && formData.discountAmount) {
        discountValue = Number(formData.discountAmount);
      }

      const discountedTotal = subtotal - discountValue;
      const vat = Number(formData.vat) || 0;
      const vatAmount = (discountedTotal * vat) / 100;
      const totalFee = discountedTotal + vatAmount;

      const grandTotal = totalFee;

      setFormData(prev => ({
        ...prev,
        vatAmount: Number(vatAmount.toFixed(2)),
        totalFee: Number(totalFee.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2))
      }));
    };

    calculateFees();
  }, [
    formData.baseFee,
    formData.registrationFee,
    formData.discountType,
    formData.discountAmount,
    formData.discountPercentage,
    formData.vat,
    formData.transportationFee,
  ]);

  return (
    <AppShell>
      <PageHeader
        title="Students"
        description="Manage all students enrolled in Jazzrockers."
        actions={
          // <Link href="/admin/new-student">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Student
          </Button>
          // </Link>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Discontinued</TabsTrigger>
          <TabsTrigger value="alumni">Outbreak</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={columns}
            data={filteredStudents}
            searchColumns={["firstName", "lastName", "middleName", "studentId", "gender", "batches", "courses", "branches"]}
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
                  {selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
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
                    </div>
                  </CardContent>
                </Card>

                {/* Enrollment Information */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-3">Enrollment Information</h4>
                    <div className="space-y-4">
                      {selectedStudent.enrollments?.map((enrollment: any, index: any) => (
                        <div key={index} className="space-y-2 pb-2 border-b last:border-b-0">
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-500">Status</span>
                            <Badge variant={enrollment.status === "active" ? "default" : "destructive"}>{capitalizeFirstLetter(enrollment.status) || "-"}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-500">Course</span>
                            <span className="text-sm font-medium">{enrollment.courseName || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-500">Branch</span>
                            <span className="text-sm">{enrollment.branchName || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-500">Batch</span>
                            <span className="text-sm">{enrollment.batchName || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-500">Registration Date</span>
                            <span className="text-sm">
                              {selectedStudent.registrationDate
                                ? format(new Date(selectedStudent.registrationDate), "MMM dd, yyyy")
                                : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-500">Enrollment Date</span>
                            <span className="text-sm">
                              {enrollment.enrollmentDate
                                ? format(new Date(enrollment.enrollmentDate), "MMM dd, yyyy")
                                : "-"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory Information */}
                {selectedStudent?.items?.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold mb-3">Inventory Information</h4>
                      <div className="space-y-4">
                        {selectedStudent?.items?.map((item: any, index: any) => (
                          <div key={index} className="space-y-2 pb-2 border-b last:border-b-0">
                            <div className="flex justify-between">
                              <span className="text-sm text-neutral-500">Item</span>
                              <span className="text-sm font-medium">{item?.inventoryName || "-"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Transportation Information */}
              {selectedStudent.transportationItems?.some((t: any) => t.transportationNeeded) && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-3">Transportation Information</h4>
                    {selectedStudent.transportationItems
                      .filter((t: any) => t.transportationNeeded)
                      .map((item: any, index: any) => (
                        <div key={index} className="grid grid-cols-2 gap-4 mb-4 border-b pb-4 last:border-b-0">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-neutral-500">Mode</span>
                              <span className="text-sm">{item.transportationModeName || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-neutral-500">Address</span>
                              <span className="text-sm">{item.address || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-neutral-500">Contact Person</span>
                              <span className="text-sm">{item.contactPerson || "-"}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-neutral-500">Pick-up Point</span>
                              <span className="text-sm">{item.pickingPoint || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-neutral-500">Drop-off Point</span>
                              <span className="text-sm">{item.droppingPoint || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-neutral-500">Pick-up Time</span>
                              <span className="text-sm">{formatTimeTo12Hour(item.pickUpTime) || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-neutral-500">Drop-off Time</span>
                              <span className="text-sm">{formatTimeTo12Hour(item.dropOffTime) || "-"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}

              {/* Credit Note Information */}
              {selectedStudent.creditNoteItems?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-3">Credit Note Information</h4>
                    <Accordion.Root type="multiple" className="space-y-2">
                      {selectedStudent.creditNoteItems?.map((item: any, index: any) => (
                        <Accordion.Item key={index} value={`item-${index}`} className="border rounded-md">
                          <Accordion.Header>
                            <Accordion.Trigger className="w-full flex justify-between items-center p-3 text-sm font-bold bg-gray-100 hover:bg-gray-200">
                              <Link className="hover:underline" href={`/admin/print-credit-note/${item.creditNoteNumber}`}><span>{item.creditNoteNumber || "-"}</span></Link>
                              {/* <span>{item.creditNoteNumber}</span> */}
                              <span className="flex items-center space-x-1 text-xs text-right">
                                <span className="px-2 py-0.5 text-xs text-neutral-500">{item.generatedMonth}</span>
                                <span className="px-2 py-0.5 pl-15 rounded-full bg-primary text-white text-xs font-semibold">{capitalizeFirstLetter(item.status)}</span>
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform duration-300",
                                    "AccordionTrigger[data-state='open']"
                                  )}
                                />
                              </span>
                            </Accordion.Trigger>
                          </Accordion.Header>
                          <Accordion.Content className="p-2 space-y-2 text-sm">
                            <p>{item.appliedInvoice}</p>
                            <p>{item.amount}</p>
                            <p>{item.reason}</p>
                            <p>{capitalizeFirstLetter(item.appliedToType)}</p>
                            <p>{capitalizeFirstLetter(item.status)}</p>
                          </Accordion.Content>
                        </Accordion.Item>
                      ))}
                    </Accordion.Root>
                  </CardContent>
                </Card>
              )}

              {/* Invoice Information */}
              {selectedStudent.invoiceItems?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-3">Invoice Information</h4>
                    <Accordion.Root type="multiple" className="space-y-2">
                      {selectedStudent.invoiceItems?.map((item: any, index: any) => (
                        <Accordion.Item key={index} value={`item-${index}`} className="border rounded-md">
                          <Accordion.Header>
                            <Accordion.Trigger className="w-full flex justify-between items-center p-3 text-sm font-bold bg-gray-100 hover:bg-gray-200">
                              <Link className="hover:underline" href={`/admin/invoice/${item.invoiceId}`}><span>{item.invoiceNumber || "-"}</span></Link>
                              <span className="flex items-center space-x-1 text-xs text-right">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                                  getStatusColor(item.status).bg,
                                  getStatusColor(item.status).text
                                )}>{capitalizeFirstLetter(item.status || "-")}</span>
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform duration-300",
                                    "AccordionTrigger[data-state='open']"
                                  )}
                                />
                              </span>
                            </Accordion.Trigger>
                          </Accordion.Header>
                          <Accordion.Content className="p-4 border-t text-sm space-y-2 bg-white">
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Issue Date</span>
                              <span>{item.issueDate || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Total Amount</span>
                              <span className="font-bold">AED {item.totalAmount || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Amount Paid</span>
                              <span className="font-bold">AED {item.amountPaid || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Status</span>
                              <span className="font-bold">{capitalizeFirstLetter(item.status || "-")}</span>
                            </div>
                          </Accordion.Content>
                        </Accordion.Item>
                      ))}
                    </Accordion.Root>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Outstanding Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Total Amount</span>
                      <span className="text-sm font-bold">
                        AED {outstandingSummary?.total ? Number(outstandingSummary?.total).toFixed(2) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Amount Paid</span>
                      <span className="text-sm font-bold">
                        AED {outstandingSummary?.paid ? Number(outstandingSummary?.paid).toFixed(2) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Credit-Own Account</span>
                      <span className="text-sm font-bold">
                        AED {selectedStudent?.totalCreditToOwnAccount > 0 ? selectedStudent?.totalCreditToOwnAccount.toFixed(2) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Outstanding Amount</span>
                      <span className="text-sm font-bold text-red-500">
                        AED {outstandingSummary?.outstandingAmount ? Number(outstandingSummary?.outstandingAmount).toFixed(2) : "-"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <DialogFooter className="flex justify-between gap-4 pt-4 border-t">
                <div className="flex gap-4">
                  {/* <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditStudent(selectedStudent);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Student
                  </Button> */}
                </div>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Student Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        {/* <DialogContent className="sm:max-w-full max-h-full flex flex-col gap-4"> */}
        <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none flex flex-col gap-4">
          <DialogHeader className="flex flex-row items-center justify-between gap-4 mt-4">
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
                <div className="space-y-2">
                  <Label htmlFor="selectStudent">Select Student</Label>
                  <ReactSelect
                    inputId="selectStudent"
                    options={studentOptions}
                    onChange={handleSelectChange}
                    value={studentOptions.find((opt) => opt.value.toString() === formData.selectStudent)}
                    placeholder="Select a student"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>
              </div>
              {formData.selectStudent && (
                <>
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
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-4 pb-4 pl-2 pr-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={e => handleFieldChange('firstName', e.target.value)}
                        // placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        name="middleName"
                        value={formData.middleName ?? ""}
                        onChange={e => handleFieldChange('middleName', e.target.value)}
                      // placeholder="Enter middle name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={e => handleFieldChange('lastName', e.target.value)}
                        // placeholder="Enter last name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
                        value={formData.age ?? ""}
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
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone ?? ""}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
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

                    <div className="space-y-2">
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
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        name="branch"
                        value={formData.branch ?? ""}
                        onChange={(e) => handleFieldChange('branch', e.target.value)}
                      // placeholder="Enter flat number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Select
                        name="branch"
                        value={(formData.branch ?? "").toString()}
                        onValueChange={(value) =>
                          setFormData({ ...formData, branch: parseInt(value) || 0 })
                        }
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
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Input
                        id="course"
                        name="course"
                        value={formData.course ?? ""}
                        onChange={(e) => handleFieldChange('course', e.target.value)}
                      // placeholder="Enter flat number"
                      />
                    </div>
                    {/* <div className="space-y-2">
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
                                          course: options ? Number(options.value) : undefined
                                      }));
                                  }}
                                  // placeholder="Select course"
                                  isClearable
                                  isSearchable
                                  isMulti
                              />
                          );
                      })()}
                  </div> */}
                  </div>
                </>
              )}

              <div className="space-y-4 pt-4 pl-2 pr-2">
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-700 text-white">
                      <tr className="border-b">
                        <th className="px-2 py-1 text-left text-sm font-medium">SL No.</th>
                        <th className="px-2 py-1 text-left text-sm font-medium w-52">Branch</th>
                        <th className="px-2 py-1 text-left text-sm font-medium w-40">Course</th>
                        <th className="px-2 py-1 text-left text-sm font-medium w-40">Batch</th>
                        <th className="px-2 py-1 text-left text-sm font-medium">Basic Fee</th>
                        <th className="px-2 py-1 text-left text-sm font-medium">Month</th>
                        <th className="px-2 py-1 text-left text-sm font-medium">No of Months</th>
                        <th className="px-2 py-1 text-left text-sm font-medium">Discount Type</th>
                        <th className="px-2 py-1 text-left text-sm font-medium">Discount Value</th>
                        <th className="px-2 py-1 text-left text-sm font-medium">Discount Amount</th>
                        <th className="px-2 py-1 text-left text-sm font-medium">Total Fee</th>
                        <th className="px-2 py-1 text-left text-sm font-medium">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, index) => (
                        <tr key={index}>
                          <td className="px-2 py-1 text-center">
                            {index + 1}
                          </td>
                          <td className="px-2 py-1">
                            {(() => {
                              const options = branches.map((branch) => ({
                                label: branch.name,
                                value: String(branch.id),
                              }));

                              const selected = options.find(opt => opt.value === row.branch);

                              return (
                                <ReactSelect
                                  className="text-sm"
                                  options={options}
                                  value={selected || null}
                                  onChange={(option) => {
                                    const value = option?.value || "";
                                    handleBranchChange(Number(value));
                                    handleRowChange(index, "branch", value);
                                  }}
                                  // placeholder="Select branch"
                                  isClearable
                                  isSearchable
                                />
                              );
                            })()}
                          </td>
                          <td className="px-2 py-1">
                            {(() => {
                              const options = courses.map((course) => ({
                                label: course.name,
                                value: String(course.id),
                              }));

                              const selected = options.find(opt => opt.value === row.course);

                              return (
                                <ReactSelect
                                  className="text-sm"
                                  options={options}
                                  value={selected || null}
                                  onChange={(option) => {
                                    const value = option?.value || "";
                                    handleCourseSelect(value);
                                    handleRowChange(index, "course", value);
                                  }}
                                  // placeholder="Select course"
                                  isClearable
                                  isSearchable
                                />
                              );
                            })()}
                          </td>
                          <td>
                            <TooltipProvider>
                              <Select
                                name="batch"
                                value={row.batch}
                                onValueChange={(value) => handleRowChange(index, 'batch', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={
                                    !row.course || !row.branch
                                      ? "Select course and branch first"
                                      : getFilteredBatchesForRow(row.course, row.branch).length === 0
                                        ? "No batches available"
                                        : "Select batch"
                                  } />
                                </SelectTrigger>
                                <SelectContent className="relative z-50 overflow-visible">
                                  {getFilteredBatchesForRow(row.course, row.branch).map((batch) => {
                                    const scheduleData = getSchedule(batch.id);
                                    return (
                                      <Tooltip key={batch.id} delayDuration={200}>
                                        <TooltipTrigger asChild>
                                          <span>
                                            <SelectItem value={batch.id.toString()} className="overflow-visible">
                                              {batch.name}
                                            </SelectItem>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={8} className="text-gray-500 p-2 rounded shadow text-sm max-w-xs z-[9999]">
                                          {scheduleData.length > 0 ? (
                                            scheduleData.map((s, index) => (
                                              <div key={index} className={index > 0 ? "mt-1 pt-1 border-t" : ""}>
                                                <div className="font-semibold">{s.day}</div>
                                                <div>{formatTimeTo12Hour(s.startTime)} - {formatTimeTo12Hour(s.endTime)}</div>
                                                <div>{s.duration} mins</div>
                                              </div>
                                            ))
                                          ) : (
                                            <div>No schedule available</div>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </TooltipProvider>
                          </td>

                          <td className="px-2 py-1">
                            <Input
                              // type="number"
                              value={row.baseFee}
                              onChange={(e) => handleRowChange(index, 'baseFee', e.target.value)}
                              className="w-24"
                              readOnly
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                  <span className="font-normal">
                                    {row.monthsOfYear?.length > 0
                                      ? row.monthsOfYear.join(", ")
                                      : "Select months"}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-60 p-3 space-y-3">
                                {/* Month & Year Selectors */}
                                <div className="flex gap-2">
                                  <select
                                    className="border rounded px-2 py-1 w-1/2 text-sm"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                  >
                                    <option value="" disabled hidden>Month</option>
                                    {monthsOfYear.map((month) => (
                                      <option key={month} value={month}>{month}</option>
                                    ))}
                                  </select>
                                  <select
                                    className="border rounded px-2 py-1 w-1/2 text-sm"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                  >
                                    <option value="" disabled hidden>Year</option>
                                    {years.map((year) => (
                                      <option key={year} value={year}>{year}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Add Button */}
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="w-full"
                                  disabled={!selectedMonth || !selectedYear}
                                  onClick={() => {
                                    const monthYear = `${selectedMonth} ${selectedYear}`;
                                    if (!row.monthsOfYear?.includes(monthYear)) {
                                      const newMonths = [...(row.monthsOfYear || []), monthYear];
                                      const newRows = [...tableRows];
                                      newRows[index] = {
                                        ...newRows[index],
                                        monthsOfYear: newMonths,
                                        durationMonths: newMonths.length || 1,
                                      };
                                      setTableRows(newRows);
                                    }

                                    // Reset
                                    setSelectedMonth("");
                                    setSelectedYear("");
                                  }}
                                >
                                  Add
                                </Button>

                                {/* Selected Values List */}
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                  {row.monthsOfYear?.map((monthYear) => (
                                    <div
                                      key={monthYear}
                                      className="flex justify-between items-center px-2 py-1 bg-gray-100 rounded text-sm"
                                    >
                                      <span>{monthYear}</span>
                                      <button
                                        className="text-red-500 text-xs"
                                        onClick={() => {
                                          const newMonths = row.monthsOfYear.filter((m) => m !== monthYear);
                                          const newRows = [...tableRows];
                                          newRows[index] = {
                                            ...newRows[index],
                                            monthsOfYear: newMonths,
                                            durationMonths: newMonths.length || 1,
                                          };
                                          setTableRows(newRows);
                                        }}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              // type="number"
                              min="1"
                              value={row.durationMonths || 1}
                              // value={row.monthsOfYear?.length || 1}
                              onChange={(e) => handleRowChange(index, 'durationMonths', e.target.value)}
                              className="w-24"
                              readOnly
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Select
                              name="discountType"
                              value={row.discountType}
                              onValueChange={(value) => handleRowChange(index, 'discountType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select discount type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="amount">Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              type="number"
                              value={row.discountValue}
                              onChange={(e) => handleRowChange(index, 'discountValue', e.target.value)}
                              className="w-16"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              value={row.discountAmount}
                              readOnly
                              className="w-24 bg-gray-50"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              type="number"
                              value={row.totalFee}
                              readOnly
                              className="w-24 bg-gray-50"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              variant="destructive"
                              onClick={() => removeRow(index)}
                              disabled={tableRows.length <= 1}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={9} className="px-4 py-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              addRow();
                            }}
                          >
                            Add Course
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-700 text-white">
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left text-sm font-medium">SL No.</th>
                        <th className="px-4 py-2 text-left text-sm font-medium w-64">Items</th>
                        <th className="px-4 py-2 text-left text-sm font-medium w-32">Amount</th>
                        <th className="px-4 py-2 text-left text-sm font-medium w-24">Quantity</th>
                        <th className="px-4 py-2 text-left text-sm font-medium w-32">Rate</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Discount Type</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Discount Value</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Discount Amount</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Total Fee</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemTableRows.map((row, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-center">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2">
                            {(() => {
                              const options = inventory.map((item) => ({
                                label: item.items,
                                value: item.id.toString(),
                              }));

                              const selectedValue = options.find(
                                (opt) => opt.value === row.items?.toString()
                              );

                              return (
                                <ReactSelect
                                  className="text-sm"
                                  value={selectedValue || null}
                                  onChange={(option) =>
                                    handleItemRowChange(index, "items", option?.value || "")
                                  }
                                  options={options}
                                  placeholder="Select Item"
                                  isClearable
                                  isSearchable
                                />
                              );
                            })()}
                          </td>
                          {/* <td className="px-4 py-2">
                            <Select
                              value={row.items}
                              onValueChange={(value) => {
                                handleItemRowChange(index, 'items', value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Item">
                                  {row.itemName || "Select Item"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {inventory.map((item: any) => (
                                  <SelectItem key={item.id} value={item.id.toString()}>
                                    {item.items}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td> */}
                          <td className="px-4 py-2">
                            <Input
                              id="itemFees"
                              name="itemFees"
                              value={row.itemFees}
                              onChange={(e) => handleItemRowChange(index, 'itemFees', e.target.value)}
                              // placeholder="Enter amount"
                              readOnly
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              id="qty"
                              name="qty"
                              value={row.qty}
                              onChange={(e) => handleItemRowChange(index, 'qty', e.target.value)}
                            // placeholder="Enter quantity"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              id="baseFeeItem"
                              name="baseFeeItem"
                              value={row.baseFeeItem}
                              onChange={(e) => handleItemRowChange(index, 'baseFeeItem', e.target.value)}
                              // placeholder="Enter base fee"
                              readOnly
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Select
                              name="itemDiscountType"
                              value={row.itemDiscountType}
                              onValueChange={(value) => handleItemRowChange(index, 'itemDiscountType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select discount type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="amount">Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              value={row.itemDiscountValue}
                              onChange={(e) => handleItemRowChange(index, 'itemDiscountValue', e.target.value)}
                              className="w-16"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              value={row.itemDiscountAmount}
                              readOnly
                              className="w-24 bg-gray-50"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              value={row.itemTotalFee}
                              readOnly
                              className="w-24 bg-gray-50"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              variant="destructive"
                              onClick={() => removeItemRow(index)}
                              disabled={itemTableRows.length <= 1}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={9} className="px-4 py-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              addItemRow();
                            }}
                          >
                            Add Item
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 rounded-lg border border-gray-300 p-4">
                  <div className="grid grid-cols-5 gap-4">
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="transportation">Transportation Required</Label>
                      <Select
                        name="transportation"
                        value={formData.transportation}
                        onValueChange={(value) => handleFieldChange('transportation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transportation option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.transportation === "Yes" && (
                    <>
                      <div className="grid grid-cols-5 gap-4 pb-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="transportationMode">Transportation Mode</Label>
                          <Select
                            value={formData.transportationMode?.toString()}
                            onValueChange={(value) => {
                              const selectedMode = transportationModes.find(
                                (mode: any) => mode.id.toString() === value
                              );
                              handleFieldChange('transportationMode', value);
                              if (selectedMode) {
                                handleFieldChange('transportationFee', selectedMode.rate.toString());
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              {transportationModes.map((mode: any) => (
                                <SelectItem key={mode.id} value={mode.id.toString()}>
                                  {mode.mode}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="transportationFee">Transportation Fee</Label>
                          <Input
                            id="transportationFee"
                            name="transportationFee"
                            value={formData.transportationFee}
                            readOnly
                          // placeholder="Fee auto-filled"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transportDurationMonths">Duration of Months</Label>
                          <Input
                            id="transportDurationMonths"
                            name="transportDurationMonths"
                            type="number"
                            value={formData.transportDurationMonths}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                transportDurationMonths: parseInt(e.target.value) || 1,
                              }))
                            }
                          // placeholder="Fee auto-filled"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transportationAddress">Transportation Address</Label>
                          <Input
                            id="transportationAddress"
                            name="transportationAddress"
                            value={formData.transportationAddress}
                            onChange={(e) => handleFieldChange('transportationAddress', e.target.value)}
                          // placeholder="Enter transportation address"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pickingPoint">Pick Up Point</Label>
                          <Input
                            id="pickingPoint"
                            name="pickingPoint"
                            value={formData.pickingPoint}
                            onChange={(e) => handleFieldChange('pickingPoint', e.target.value)}
                          // placeholder="Enter pick-up point"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="droppingPoint">Drop Off Point</Label>
                          <Input
                            id="droppingPoint"
                            name="droppingPoint"
                            value={formData.droppingPoint}
                            onChange={(e) => handleFieldChange('droppingPoint', e.target.value)}
                          // placeholder="Enter drop off point"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contactPerson">Transport Contact Person No.</Label>
                          <Input
                            id="contactPerson"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
                          // placeholder="Enter contact person"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pickUpTime">Pick Up Time</Label>
                          <Input
                            id="pickUpTime"
                            name="pickUpTime"
                            type="time"
                            value={formData.pickUpTime}
                            onChange={(e) => handleFieldChange('pickUpTime', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dropOffTime">Drop Off Time</Label>
                          <Input
                            id="dropOffTime"
                            name="dropOffTime"
                            type="time"
                            value={formData.dropOffTime}
                            onChange={(e) => handleFieldChange('dropOffTime', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="transportDiscountType">Discount Type</Label>
                          <Select
                            name="transportDiscountType"
                            value={formData.transportDiscountType}
                            onValueChange={handleTransportDiscountTypeChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select discount type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="amount">Amount</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.transportDiscountType === 'amount' && (
                          <div className="space-y-2">
                            <Label htmlFor="transportDiscountValue">Discount Amount</Label>
                            <Input
                              type="number"
                              value={formData.transportDiscountValue}
                              onChange={(e) => handleTransportDiscountValueChange(e.target.value)}
                              placeholder="Enter discount amount"
                            />
                          </div>
                        )}

                        {formData.transportDiscountType === 'percentage' && (
                          <div className="space-y-2">
                            <Label htmlFor="transportDiscountValue">Discount Percentage</Label>
                            <Input
                              type="number"
                              value={formData.transportDiscountValue}
                              onChange={(e) => handleTransportDiscountValueChange(e.target.value)}
                              placeholder="Enter discount percentage"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="discountedTransportationFee">Total Transportation Fee</Label>
                          <Input
                            type="number"
                            id="discountedTransportationFee"
                            value={calculateTotalFees().discountedTransportationFee.toFixed(2)}
                            readOnly
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end space-x-4 text-sm pr-6  pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Course Fee:</span>
                      <span className="ml-4 font-medium">
                        AED {calculateTotalFees().totalBaseFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Items Fee:</span>
                      <span className="ml-4 font-medium">
                        AED {calculateTotalFees().totalBaseFeeItem.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Registration Fee:</span>
                      <span className="ml-4 font-medium">
                        AED {calculateTotalFees().registrationFee ? calculateTotalFees().registrationFee.toFixed(2) : "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Transportation Fee:</span>
                      <span className="ml-4 font-medium">
                        AED {calculateTotalFees().transportationFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Price:</span>
                      <span className="ml-4 font-medium">
                        AED {calculateTotalFees().totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Discounts:</span>
                      <span className="ml-4 font-medium text-red-600">
                        - AED {calculateTotalFees().totalDiscounts.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <label className="font-medium" htmlFor="extra-discount">Extra Discount:</label>
                      <input
                        id="extra-discount"
                        // type="number"
                        step="0.01"
                        className="ml-4 border px-2 py-1 rounded w-24 text-right text-red-600 font-medium"
                        value={`-${extraDiscount.toString()}`}
                        // onChange={(e) => setExtraDiscount(Number(e.target.value))}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                          setExtraDiscount(cleaned ? parseFloat(cleaned) : 0);
                        }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">VAT Inclusive:</span>
                      <span className="ml-4 font-medium">
                        AED {calculateTotalFees().vatAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 pb-4">
                      <span className="font-medium">Grand Total:</span>
                      <span className="ml-4 font-bold">
                        AED {calculateTotalFees().grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pb-4 pr-6">
                <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                {/* <Button type="submit" className="bg-gray-700 text-white hover:bg-gray-600" disabled={createStudentMutation.isPending}>
                  {createStudentMutation.isPending ? "Creating..." : "Create Student"}
                </Button>
                <Button type="submit" className="bg-gray-700 text-white hover:bg-gray-600" disabled={createStudentMutation.isPending}>
                  {createStudentMutation.isPending ? "Generating..." : "Generate Invoice"}
                </Button> */}
                <Button
                  type="submit"
                  className="bg-gray-700 text-white hover:bg-gray-600"
                  disabled={createStudentMutation.isPending || generateInvoiceMutation.isPending}
                >
                  {createStudentMutation.isPending && !isGeneratingInvoice ? "Saving..." : "Create Student"}
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={() => setIsGeneratingInvoice(true)}
                  disabled={createStudentMutation.isPending || generateInvoiceMutation.isPending}
                >
                  {createStudentMutation.isPending && isGeneratingInvoice ? "Processing..." : "Generate Invoice"}
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
                Edit the student details below
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
                <div className="grid grid-cols-2 gap-4 pb-4">
                  {/* <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        name="studentId"
                        value={formData.studentId}
                        onChange={(e) => handleFieldChange('studentId', e.target.value)}
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
                        onChange={e => handleFieldChange('firstName', e.target.value)}
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
                        onChange={e => handleFieldChange('lastName', e.target.value)}
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div> */}

                  {/* <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
                  </div> */}

                  {/* <div className="space-y-4"> */}
                  {/* <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div> */}

                  {/* <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div> */}

                  {/* <div className="space-y-2">
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

                  <div className="space-y-2">
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
                </div>

                <div className="space-y-4 pt-4 pl-2 pr-2">
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-700 text-white">
                        <tr className="border-b">
                          <th className="px-2 py-1 text-left text-sm font-medium">SL No.</th>
                          <th className="px-2 py-1 text-left text-sm font-medium w-52">Branch</th>
                          <th className="px-2 py-1 text-left text-sm font-medium w-40">Course</th>
                          <th className="px-2 py-1 text-left text-sm font-medium w-40">Batch</th>
                          <th className="px-2 py-1 text-left text-sm font-medium">Basic Fee</th>
                          <th className="px-2 py-1 text-left text-sm font-medium">Month</th>
                          <th className="px-2 py-1 text-left text-sm font-medium">Duration</th>
                          <th className="px-2 py-1 text-left text-sm font-medium">Discount Type</th>
                          <th className="px-2 py-1 text-left text-sm font-medium">Discount Value</th>
                          <th className="px-2 py-1 text-left text-sm font-medium">Discount Amount</th>
                          <th className="px-2 py-1 text-left text-sm font-medium">Total Fee</th>
                          <th className="px-2 py-1 text-left text-sm font-medium">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, index) => (
                          <tr key={index}>
                            <td className="px-2 py-1 text-center">
                              {index + 1}
                            </td>
                            <td className="px-2 py-1">
                              {(() => {
                                const options = branches.map((branch) => ({
                                  label: branch.name,
                                  value: String(branch.id),
                                }));

                                const selected = options.find(opt => opt.value === row.branch);

                                return (
                                  <ReactSelect
                                    className="text-sm"
                                    options={options}
                                    value={selected || null}
                                    onChange={(option) => {
                                      const value = option?.value || "";
                                      handleBranchChange(Number(value));
                                      handleRowChange(index, "branch", value);
                                    }}
                                    // placeholder="Select branch"
                                    isClearable
                                    isSearchable
                                  />
                                );
                              })()}
                            </td>
                            <td className="px-2 py-1">
                              {(() => {
                                const options = courses.map((course) => ({
                                  label: course.name,
                                  value: String(course.id),
                                }));

                                const selected = options.find(opt => opt.value === row.course);

                                return (
                                  <ReactSelect
                                    className="text-sm"
                                    options={options}
                                    value={selected || null}
                                    onChange={(option) => {
                                      const value = option?.value || "";
                                      handleCourseSelect(value);
                                      handleRowChange(index, "course", value);
                                    }}
                                    // placeholder="Select course"
                                    isClearable
                                    isSearchable
                                  />
                                );
                              })()}
                            </td>
                            {/* <td className="px-2 py-1">
                            <Select
                              name="course"
                              value={row.course}
                              onValueChange={(value) => {
                                handleCourseSelect(value);
                                handleRowChange(index, 'course', value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                              <SelectContent>
                                {courses.map((course: any) => (
                                  <SelectItem key={course.id} value={String(course.id)}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td> */}
                            <td className="px-2 py-1">
                              <Select
                                name="batch"
                                value={row.batch}
                                onValueChange={(value) => handleRowChange(index, 'batch', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={
                                    !row.course || !row.branch
                                      ? "Select course and branch first"
                                      : getFilteredBatchesForRow(row.course, row.branch).length === 0
                                        ? "No batches available"
                                        : "Select batch"
                                  } />
                                </SelectTrigger>
                                <SelectContent>
                                  {getFilteredBatchesForRow(row.course, row.branch).map((batch) => (
                                    <SelectItem key={batch.id} value={batch.id.toString()}>
                                      {batch.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>

                            <td className="px-2 py-1">
                              <Input
                                // type="number"
                                value={row.baseFee}
                                onChange={(e) => handleRowChange(index, 'baseFee', e.target.value)}
                                className="w-24"
                                readOnly
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Select
                                name="monthsOfYear"
                                value={row.monthsOfYear?.join(", ") ?? ""}
                                onValueChange={(value) => {
                                  handleRowChange(index, 'monthsOfYear', value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select months of year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {monthsOfYear.map((month: any) => (
                                    <SelectItem key={month} value={String(month)}>
                                      {month}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1">
                              <Input
                                // type="number"
                                min="1"
                                value={row.durationMonths || 1}
                                onChange={(e) => handleRowChange(index, 'durationMonths', e.target.value)}
                                className="w-24"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Select
                                name="discountType"
                                value={row.discountType}
                                onValueChange={(value) => handleRowChange(index, 'discountType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select discount type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">Percentage</SelectItem>
                                  <SelectItem value="amount">Amount</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1">
                              <Input
                                type="number"
                                value={row.discountValue}
                                onChange={(e) => handleRowChange(index, 'discountValue', e.target.value)}
                                className="w-16"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                value={row.discountAmount}
                                readOnly
                                className="w-24 bg-gray-50"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Input
                                type="number"
                                value={row.totalFee}
                                readOnly
                                className="w-24 bg-gray-50"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Button
                                variant="destructive"
                                onClick={() => removeRow(index)}
                                disabled={tableRows.length <= 1}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={9} className="px-4 py-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                addRow();
                              }}
                            >
                              Add Course
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discountType">Discount Type</Label>
                      <Select
                        name="discountType"
                        value={formData.discountType}
                        onValueChange={handleDiscountTypeChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select discount type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="amount">Amount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.discountType === 'amount' && (
                      <div className="space-y-2">
                        <Label htmlFor="discountAmount">Discount Amount</Label>
                        <Input
                          type="number"
                          value={formData.discountFee}
                          onChange={(e) => handleDiscountFeeChange(e.target.value)}
                          placeholder="Enter discount amount"
                        />
                      </div>
                    )}

                    {formData.discountType === 'percentage' && (
                      <div className="space-y-2">
                        <Label htmlFor="discountPercentage">Discount Percentage</Label>
                        <Input
                          type="number"
                          value={formData.discountFee}
                          onChange={(e) => handleDiscountFeeChange(e.target.value)}
                          placeholder="Enter discount percentage"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4 text-sm">
                    <div className="space-y-2">
                      {/* <div className="flex justify-between">
                        <span className="font-medium">Course Fee:</span>
                        <span className="ml-4">{formData.baseFee || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Registration Fee:</span>
                        <span className="ml-4">{formData.registrationFee}</span>
                      </div> */}
                      <div className="flex justify-between">
                        <span className="font-medium">Total Fees:</span>
                        <span className="ml-4">{(calculateTotalFees().subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Transportation Fees:</span>
                        <span className="ml-4 font-medium">
                          AED {formData.transportationFee ? `AED ${Number(formData.transportationFee).toFixed(2)}` : "-"}
                        </span>
                      </div>
                      {formData.discountType !== 'none' && (
                        <div className="flex justify-between text-red-500">
                          <span className="font-medium">Discount:</span>
                          <span className="ml-4">
                            {formData.discountType === 'percentage'
                              ? `${formData.discountFee || 0}% (${(calculateTotalFees().discountAmount ?? 0).toFixed(2)})`
                              : (calculateTotalFees().discountAmount ?? 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {/* <div className="flex justify-between">
                        <span className="font-medium">VAT ({formData.vat}%):</span>
                        <span className="ml-4">{formData.vatAmount || 0}</span>
                      </div> */}
                      {/* <div className="flex justify-between">
                        <span className="font-medium">Advance Total:</span>
                        <span className="ml-4">{formData.advanceTotal || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Other Charges:</span>
                        <span className="ml-4">{formData.otherCharges || 0}</span>
                      </div> */}
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Grand Total:</span>
                        <span className="ml-4">
                          {(
                            Number(formData.totalFee || 0) +
                            Number(formData.transportationFee || 0)
                            // Number(formData.advanceTotal || 0) +
                            // Number(formData.otherCharges || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportation">Transportation Required</Label>
                  <Select
                    name="transportation"
                    value={formData.transportation}
                    onValueChange={(value) => handleFieldChange('transportation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transportation option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.transportation === "Yes" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="transportationMode">Transportation Mode</Label>
                        <Input
                          id="transportationMode"
                          name="transportationMode"
                          value={formData.transportationMode}
                          onChange={(e) => handleFieldChange('transportationMode', e.target.value)}
                          placeholder="Enter transportation mode"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="transportationFee">Transportation Fee</Label>
                        <Input
                          id="transportationFee"
                          name="transportationFee"
                          value={formData.transportationFee}
                          onChange={(e) => handleFieldChange('transportationFee', e.target.value)}
                          placeholder="Enter transportation fee"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transportationAddress">Transportation Address</Label>
                      <Input
                        id="transportationAddress"
                        name="transportationAddress"
                        value={formData.transportationAddress}
                        onChange={(e) => handleFieldChange('transportationAddress', e.target.value)}
                        placeholder="Enter transportation address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pickingPoint">Pick Up Point</Label>
                        <Input
                          id="pickingPoint"
                          name="pickingPoint"
                          value={formData.pickingPoint}
                          onChange={(e) => handleFieldChange('pickingPoint', e.target.value)}
                          placeholder="Enter pick-up point"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="droppingPoint">Drop Off Point</Label>
                        <Input
                          id="droppingPoint"
                          name="droppingPoint"
                          value={formData.droppingPoint}
                          onChange={(e) => handleFieldChange('droppingPoint', e.target.value)}
                          placeholder="Enter drop off point"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson">Contact Person No.</Label>
                        <Input
                          id="contactPerson"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
                          placeholder="Enter contact person"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pickUpTime">Pick Up Time</Label>
                        <Input
                          id="pickUpTime"
                          name="pickUpTime"
                          type="time"
                          value={formData.pickUpTime}
                          onChange={(e) => handleFieldChange('pickUpTime', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dropOffTime">Drop Off Time</Label>
                        <Input
                          id="dropOffTime"
                          name="dropOffTime"
                          type="time"
                          value={formData.dropOffTime}
                          onChange={(e) => handleFieldChange('dropOffTime', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="registrationDate">Registration Date</Label>
                  <Input
                    type="date"
                    id="registrationDate"
                    name="registrationDate"
                    value={new Date().toISOString().split('T')[0]}
                    required
                    readOnly
                    disabled
                    className="bg-gray-100"
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
                    disabled
                    className="bg-gray-100"
                  />
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

      {/* Payment Details Dialog */}
      <Dialog open={isPaymentDetailsDialogOpen} onOpenChange={setIsPaymentDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View and manage payment information.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Invoice #{selectedPayment.invoiceId}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPayment.paymentDate ? format(new Date(selectedPayment.paymentDate), "MMMM dd, yyyy") : "Not set"}
                  </p>
                </div>
                <Badge
                  variant={
                    selectedPayment.status === "paid" ? "success" :
                      selectedPayment.status === "pending" ? "secondary" :
                        "destructive"
                  }
                  className="text-sm"
                >
                  {(selectedPayment.status || "pending").toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Billed To</h4>
                  <p className="font-medium">{selectedPayment.studentName || ""}</p>
                  <p className="text-sm">Student ID: {selectedPayment.studentId || ""}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Payment Info</h4>
                  <p className="text-sm">
                    <span className="font-medium">Due Date:</span> {selectedPayment.dueDate ? format(new Date(selectedPayment.dueDate), "MMMM dd, yyyy") : "Not set"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Method:</span> {selectedPayment.paymentMethod || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">DESCRIPTION</h4>
                <div className="border rounded-lg">
                  <div className="grid grid-cols-2 gap-4 p-4 border-b">
                    <div>Course Fee</div>
                    <div className="text-right">{(selectedPayment.courseFee || 0).toFixed(2)}</div>
                  </div>
                  {selectedPayment.registrationFee > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-4 border-b">
                      <div>Registration Fee</div>
                      <div className="text-right">{(selectedPayment.registrationFee || 0).toFixed(2)}</div>
                    </div>
                  )}
                  {selectedPayment.itemFee > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-4 border-b">
                      <div>Item Fee</div>
                      <div className="text-right">{(selectedPayment.itemFee || 0).toFixed(2)}</div>
                    </div>
                  )}
                  {selectedPayment.transportationFee > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-4 border-b">
                      <div>Transportation Fee</div>
                      <div className="text-right">{(selectedPayment.transportationFee || 0).toFixed(2)}</div>
                    </div>
                  )}
                  {selectedPayment.totalDiscounts > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-4 border-b text-red-600 font-medium">
                      <div>Total Discounts</div>
                      <div className="text-right">-{(selectedPayment.totalDiscounts || 0).toFixed(2)}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 p-4 border-t bg-gray-50">
                    <div className="font-bold">Total</div>
                    <div className="text-right font-bold">
                      AED {(selectedPayment.amount || ((selectedPayment.courseFee || 0) +
                        (selectedPayment.registrationFee || 0) +
                        (selectedPayment.itemFee || 0) +
                        (selectedPayment.transportationFee || 0) -
                        (selectedPayment.totalDiscounts || 0))).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {selectedPayment.remarks && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Remarks</h4>
                  <p className="text-sm">{selectedPayment.remarks}</p>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentDetailsDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => handlePrintInvoice(selectedPayment.invoiceId)}
                >
                  Print Invoice
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}