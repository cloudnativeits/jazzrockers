import { useEffect, useRef, useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight,Search,X } from 'lucide-react';
import { Download, Calendar, ChevronDown, BookOpen, User, XCircle, Clock, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircleIcon, ClockIcon, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Batch, Course, Department, Employee, Student, Brand, Branch, Enrollment } from "@shared/schema";
import ReactSelect from "react-select";
import { graphqlClient } from "@/lib/cubejs";
import { gql } from 'graphql-request';


import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import { StudentAttendanceReport } from "@/components/StudentAttendanceReport";
import { CreditNoteReport } from "@/components/credit-note-report";
import { ReceiptReport } from "@/components/ReceiptReport";
import { CompensationReport } from "@/components/CompensationReport";
import { UnpaidReport } from "@/components/UnpaidReport";
import { EnquiryReport } from "@/components/EnquiryReport";
import { InventoryReport } from "@/components/InventoryReport";
import { TransportReport } from "@/components/TransportReport";
import { InvoiceReport } from "@/components/InvoiceReport";
import { ScheduleReport } from "@/components/ScheduleReport";
import { DiscontinuedReport } from "@/components/DiscontinuedReport";
import { StudentListReport } from "@/components/StudentListReport";
import { BatchAttendanceReport } from "@/components/BatchAttendanceReport";
import { ParentDetailsReport } from "@/components/ParentDetailsReport";
import { isValid } from 'date-fns';
import PasswordModal from "@/components/PasswordModal";
import { InvoiceCancellationReport } from "@/components/InvoiceCancellationReport";
import { Newadmissionreport } from "@/components/Newadmissionreport";


const imageToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Define GraphQL Queries
const GET_ALL_ATTENDANCE_FOR_SUMMARY = gql`
  query GetAllAttendanceForSummary {
    cube {
      students {
        student_id
        fullName
      }
      attendance {
        date {
          value
        }
        status
        isCompensation
      }
      branches {
        name
      }
      courses {
        name,
        category
      }
      batches {
        name
      }
      employees { # Assuming teacher is an employee
        fullName
      }
      brands {
        name
      }
    }
  }
`;


const GET_STUDENT_ATTENDANCE = gql`
  query GetStudentAttendance($where: AttendanceWhereInput) {
    cube {
      attendance(where: $where, orderBy: { date: desc }) {
        # Add the missing field here
        firstName 
        
        status
        date {
          value
        }
        batchName
      }
    }
  }
`;

const GET_CREDIT_NOTES = gql`
  query GetCreditNotes {
    cube {
      credit_notes {
        status
        amount
        credit_note_number
        reason
        created_at {
          value
        }
      }
      students {
        fullName
      }
      brands {
        name
      }
      batches {
        name
      }
      branches {
        name
      }
      courses {
        name,
        category
      }
      employees {
        fullName
      }
    }
  }
`;

const GET_RECEIPTS = gql`
  query GetReceipts {
    cube {
      receipts {
        receipt_number
        amount
        receipt_date {
          value
        }
        payment_method
      }
      students {
        fullName
        is_re_registering
      }
      branches {
        name
      }
      batches {
        name
      }
      employees {
        fullName
      }
      courses {
        name,
        category
    }
        brands {
      name
    }
    }
  }
`;

const GET_COMPENSATION_DATA = gql`
  query GetCompensationData {
    cube {
      attendance {
        date {
          value
        }
        compensationDate
        status
        compensationBatchName
      }
      students {
        fullName
      }
      batches {
        name
      }
      employees {
        fullName
      }
      courses {
        name,
        category
      }
      brands {
        name
      }
      branches {
        name
      }
    }
  }
`;

const GET_INVOICES_DATA = gql`
  query GetInvoicesData {
    cube {
      invoices {
        totalAmount
        invoice_number
        issueDate {
          value
        }
        due_date {
          value
        }
        amount_paid
        balanceDue
        status
      }
      students {
        fullName
      }
      branches {
        name
      }
      courses {
        name,
        category
    }
      brands {
        name
      }
      batches {
        name
      }
      employees {
        fullName
      }
    }
  }
`;


const GET_ENQUIRIES_DATA = gql`
  query GetEnquiriesData {
    cube {
      students {
        fullName
        email
        phone
        status
        registration_date {
          value
        }
        branch # This is the branch ID
        course # This is the course ID
      }
      branches {
        name
      }
      courses {
        name
      }
    }
  }
`;

const GET_INVENTORY_DATA = gql`
  query GetInventoryData {
    cube {
      inventory {
        items
      }
      stock_item {
        stockQuantity
        updatedAt {
        value
      }
      }
    }
  }
`;

const GET_TRANSPORT_DATA = gql`
  query GetTransportData {
    cube {
      transportation {
        total_amount
        picking_point
        dropping_point
        created_at {
        value
      }
      }
      transportation_mode {
        mode
      }
      students {
        fullName
      }
      branches {
        name
      }
      courses {
        name
      }
      brands {
        name
      }
      batches {
        name
      }
      schedule {
        day
      }
    }
  }
`;

const GET_INVOICE_DATA = gql`
  query GetInvoiceData {
    cube {
      invoices {
        totalAmount
        invoice_number
        issueDate {
          value
        }
        dueDate {
          value
        }
        amountPaid
        balanceDue
        status
      }
      students {
        fullName
        is_re_registering
      }
      branches {
        name
      }
      courses {
        name,
        category
      }
      brands {
        name
      }
      batches {
        name
      }
      employees {
        fullName
      }
    }
  }
`;

const GET_SCHEDULE_DATA = gql`
  query GetScheduleData {
    cube {
      schedule {
        day
        start_time
        end_time
         created_at {
        value
        }

      }
      batches {
        name
      }
      employees {
        fullName
      }
      courses {
        name,
        category
      }
      brands {
        name
      }
      branches {
        name
      }
    }
  }
`;


const GET_ALL_ATTENDANCE_DATA = gql`
  query GetAllAttendanceData {
    cube {
      attendance {
        date {
          value
        }
        status
      }
      students {
        fullName
      }
      branches {
        name
      }
      brands {
        name
      }
      batches {
        name
      }
      courses {
        name,
        category
    }
      employees {
        fullName
      }
    }
  }
`;

const GET_STUDENT_LIST_DATA = gql`
  query GetStudentListData {
    cube {
      students {
        fullName
        email
        status 
        created_at {
        value
      }
      }
      branches {
        name
      }
      brands {
        name
      }
      batches {
        name
      }
      courses {
        name,
        category
      }
      employees {
        fullName
      }
      attendance {
        date {
          value
        }
        status
      }
    }
  }
`;


const GET_PARENT_DETAILS_DATA = gql`
  query GetParentDetailsData {
    cube {
      students {
        fullName
      }
      parents {
        fullName
        phone
        residence_address
        status
        email
        community
        created_at {
          value
        }
      }
      branches {
        name
      }
      brands {
        name
      }
      batches {
        name
      }
      courses {
        name,
        category
      }
      employees {
        fullName
      }
    }
  }
`;

// Add the new query for Invoice Cancellation data
const GET_INVOICE_CANCELLATION_DATA = gql`
  query GetInvoiceCancellationData {
    cube {
      invoices {
        created_at {
          value
        }
        status
        invoice_number # Add invoice number for detail
      }
      students {
        fullName
      }
      batches {
        name
      }
      branches {
        name
      }
      brands {
        name
      }
      courses {
        name,
        category
      }
      employees {
        fullName
      }
    }
  }
`;



// Add this interface at the top
interface FilterCondition {
  id: string;
  field: string;
  value: string;
}




const SearchableReportDropdown = ({ 
  activeTab, 
  setActiveTab, 
  setStartDate, 
  setEndDate 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const reports = [
    { value: 'batch_attendance_report', label: 'Batch Attendance' },
    { value: 'Credit note Report', label: 'Credit Note Report' },
    { value: 'receipt_report', label: 'Receipt Report' },
    { value: 'compensation_report', label: 'Compensation Report' },
    { value: 'unpaid_report', label: 'Unpaid Report' },
    { value: 'enquiry_report', label: 'Enquiry Report' },
    { value: 'inventory_report', label: 'Inventory Report' },
    { value: 'transport_report', label: 'Transport Report' },
    { value: 'invoice_report', label: 'Invoice Report' },
    { value: 'schedule_report', label: 'Schedule Report' },
    { value: 'discontinued_report', label: 'Discontinued Report' },
    { value: 'student_list_report', label: 'Student List' },
    { value: 'new_admission_report', label: 'New Admission' },
    { value: 'parent_details_report', label: 'Parent\'s Details' },
    { value: 'invoice_cancellation_report', label: 'Invoice Cancellations' }
  ];

  // Filter reports based on search term
  const filteredReports = reports.filter(report =>
    report.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedReport = reports.find(report => report.value === activeTab);

  const handleReportSelect = (newTab) => {
    setActiveTab(newTab);

    // Clear dates only for tabs that need it (same logic as your original)
    const tabsThatNeedDateClearance = [
      "batch_attendance_report",
      "Credit note Report",
      "receipt_report",
      "compensation_report",
      "unpaid_report",
      "enquiry_report",
      "inventory_report",
      "transport_report",
      "invoice_report",
      "schedule_report",
      "discontinued_report",
      "student_list_report",
      "new_admission_report",
      "parent_details_report",
      "invoice_cancellation_report"
    ];

    if (tabsThatNeedDateClearance.includes(newTab)) {
      setStartDate(null);
      setEndDate(null);
    }

    setIsOpen(false);
    setSearchTerm('');
  };

  const handleDropdownToggle = () => {
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  const clearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative mb-6 px-8" ref={dropdownRef}>
      <div className="relative w-full max-w-sm">
        <button
          onClick={handleDropdownToggle}
          className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        >
          <div className="flex items-center min-w-0">
            <span className="text-sm font-medium text-gray-700 mr-2 flex-shrink-0">
              Report:
            </span>
            <span className="text-sm font-medium text-gray-900 truncate">
              {selectedReport?.label || 'Select Report'}
            </span>
          </div>
          <ChevronDown 
            className={`ml-2 h-4 w-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => {
                setIsOpen(false);
                setSearchTerm('');
              }}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search reports..."
                  className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Reports List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredReports.length > 0 ? (
                <div className="py-1">
                  {filteredReports
                    .sort((a, b) => a.label.localeCompare(b.label)) // Add alphabetical sorting here
                    .map((report, index) => (
                      <button
                        key={report.value}
                        onClick={() => handleReportSelect(report.value)}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-150 ${
                          activeTab === report.value
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-900 hover:text-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          {activeTab === report.value && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0" />
                          )}
                          
                          {/* Highlight matching text */}
                          <span className="truncate">
                            {searchTerm ? (
                              <HighlightText text={report.label} searchTerm={searchTerm} />
                            ) : (
                              report.label
                            )}
                          </span>
                          
                          {activeTab === report.value && (
                            <div className="ml-auto">
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p>No reports found for "{searchTerm}"</p>
                  <button
                    onClick={clearSearch}
                    className="mt-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

// Helper component to highlight matching text
const HighlightText = ({ text, searchTerm }) => {
  if (!searchTerm) return text;

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <span key={index} className="bg-yellow-200 font-semibold">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default function AdminReports() {
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [activeTab, setActiveTab] = useState("batch_attendance_report");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<{ student: Student; batch?: Batch; } | null>(null);
  const [studentAttendanceRecords, setStudentAttendanceRecords] = useState<any[]>([]);
  const [selectedRegistrationType, setSelectedRegistrationType] = useState<string>("");
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [creditNoteFilterConditions, setCreditNoteFilterConditions] = useState<FilterCondition[]>([]);
  const [compensationFilterConditions, setCompensationFilterConditions] = useState<FilterCondition[]>([]);
  const [unpaidFilterConditions, setUnpaidFilterConditions] = useState<FilterCondition[]>([]);
  const [enquiryFilterConditions, setEnquiryFilterConditions] = useState<FilterCondition[]>([]);
  const [selectedItemName, setSelectedItemName] = useState<string>("");
  const [transportFilterConditions, setTransportFilterConditions] = useState<FilterCondition[]>([]);
  const [invoiceFilterConditions, setInvoiceFilterConditions] = useState<FilterCondition[]>([]);
  const [scheduleFilterConditions, setScheduleFilterConditions] = useState<FilterCondition[]>([]);
  const [inventoryFilterConditions, setInventoryFilterConditions] = useState<FilterCondition[]>([]);
  const [discontinuedFilterConditions, setDiscontinuedFilterConditions] = useState<FilterCondition[]>([]);
  const [studentListFilterConditions, setStudentListFilterConditions] = useState<FilterCondition[]>([]);
  const [batchAttendanceFilterConditions, setBatchAttendanceFilterConditions] = useState<FilterCondition[]>([]);
  const [parentDetailsFilterConditions, setParentDetailsFilterConditions] = useState<FilterCondition[]>([]);
  const [scheduleStartDate, setScheduleStartDate] = useState<string | null>(null);
  const [scheduleEndDate, setScheduleEndDate] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState<any>(null);
  const [cancellationFilterConditions, setCancellationFilterConditions] = useState<FilterCondition[]>([]);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);



  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: teachers = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: batches = [] } = useQuery<Batch[]>({ queryKey: ["/api/batches"] });
  const { data: branchesData = [] } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });
  const { data: allBatchesStudents = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: enrollments = [] } = useQuery<Enrollment[]>({ queryKey: ["/api/enrollments"] });



  const handleDateRangeChange = (dates: { startDate: string | null; endDate: string | null }) => {
    setDateRange(dates);
    console.log('Date Range Changed:', dates);

    setStartDate(dates.startDate ? new Date(dates.startDate) : null);
    setEndDate(dates.endDate ? new Date(dates.endDate) : null);
  };



  // Revenue data for charts
  const revenueData = [
    { month: "Jan", revenue: 750000, expenses: 420000, profit: 330000 },
    { month: "Feb", revenue: 820000, expenses: 450000, profit: 370000 },
    { month: "Mar", revenue: 880000, expenses: 470000, profit: 410000 },
    { month: "Apr", revenue: 850000, expenses: 460000, profit: 390000 },
    { month: "May", revenue: 920000, expenses: 480000, profit: 440000 },
    { month: "Jun", revenue: 980000, expenses: 510000, profit: 470000 },
    { month: "Jul", revenue: 1020000, expenses: 530000, profit: 490000 },
    { month: "Aug", revenue: 950000, expenses: 500000, profit: 450000 },
    { month: "Sep", revenue: 880000, expenses: 480000, profit: 400000 },
    { month: "Oct", revenue: 940000, expenses: 510000, profit: 430000 },
    { month: "Nov", revenue: 1050000, expenses: 550000, profit: 500000 },
    { month: "Dec", revenue: 1150000, expenses: 600000, profit: 550000 },
  ];

  // Student distribution data
  const studentDistributionData = [
    { name: "Music", value: 650, color: "#3949ab" },
    { name: "Dance", value: 320, color: "#f57c00" },
    { name: "Art", value: 180, color: "#48bb78" },
  ];

  // Branch performance data
  const branchPerformanceData = [
    { name: "Main Branch", students: 540, revenue: 650000, profit: 320000 },
    { name: "North Campus", students: 320, revenue: 380000, profit: 180000 },
    { name: "South Campus", students: 260, revenue: 310000, profit: 150000 },
    { name: "East Campus", students: 210, revenue: 250000, profit: 120000 },
  ];

  // Attendance data
  const attendanceData = [
    { month: "Jan", attendance: 92 },
    { month: "Feb", attendance: 88 },
    { month: "Mar", attendance: 91 },
    { month: "Apr", attendance: 85 },
    { month: "May", attendance: 89 },
    { month: "Jun", attendance: 94 },
    { month: "Jul", attendance: 90 },
    { month: "Aug", attendance: 87 },
    { month: "Sep", attendance: 92 },
    { month: "Oct", attendance: 94 },
    { month: "Nov", attendance: 91 },
    { month: "Dec", attendance: 88 },
  ];
  // Format large currency amounts
  const formatLargeAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `₹${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  // Helper functions
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




  const studentWhereClause = useMemo(() => {
    const where: any = { AND: [] };
    if (selectedStudent?.student?.id) {
      where.AND.push({ studentId: { equals: selectedStudent.student.id } });
    }

    // --- THE FIX ---
    // Replace gte/lte with the correct operators for this cube's date filter.
    if (startDate) {
      where.AND.push({ date: { afterDate: startDate.toISOString().split('T')[0] } });
    }
    if (endDate) {
      where.AND.push({ date: { beforeDate: endDate.toISOString().split('T')[0] } });
    }

    return where.AND.length > 0 ? where : {};
  }, [selectedStudent, startDate, endDate]);

  const { data: studentAttendanceData, isLoading: isStudentDataLoading } = useQuery({
    queryKey: ['studentAttendance', studentWhereClause],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_STUDENT_ATTENDANCE, { where: studentWhereClause });

      // response.cube is an array of [{ attendance: {...} }, { attendance: {...} }]
      // We need to extract the nested `attendance` object from each item.
      const transformedData = response.cube.map(item => item.attendance);
      console.log('Transformed Student Attendance Data:', transformedData);


      // transformedData is now a clean array: [{...}, {...}]
      return transformedData;
    },
    enabled: !!selectedStudent,
  });

  useEffect(() => {
    if (studentAttendanceData) {
      setStudentAttendanceRecords(studentAttendanceData);
    } else {
      setStudentAttendanceRecords([]);
    }
  }, [studentAttendanceData]);


  // credit note report

  const handleCreditNoteFiltersChange = (filters: FilterCondition[]) => {
    console.log('Active credit note filters:', filters);
    setCreditNoteFilterConditions(filters);
  };

  const getCreditNoteNameFromId = (field: string, value: string) => {
    switch (field) {
      case 'brand':
        return brands.find(b => b.id.toString() === value)?.name;
      case 'department':
        return departments.find(d => d.id.toString() === value)?.name;
      case 'course':
        return courses.find(c => c.id.toString() === value)?.name;
      case 'batch':
        return batches.find(b => b.id.toString() === value)?.name;
      case 'branch':
        return branchesData.find(b => b.id.toString() === value)?.name;
      case 'teacher':
        const teacher = teachers.find(t => t.id.toString() === value);
        return teacher ? `${teacher.firstName} ${teacher.lastName}` : null;
      case 'student':
        const student = allBatchesStudents.find(s => s.id.toString() === value);
        return student ? `${student.firstName} ${student.lastName}` : null;
      case 'status':
        return value; // Status is already a string value, not an ID
      default:
        return null;
    }
  };



  const creditNoteWhereClause = useMemo(() => {
    const where: any = { AND: [] };

    // Use the state variables from AdminReports to filter
    if (selectedBrand) {
      const brand = brands.find(b => b.id.toString() === selectedBrand);
      if (brand) where.AND.push({ brands_name: { equals: brand.name } });
    }
    if (selectedDepartment) {
      const department = departments.find(d => d.id.toString() === selectedDepartment);
      if (department) where.AND.push({ departments_name: { equals: department.name } });
    }
    if (selectedCourse) {
      const course = courses.find(c => c.id.toString() === selectedCourse);
      if (course) where.AND.push({ courses_name: { equals: course.name } });
    }
    if (selectedTeacher) {
      const teacher = teachers.find(t => t.id.toString() === selectedTeacher);
      if (teacher) where.AND.push({ employees_fullName: { equals: `${teacher.firstName} ${teacher.lastName}` } });
    }
    if (selectedBatch) {
      const batch = batches.find(b => b.id.toString() === selectedBatch);
      if (batch) where.AND.push({ batches_name: { equals: batch.name } });
    }
    // Note: Filtering by student name would require another state for the search term
    if (startDate) {
      where.AND.push({ credit_notes_created_at: { afterDate: startDate.toISOString().split("T")[0] } });
    }
    if (endDate) {
      where.AND.push({ credit_notes_created_at: { beforeDate: endDate.toISOString().split("T")[0] } });
    }

    return where.AND.length > 0 ? where : {};
  }, [
    selectedBrand, selectedDepartment, selectedCourse, selectedTeacher, selectedBatch, startDate, endDate,
    brands, departments, courses, teachers, batches // Dependencies
  ]);

  // FIX 3: Add the useQuery hook to fetch credit note data.
  const { data: creditNoteApiResponse, isLoading: isCreditNoteLoading } = useQuery({
    queryKey: ['allCreditNotesData'], // A simple key as the query is static
    queryFn: async () => {
      // This query does not take variables
      const response = await graphqlClient.request(GET_CREDIT_NOTES);
      console.log('Raw Credit Note API Response:', response);
      
      return response.cube; // Return the array of combined objects
    },
  });


  const flattenedCreditNotes = useMemo(() => {
    if (!creditNoteApiResponse) return [];

    return creditNoteApiResponse.map(row => ({
      // Create a new, simple object for each row of the response
      status: row.credit_notes?.status,
      amount: row.credit_notes?.amount,
      credit_note_number: row.credit_notes?.credit_note_number,
      reason: row.credit_notes?.reason,
      created_at: row.credit_notes?.created_at?.value,
      student_name: row.students?.fullName,
      brand_name: row.brands?.name,
      batch_name: row.batches?.name,
      branch_name: row.branches?.name,
      course_name: row.courses?.name,
      department_name: row.courses.category,
      employee_name: row.employees?.fullName,
    }));
  }, [creditNoteApiResponse]);

  // 3. FILTER THE FLATTENED DATA ON THE CLIENT-SIDE
  const filteredCreditNotes = useMemo(() => {
  return flattenedCreditNotes.filter(note => {
    // Date filters
    if (startDate && new Date(note.created_at) < startDate) return false;
    if (endDate && new Date(note.created_at) > endDate) return false;

    // Advanced filter conditions
    return creditNoteFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | undefined;

      // Get the field value from the note object
      switch (condition.field) {
        case "student":
          fieldValue = note.student_name?.toLowerCase();
          break;
        case "branch":
          fieldValue = note.branch_name?.toLowerCase();
          break;
        case "brand":
          fieldValue = note.brand_name?.toLowerCase();
          break;
        case "department":
          fieldValue = note.department_name?.toLowerCase();
          break;
        case "batch":
          fieldValue = note.batch_name?.toLowerCase();
          break;
        case "course":
          fieldValue = note.course_name?.toLowerCase();
          break;
        case "teacher":
          fieldValue = note.employee_name?.toLowerCase();
          break;
        case "status":
          fieldValue = note.status?.toLowerCase();
          break;
        case "credit_note_number":
          fieldValue = note.credit_note_number?.toString().toLowerCase();
          break;
        case "amount":
          fieldValue = note.amount?.toString().toLowerCase();
          break;
        case "reason":
          fieldValue = note.reason?.toLowerCase();
          break;
        default:
          return true;
      }

      // ✅ Multi-select support
      if (Array.isArray(condition.value)) {
        const conditionValues = condition.value.map(v => v.toString().toLowerCase());
        switch (condition.operator) {
          case "equals":
            return conditionValues.includes(fieldValue || "");
          case "notEquals":
            return !conditionValues.includes(fieldValue || "");
          case "contains":
            return conditionValues.some(v => (fieldValue || "").includes(v));
          case "notContains":
            return conditionValues.every(v => !(fieldValue || "").includes(v));
          case "startsWith":
            return conditionValues.some(v => (fieldValue || "").startsWith(v));
          case "endsWith":
            return conditionValues.some(v => (fieldValue || "").endsWith(v));
          default:
            return true;
        }
      } else {
        const conditionValue = condition.value?.toString().toLowerCase() || "";
        switch (condition.operator) {
          case "equals":
            return fieldValue === conditionValue;
          case "notEquals":
            return fieldValue !== conditionValue;
          case "contains":
            return (fieldValue || "").includes(conditionValue);
          case "notContains":
            return !(fieldValue || "").includes(conditionValue);
          case "startsWith":
            return (fieldValue || "").startsWith(conditionValue);
          case "endsWith":
            return (fieldValue || "").endsWith(conditionValue);
          case "isEmpty":
            return !fieldValue || fieldValue.trim() === "";
          case "isNotEmpty":
            return !!fieldValue && fieldValue.trim() !== "";
          case "greaterThan":
            if (condition.field === "amount") {
              return parseFloat(note.amount || "0") > parseFloat(conditionValue);
            }
            return (fieldValue || "") > conditionValue;
          case "lessThan":
            if (condition.field === "amount") {
              return parseFloat(note.amount || "0") < parseFloat(conditionValue);
            }
            return (fieldValue || "") < conditionValue;
          default:
            return true;
        }
      }
    });
  });
}, [flattenedCreditNotes, startDate, endDate, creditNoteFilterConditions]);





  const handleCreditNoteExport = async (type: "excel" | "pdf") => {
    if (!filteredCreditNotes || filteredCreditNotes.length === 0) {
      alert("No data available to export.");
      return;
    }

    let periodText: string;
    if (startDate && endDate) {
      periodText = `${format(startDate, "dd-MM-yyyy")} to ${format(endDate, "dd-MM-yyyy")}`;
    } else if (startDate) {
      periodText = `from ${format(startDate, "dd-MM-yyyy")}`;
    } else {
      periodText = `for all time`;
    }
    const fileSafePeriod = periodText.replace(/ /g, '_').replace(/,/g, '');
    const fileName = `Credit-Note-Report-${fileSafePeriod}`;

    if (type === 'excel') {
      const excelData = filteredCreditNotes.map((note, index) => ({
        "SL No": index + 1,
        "Credit Note #": note.credit_note_number,
        "Student Name": note.student_name,
        "Branch": note.branch_name,
        "Amount": note.amount,
        "Batch": note.batch_name,
        "Course": note.course_name,
        "Brand": note.brand_name,
        "Department": note.department_name,
        "Created By": note.employee_name,
        "Status": note.status,
        "Date": note.created_at ? format(new Date(note.created_at), "MMM d, yyyy") : 'N/A',
        "Reason": note.reason,
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Credit Note Report");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }

    if (type === 'pdf') {
      const doc = new jsPDF('l', 'pt', 'a4'); // 'l' for landscape mode
      const pageWidth = doc.internal.pageSize.width;

      // Add Header Image
      const logoBase64 = await imageToBase64('/header.png');
      const dimensions = await getImageDimensions(logoBase64);
      const scaleFactor = 0.25;
      const imgWidth = dimensions.width * scaleFactor;
      const imgHeight = dimensions.height * scaleFactor;
      doc.addImage(logoBase64, 'PNG', 40, 40, imgWidth, imgHeight);

      // Add Main Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("Credit Note Report", pageWidth / 2.5, 140, { align: 'center' });

      // Add Sub-details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let startY = 170;
      doc.text(`Period: ${periodText}`, 40, startY);
      startY += 15;
      doc.text(`Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}`, 40, startY);

      // Add Table
      const tableColumn = ["#", "Date", "Credit Note #", "Student", "Branch", "Amount", "Batch", "Course", "Status"];
      const tableRows: (string | number)[][] = [];

      filteredCreditNotes.forEach((note, index) => {
        const rowData = [
          index + 1,
          note.created_at ? format(new Date(note.created_at), "dd-MM-yy") : 'N/A',
          note.credit_note_number,
          note.student_name,
          note.branch_name,
          note.amount,
          note.batch_name,
          note.course_name,
          note.status,
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY + 10,
        theme: 'grid',
        headStyles: { fillColor: [38, 52, 102], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 25 }, 4: { cellWidth: 50 }, 5: { halign: 'right' } }
      });

      doc.save(`${fileName}.pdf`);
    }
  };



  // receipt report

  const { data: receiptsApiResponse, isLoading: isReceiptsLoading } = useQuery({
    queryKey: ['allReceiptsData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_RECEIPTS);
      return response.cube;
    },
  });

  // Your existing flattened receipts (no change)
  const flattenedReceipts = useMemo(() => {
    if (!receiptsApiResponse) return [];
    return receiptsApiResponse.map(row => ({
      receipt_number: row.receipts?.receipt_number,
      amount: row.receipts?.amount,
      receipt_date: row.receipts?.receipt_date?.value,
      payment_method: row.receipts?.payment_method,
      student_name: row.students?.fullName,
      is_re_registering: row.students?.is_re_registering?.toLowerCase() === "yes",
      branch_name: row.branches?.name,
      brand_name: row.brands?.name,
      course_name: row.courses?.name,
      department_name: row.courses?.category,
      batch_name: row.batches?.name,
      employee_name: row.employees?.fullName,
    }));
  }, [receiptsApiResponse]);

  // NEW: Handler for filter changes
  const handleFiltersChange = (filters: FilterCondition[]) => {
    console.log('Active filters:', filters);
    setFilterConditions(filters);
  };

  // Helper function to get name from ID based on field type
  const getNameFromId = (field: string, value: string) => {
    switch (field) {
      case 'brand':
        return brands.find(b => b.id.toString() === value)?.name;
      case 'department':
        return departments.find(d => d.id.toString() === value)?.name;
      case 'course':
        return courses.find(c => c.id.toString() === value)?.name;
      case 'batch':
        return batches.find(b => b.id.toString() === value)?.name;
      case 'branch':
        return branchesData.find(b => b.id.toString() === value)?.name;
      case 'teacher':
        const teacher = teachers.find(t => t.id.toString() === value);
        return teacher ? `${teacher.firstName} ${teacher.lastName}` : null;
      case 'student':
        const student = allBatchesStudents.find(s => s.id.toString() === value);
        return student ? (student.fullName || `${student.firstName} ${student.lastName}`) : null;
      case 'registrationType':
        return value; // This is already the type value, not an ID
      default:
        return null;
    }
  };



  const filteredReceipts = useMemo(() => {
  return flattenedReceipts.filter(receipt => {
    // Date filters
    if (startDate && new Date(receipt.receipt_date) < startDate) return false;
    if (endDate && new Date(receipt.receipt_date) > endDate) return false;

    // Advanced filter conditions
    return filterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | number | boolean | undefined;

      // Get the field value from the receipt object
      switch (condition.field) {
        case "student":
          fieldValue = receipt.student_name?.toLowerCase();
          break;
        case "branch":
          fieldValue = receipt.branch_name?.toLowerCase();
          break;
        case "brand":
          fieldValue = receipt.brand_name?.toLowerCase();
          break;
        case "department":
          fieldValue = receipt.department_name?.toLowerCase();
          break;
        case "batch":
          fieldValue = receipt.batch_name?.toLowerCase();
          break;
        case "course":
          fieldValue = receipt.course_name?.toLowerCase();
          break;
        case "teacher":
          fieldValue = receipt.employee_name?.toLowerCase();
          break;
        case "registrationType":
          fieldValue = receipt.is_re_registering;
          break;
        case "paymentMethod":
          fieldValue = receipt.payment_method?.toLowerCase();
          break;
        case "amount":
          fieldValue = parseFloat(receipt.amount || "0");
          break;
        case "receiptNumber":
          fieldValue = receipt.receipt_number?.toString().toLowerCase();
          break;
        default:
          return true;
      }

      // ✅ Multi-select support
      if (Array.isArray(condition.value)) {
        const conditionValues = condition.value.map(v =>
          v?.toString().toLowerCase()
        );

        switch (condition.operator) {
          case "equals":
            return conditionValues.includes(fieldValue?.toString().toLowerCase() || "");
          case "notEquals":
            return !conditionValues.includes(fieldValue?.toString().toLowerCase() || "");
          case "contains":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").includes(v)
            );
          case "notContains":
            return conditionValues.every(v =>
              !(fieldValue?.toString().toLowerCase() || "").includes(v)
            );
          case "startsWith":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").startsWith(v)
            );
          case "endsWith":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").endsWith(v)
            );
          default:
            return true;
        }
      } else {
        const conditionValue =
          typeof condition.value === "string"
            ? condition.value.toLowerCase()
            : condition.value;

        switch (condition.operator) {
          case "equals":
            return fieldValue == conditionValue;
          case "notEquals":
            return fieldValue != conditionValue;
          case "contains":
            return fieldValue?.toString().includes(conditionValue);
          case "notContains":
            return !fieldValue?.toString().includes(conditionValue);
          case "startsWith":
            return fieldValue?.toString().startsWith(conditionValue);
          case "endsWith":
            return fieldValue?.toString().endsWith(conditionValue);
          case "isEmpty":
            return !fieldValue || fieldValue.toString().trim() === "";
          case "isNotEmpty":
            return !!fieldValue && fieldValue.toString().trim() !== "";
          case "greaterThan":
            return typeof fieldValue === "number"
              ? fieldValue > Number(conditionValue)
              : false;
          case "lessThan":
            return typeof fieldValue === "number"
              ? fieldValue < Number(conditionValue)
              : false;
          default:
            return true;
        }
      }
    });
  });
}, [
  flattenedReceipts,
  startDate,
  endDate,
  filterConditions,
  brands,
  departments,
  courses,
  batches,
  teachers,
  allBatchesStudents,
  branchesData,
]);


  const handleReceiptExport = async (type: "excel" | "pdf") => {
    if (!filteredReceipts || filteredReceipts.length === 0) {
      return alert("No data to export.");
    }
    let periodText: string;
    if (startDate && endDate) {
      periodText = `${format(startDate, "dd-MM-yyyy")} to ${format(endDate, "dd-MM-yyyy")}`;
    } else if (startDate) {
      periodText = `from ${format(startDate, "dd-MM-yyyy")}`;
    } else {
      periodText = `for all time`;
    }
    const fileSafePeriod = periodText.replace(/ /g, '_').replace(/,/g, '');
    const fileName = `Receipt-Report-${fileSafePeriod}`;

    if (type === 'excel') {
      const excelData = filteredReceipts.map((receipt, index) => ({
        "SL No": index + 1, "Receipt #": receipt.receipt_number, "Student Name": receipt.student_name,
        "Batch": receipt.batch_name, "Amount": receipt.amount, "Payment Method": receipt.payment_method,
        "Date": format(new Date(receipt.receipt_date), "MMM d, yyyy"), "Branch": receipt.branch_name
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Receipts");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else { // PDF Logic
      const doc = new jsPDF('l', 'pt', 'a4');
      const logoBase64 = await imageToBase64('/header.png');
      const dimensions = await getImageDimensions(logoBase64);
      const scaleFactor = 0.25;
      doc.addImage(logoBase64, 'PNG', 40, 40, dimensions.width * scaleFactor, dimensions.height * scaleFactor);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text("Receipt Report", doc.internal.pageSize.width / 2, 80, { align: 'center' });
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      let startY = 150;
      doc.text(`Period: ${periodText}`, 40, startY); startY += 15;
      doc.text(`Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}`, 40, startY);

      const tableColumn = ["#", "Date", "Receipt #", "Student", "Registration", "Amount", "Method", "Batch", "Branch"];
      const tableRows = filteredReceipts.map((receipt, index) => [
        index + 1, format(new Date(receipt.receipt_date), "dd-MM-yy"), receipt.receipt_number,
        receipt.student_name, receipt.is_re_registering ? "Re-Reg" : "New", receipt.amount,
        receipt.payment_method, receipt.batch_name, receipt.branch_name
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: startY + 10, theme: 'grid', headStyles: { fillColor: [38, 52, 102] } });
      doc.save(`${fileName}.pdf`);
    }
  };


  // --- COMPENSATION REPORT DATA LOGIC ---
  const { data: compensationApiResponse, isLoading: isCompensationLoading } = useQuery({
    queryKey: ['allCompensationData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_COMPENSATION_DATA);
      return response.cube;
    },
  });

  const flattenedCompensationData = useMemo(() => {
  if (!compensationApiResponse) return [];

  return compensationApiResponse
    // Filter only for compensation records
    .filter(row => row.attendance?.compensationBatchName)
    .map(row => {
      // Use compensationDate if available, otherwise fall back to regular date
      const compDate = row.attendance?.compensationDate || row.attendance?.date?.value;
      
      return {
        compensation_date: compDate,
        status: row.attendance?.status,
        compensation_batch_name: row.attendance?.compensationBatchName,
        student_name: row.students?.fullName,
        batch_name: row.batches?.name,
        teacher_name: row.employees?.fullName,
        course_name: row.courses?.name,
        brand_name: row.brands?.name,
        department_name: row.courses?.category,
        branch_name: row.branches?.name,
      };
    });
}, [compensationApiResponse]);
  const handleCompensationFiltersChange = (filters: FilterCondition[]) => {
    setCompensationFilterConditions(filters);
  };

  const filteredCompensationData = useMemo(() => {
  return flattenedCompensationData.filter(comp => {
    // Date filters
    if (startDate && new Date(comp.compensation_date) < startDate) return false;
    if (endDate && new Date(comp.compensation_date) > endDate) return false;

    // Advanced filter conditions
    return compensationFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | undefined;

      // Get the field value from the compensation object
      switch (condition.field) {
        case "student":
          fieldValue = comp.student_name?.toLowerCase();
          break;
        case "branch":
          fieldValue = comp.branch_name?.toLowerCase();
          break;
        case "brand":
          fieldValue = comp.brand_name?.toLowerCase();
          break;
        case "department":
          fieldValue = comp.department_name?.toLowerCase();
          break;
        case "batch":
          fieldValue = comp.batch_name?.toLowerCase();
          break;
        case "course":
          fieldValue = comp.course_name?.toLowerCase();
          break;
        case "teacher":
          fieldValue = comp.teacher_name?.toLowerCase();
          break;
        case "compensationBatch":
          fieldValue = comp.compensation_batch_name?.toLowerCase();
          break;
        default:
          return true;
      }

      // ✅ Multi-select support
      if (Array.isArray(condition.value)) {
        const conditionValues = condition.value.map(v =>
          v?.toString().toLowerCase()
        );

        switch (condition.operator) {
          case "equals":
            return conditionValues.includes(fieldValue || "");
          case "notEquals":
            return !conditionValues.includes(fieldValue || "");
          case "contains":
            return conditionValues.some(v =>
              (fieldValue || "").includes(v)
            );
          case "notContains":
            return conditionValues.every(v =>
              !(fieldValue || "").includes(v)
            );
          case "startsWith":
            return conditionValues.some(v =>
              (fieldValue || "").startsWith(v)
            );
          case "endsWith":
            return conditionValues.some(v =>
              (fieldValue || "").endsWith(v)
            );
          default:
            return true;
        }
      } else {
        const conditionValue = condition.value
          ?.toString()
          .toLowerCase() || "";

        switch (condition.operator) {
          case "equals":
            return fieldValue === conditionValue;
          case "notEquals":
            return fieldValue !== conditionValue;
          case "contains":
            return (fieldValue || "").includes(conditionValue);
          case "notContains":
            return !(fieldValue || "").includes(conditionValue);
          case "startsWith":
            return (fieldValue || "").startsWith(conditionValue);
          case "endsWith":
            return (fieldValue || "").endsWith(conditionValue);
          case "isEmpty":
            return !fieldValue || fieldValue.trim() === "";
          case "isNotEmpty":
            return !!fieldValue && fieldValue.trim() !== "";
          default:
            return true;
        }
      }
    });
  });
}, [
  flattenedCompensationData,
  startDate,
  endDate,
  compensationFilterConditions,
]);


  // --- UNPAID REPORT DATA LOGIC ---
  const { data: invoicesApiResponse, isLoading: isUnpaidLoading } = useQuery({
    queryKey: ['allInvoicesData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_INVOICES_DATA);
      return response.cube;
    },
  });

  const flattenedInvoices = useMemo(() => {
    if (!invoicesApiResponse) return [];

    // Transform the raw data and pre-filter for only unpaid or partially paid invoices
    return invoicesApiResponse
      .filter(row => {
        const status = row.invoices?.status?.toLowerCase();
        const balance = parseFloat(row.invoices?.balanceDue);
        return status === 'unpaid' || status === 'partially_paid' || balance > 0;
      })
      .map(row => ({
        totalAmount: row.invoices?.total_amount,
        invoice_number: row.invoices?.invoice_number,
        issueDate: row.invoices?.issueDate?.value,
        due_date: row.invoices?.due_date?.value,
        amount_paid: row.invoices?.amount_paid,
        balanceDue: row.invoices?.balanceDue,
        status: row.invoices?.status,
        student_name: row.students?.fullName,
        branch_name: row.branches?.name,
        course_name: row.courses?.name,
        brand_name: row.brands?.name,
        department_name: row.courses?.category,
        batch_name: row.batches?.name,
        employee_name: row.employees?.fullName,
      }));
  }, [invoicesApiResponse]);

  const handleUnpaidFiltersChange = (filters: FilterCondition[]) => {
    setUnpaidFilterConditions(filters);
  };

  const filteredUnpaidInvoices = useMemo(() => {
  return flattenedInvoices.filter(invoice => {
    // Date filters apply to the due date
    if (startDate && new Date(invoice.due_date) < startDate) return false;
    if (endDate && new Date(invoice.due_date) > endDate) return false;

    // Advanced filter conditions
    return unpaidFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | number;
      let conditionValue = condition.value;

      // Get the field value from the invoice object
      switch (condition.field) {
        case 'student':
          fieldValue = invoice.student_name?.toLowerCase() || '';
          // Handle multi-select for student
          if (Array.isArray(conditionValue)) {
            const conditionValues = conditionValue.map(v => 
              getNameFromId('student', v)?.toLowerCase() || ''
            );
            break;
          } else {
            conditionValue = getNameFromId('student', conditionValue)?.toLowerCase() || '';
          }
          break;
        case 'branch':
          fieldValue = invoice.branch_name?.toLowerCase() || '';
          // Handle multi-select for branch
          if (Array.isArray(conditionValue)) {
            const conditionValues = conditionValue.map(v => 
              getNameFromId('branch', v)?.toLowerCase() || ''
            );
            break;
          } else {
            conditionValue = getNameFromId('branch', conditionValue)?.toLowerCase() || '';
          }
          break;
        case 'brand':
          fieldValue = invoice.brand_name?.toLowerCase() || '';
          // Handle multi-select for brand
          if (Array.isArray(conditionValue)) {
            const conditionValues = conditionValue.map(v => 
              getNameFromId('brand', v)?.toLowerCase() || ''
            );
            break;
          } else {
            conditionValue = getNameFromId('brand', conditionValue)?.toLowerCase() || '';
          }
          break;
        case 'department':
          fieldValue = invoice.department_name?.toLowerCase() || '';
          // Handle multi-select for department
          if (Array.isArray(conditionValue)) {
            const conditionValues = conditionValue.map(v => 
              getNameFromId('department', v)?.toLowerCase() || ''
            );
            break;
          } else {
            conditionValue = getNameFromId('department', conditionValue)?.toLowerCase() || '';
          }
          break;
        case 'batch':
          fieldValue = invoice.batch_name?.toLowerCase() || '';
          // Handle multi-select for batch
          if (Array.isArray(conditionValue)) {
            const conditionValues = conditionValue.map(v => 
              getNameFromId('batch', v)?.toLowerCase() || ''
            );
            break;
          } else {
            conditionValue = getNameFromId('batch', conditionValue)?.toLowerCase() || '';
          }
          break;
        case 'course':
          fieldValue = invoice.course_name?.toLowerCase() || '';
          // Handle multi-select for course
          if (Array.isArray(conditionValue)) {
            const conditionValues = conditionValue.map(v => 
              getNameFromId('course', v)?.toLowerCase() || ''
            );
            break;
          } else {
            conditionValue = getNameFromId('course', conditionValue)?.toLowerCase() || '';
          }
          break;
        case 'teacher':
          fieldValue = invoice.employee_name?.toLowerCase() || '';
          // Handle multi-select for teacher
          if (Array.isArray(conditionValue)) {
            const conditionValues = conditionValue.map(v => 
              getNameFromId('teacher', v)?.toLowerCase() || ''
            );
            break;
          } else {
            conditionValue = getNameFromId('teacher', conditionValue)?.toLowerCase() || '';
          }
          break;
        case 'status':
          fieldValue = invoice.status?.toLowerCase() || '';
          // Handle multi-select for status
          if (Array.isArray(conditionValue)) {
            const conditionValues = conditionValue.map(v => v.toLowerCase());
            break;
          } else {
            conditionValue = conditionValue.toLowerCase();
          }
          break;
        case 'invoiceNumber':
          fieldValue = invoice.invoice_number?.toString().toLowerCase() || '';
          break;
        case 'amountDue':
          fieldValue = parseFloat(invoice.balanceDue || '0');
          conditionValue = parseFloat(conditionValue || '0');
          break;
        default:
          return true;
      }

      // ✅ Multi-select support
      if (Array.isArray(conditionValue)) {
        const conditionValues = conditionValue.map(v => 
          v?.toString().toLowerCase()
        );

        switch (condition.operator) {
          case "equals":
            return conditionValues.includes(fieldValue?.toString() || "");
          case "notEquals":
            return !conditionValues.includes(fieldValue?.toString() || "");
          case "contains":
            return conditionValues.some(v =>
              (fieldValue?.toString() || "").includes(v)
            );
          case "notContains":
            return conditionValues.every(v =>
              !(fieldValue?.toString() || "").includes(v)
            );
          case "startsWith":
            return conditionValues.some(v =>
              (fieldValue?.toString() || "").startsWith(v)
            );
          case "endsWith":
            return conditionValues.some(v =>
              (fieldValue?.toString() || "").endsWith(v)
            );
          case "greaterThan":
            // For numeric comparisons with multiple values, check if any value is greater
            if (typeof fieldValue === 'number') {
              return conditionValues.some(v => 
                fieldValue > parseFloat(v || '0')
              );
            }
            return false;
          case "lessThan":
            // For numeric comparisons with multiple values, check if any value is less
            if (typeof fieldValue === 'number') {
              return conditionValues.some(v => 
                fieldValue < parseFloat(v || '0')
              );
            }
            return false;
          default:
            return true;
        }
      } else {
        // Single value logic
        const singleConditionValue = conditionValue?.toString().toLowerCase() || '';

        switch (condition.operator) {
          case 'equals':
            return fieldValue?.toString() === singleConditionValue;
          case 'notEquals':
            return fieldValue?.toString() !== singleConditionValue;
          case 'contains':
            return fieldValue.toString().includes(singleConditionValue);
          case 'notContains':
            return !fieldValue.toString().includes(singleConditionValue);
          case 'startsWith':
            return fieldValue.toString().startsWith(singleConditionValue);
          case 'endsWith':
            return fieldValue.toString().endsWith(singleConditionValue);
          case 'isEmpty':
            return !fieldValue || fieldValue.toString().trim() === '';
          case 'isNotEmpty':
            return !!fieldValue && fieldValue.toString().trim() !== '';
          case 'greaterThan':
            return typeof fieldValue === 'number' ? 
              fieldValue > parseFloat(singleConditionValue || '0') : false;
          case 'lessThan':
            return typeof fieldValue === 'number' ? 
              fieldValue < parseFloat(singleConditionValue || '0') : false;
          default:
            return true;
        }
      }
    });
  });
}, [flattenedInvoices, startDate, endDate, unpaidFilterConditions]);

  // --- ENQUIRY REPORT DATA LOGIC ---
  const { data: enquiriesApiResponse, isLoading: isEnquiriesLoading } = useQuery({
    queryKey: ['allEnquiriesData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_ENQUIRIES_DATA);
      return response.cube;
    },
  });

  const flattenedEnquiries = useMemo(() => {
    if (!enquiriesApiResponse) return [];

    // Transform the raw data, linking IDs to names, and filtering for "Enquiry" status
    return enquiriesApiResponse
      .filter(row => row.students?.status?.toLowerCase() === 'not_joined')
      .map(row => {
        // Find the branch and course name using the IDs from the student record
        const branchInfo = branchesData.find(b => b.id.toString() === row.students?.branch);
        const courseInfo = courses.find(c => c.id.toString() === row.students?.course);

        return {
          fullName: row.students?.fullName,
          email: row.students?.email,
          phone: row.students?.phone,
          status: row.students?.status,
          registration_date: row.students?.registration_date?.value,
          branch_name: branchInfo?.name || 'N/A',
          course_name: courseInfo?.name || 'N/A',
        }
      });
  }, [enquiriesApiResponse, branchesData, courses]); // Add dependencies

  const handleEnquiryFiltersChange = (filters: FilterCondition[]) => {
    setEnquiryFilterConditions(filters);
  };

  const filteredEnquiries = useMemo(() => {
  return flattenedEnquiries.filter(enquiry => {
    // Date filters apply to the registration date
    if (startDate && new Date(enquiry.registration_date) < startDate) return false;
    if (endDate && new Date(enquiry.registration_date) > endDate) return false;

    // Advanced filter conditions
    return enquiryFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | undefined;

      // Get the field value from the enquiry object
      switch (condition.field) {
        case "student":
          fieldValue = enquiry.fullName?.toLowerCase() || "";
          break;
        case "branch":
          fieldValue = enquiry.branch_name?.toLowerCase() || "";
          break;
        case "course":
          fieldValue = enquiry.course_name?.toLowerCase() || "";
          break;
        case "email":
          fieldValue = enquiry.email?.toLowerCase() || "";
          break;
        case "phone":
          fieldValue = enquiry.phone?.toLowerCase() || "";
          break;
        default:
          return true;
      }

      // ✅ Multi-select support
      if (Array.isArray(condition.value)) {
        const conditionValues = condition.value.map(v =>
          v?.toString().toLowerCase()
        );

        switch (condition.operator) {
          case "equals":
            return conditionValues.includes(fieldValue || "");
          case "notEquals":
            return !conditionValues.includes(fieldValue || "");
          case "contains":
            return conditionValues.some(v =>
              (fieldValue || "").includes(v)
            );
          case "notContains":
            return conditionValues.every(v =>
              !(fieldValue || "").includes(v)
            );
          case "startsWith":
            return conditionValues.some(v =>
              (fieldValue || "").startsWith(v)
            );
          case "endsWith":
            return conditionValues.some(v =>
              (fieldValue || "").endsWith(v)
            );
          default:
            return true;
        }
      } else {
        const conditionValue =
          typeof condition.value === "string"
            ? condition.value.toLowerCase()
            : condition.value;

        switch (condition.operator) {
          case "equals":
            return fieldValue === conditionValue;
          case "notEquals":
            return fieldValue !== conditionValue;
          case "contains":
            return fieldValue?.includes(conditionValue);
          case "notContains":
            return !fieldValue?.includes(conditionValue);
          case "startsWith":
            return fieldValue?.startsWith(conditionValue);
          case "endsWith":
            return fieldValue?.endsWith(conditionValue);
          case "isEmpty":
            return !fieldValue || fieldValue.trim() === "";
          case "isNotEmpty":
            return !!fieldValue && fieldValue.trim() !== "";
          default:
            return true;
        }
      }
    });
  });
}, [flattenedEnquiries, startDate, endDate, enquiryFilterConditions]);




  // --- INVENTORY REPORT DATA LOGIC ---
  const { data: inventoryApiResponse, isLoading: isInventoryLoading } = useQuery({
    queryKey: ['allInventoryData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_INVENTORY_DATA);

      return response.cube;
    },
  });

  const flattenedInventory = useMemo(() => {
    if (!inventoryApiResponse) return [];
    return inventoryApiResponse.map(row => ({
      item_name: row.inventory?.items,
      stock_quantity: row.stock_item?.stockQuantity,
      updatedAt: row.stock_item?.updatedAt?.value,
    }));
  }, [inventoryApiResponse]);

  // Create the options for the dropdown based on the full dataset
  const inventoryItemOptions = useMemo(() => {
    if (!flattenedInventory) return [];
    // Use a Set to ensure unique item names
    const uniqueItems = [...new Set(flattenedInventory.map(item => item.item_name))];
    const options = uniqueItems.map(name => ({ label: name, value: name }));
    // Add the "All Items" option at the beginning
    return [{ label: "All Items", value: "" }, ...options];
  }, [flattenedInventory]);

  // Add missing handler for inventory filters
  const handleInventoryFiltersChange = (filters: FilterCondition[]) => {
    setInventoryFilterConditions(filters);
  };

  // UPDATE THE FILTERING LOGIC to include the item name filter
  const filteredInventory = useMemo(() => {
  return flattenedInventory.filter(item => {
    // Date filters
    if (startDate && item.updatedAt) {
      const itemDate = new Date(item.updatedAt);
      if (itemDate < new Date(startDate)) return false;
    }
    if (endDate && item.updatedAt) {
      const itemDate = new Date(item.updatedAt);
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      if (itemDate > endDatePlusOne) return false;
    }

    // Advanced filter conditions
    return inventoryFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | number | undefined;

      // Get the field value from the inventory object
      switch (condition.field) {
        case "itemName":
          fieldValue = item.item_name?.toLowerCase() || "";
          break;
        case "stockQuantity":
          fieldValue = parseFloat(item.stock_quantity || "0");
          break;
        default:
          return true;
      }

      // ✅ Multi-select support
      if (Array.isArray(condition.value)) {
        const conditionValues = condition.value.map(v =>
          v?.toString().toLowerCase()
        );

        switch (condition.operator) {
          case "equals":
            return conditionValues.includes(fieldValue?.toString().toLowerCase() || "");
          case "notEquals":
            return !conditionValues.includes(fieldValue?.toString().toLowerCase() || "");
          case "contains":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").includes(v)
            );
          case "notContains":
            return conditionValues.every(v =>
              !(fieldValue?.toString().toLowerCase() || "").includes(v)
            );
          case "startsWith":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").startsWith(v)
            );
          case "endsWith":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").endsWith(v)
            );
          default:
            return true;
        }
      } else {
        const conditionValue =
          typeof condition.value === "string"
            ? condition.value.toLowerCase()
            : condition.value;

        switch (condition.operator) {
          case "equals":
            return fieldValue == conditionValue;
          case "notEquals":
            return fieldValue != conditionValue;
          case "contains":
            return fieldValue?.toString().includes(conditionValue);
          case "notContains":
            return !fieldValue?.toString().includes(conditionValue);
          case "startsWith":
            return fieldValue?.toString().startsWith(conditionValue);
          case "endsWith":
            return fieldValue?.toString().endsWith(conditionValue);
          case "isEmpty":
            return !fieldValue || fieldValue.toString().trim() === "";
          case "isNotEmpty":
            return !!fieldValue && fieldValue.toString().trim() !== "";
          case "greaterThan":
            return typeof fieldValue === "number"
              ? fieldValue > Number(conditionValue)
              : false;
          case "lessThan":
            return typeof fieldValue === "number"
              ? fieldValue < Number(conditionValue)
              : false;
          default:
            return true;
        }
      }
    });
  });
}, [flattenedInventory, startDate, endDate, inventoryFilterConditions]);


  // --- TRANSPORT REPORT DATA LOGIC ---
  const { data: transportApiResponse, isLoading: isTransportLoading } = useQuery({
    queryKey: ['allTransportData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_TRANSPORT_DATA);
      console.log('Transport API Response:', response);

      return response.cube;
    },
  });

  const flattenedTransportData = useMemo(() => {
    if (!transportApiResponse) return [];
    return transportApiResponse.map(row => ({
      totalAmount: row.transportation?.total_amount,
      picking_point: row.transportation?.picking_point,
      dropping_point: row.transportation?.dropping_point,
      mode: row.transportation_mode?.mode,
      student_name: row.students?.fullName,
      branch_name: row.branches?.name,
      course_name: row.courses?.name,
      brand_name: row.brands?.name,
      batch_name: row.batches?.name,
      picking_day:row.schedule.day,
      created_at: row.transportation?.created_at?.value
    }));
  }, [transportApiResponse]);

  const handleTransportFiltersChange = (filters: FilterCondition[]) => {
    setTransportFilterConditions(filters);
  };

  const filteredTransportData = useMemo(() => {
  return flattenedTransportData.filter(item => {
    // Date filters
    if (startDate && item.created_at) {
      const itemDate = new Date(item.created_at);
      if (itemDate < new Date(startDate)) return false;
    }
    if (endDate && item.created_at) {
      const itemDate = new Date(item.created_at);
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      if (itemDate > endDatePlusOne) return false;
    }

    // Advanced filter conditions
    return transportFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | number | undefined;

      // Get the field value from the transport object
      switch (condition.field) {
        case "branch_name":
          fieldValue = item.branch_name?.toLowerCase() || "";
          break;
        case "brand_name":
          fieldValue = item.brand_name?.toLowerCase() || "";
          break;
        case "batch_name":
          fieldValue = item.batch_name?.toLowerCase() || "";
          break;
        case "picking_day":
          fieldValue = item.picking_day?.toLowerCase() || "";
          break;
        case "course_name":
          fieldValue = item.course_name?.toLowerCase() || "";
          break;
        case "student_name":
          fieldValue = item.student_name?.toLowerCase() || "";
          break;
        case "mode":
          fieldValue = item.mode?.toLowerCase() || "";
          break;
        case "picking_point":
          fieldValue = item.picking_point?.toLowerCase() || "";
          break;
        case "dropping_point":
          fieldValue = item.dropping_point?.toLowerCase() || "";
          break;
        case "totalAmount":
          fieldValue = parseFloat(item.totalAmount || "0");
          break;
        default:
          return true;
      }

      // ✅ Multi-select support
      if (Array.isArray(condition.value)) {
        const conditionValues = condition.value.map(v =>
          v?.toString().toLowerCase()
        );

        switch (condition.operator) {
          case "equals":
            return conditionValues.includes(fieldValue?.toString().toLowerCase() || "");
          case "notEquals":
            return !conditionValues.includes(fieldValue?.toString().toLowerCase() || "");
          case "contains":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").includes(v)
            );
          case "notContains":
            return conditionValues.every(v =>
              !(fieldValue?.toString().toLowerCase() || "").includes(v)
            );
          case "startsWith":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").startsWith(v)
            );
          case "endsWith":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").endsWith(v)
            );
          default:
            return true;
        }
      } else {
        const conditionValue =
          typeof condition.value === "string"
            ? condition.value.toLowerCase()
            : condition.value;

        switch (condition.operator) {
          case "equals":
            return fieldValue == conditionValue;
          case "notEquals":
            return fieldValue != conditionValue;
          case "contains":
            return fieldValue?.toString().includes(conditionValue);
          case "notContains":
            return !fieldValue?.toString().includes(conditionValue);
          case "startsWith":
            return fieldValue?.toString().startsWith(conditionValue);
          case "endsWith":
            return fieldValue?.toString().endsWith(conditionValue);
          case "isEmpty":
            return !fieldValue || fieldValue.toString().trim() === "";
          case "isNotEmpty":
            return !!fieldValue && fieldValue.toString().trim() !== "";
          case "greaterThan":
            return typeof fieldValue === "number"
              ? fieldValue > Number(conditionValue)
              : false;
          case "lessThan":
            return typeof fieldValue === "number"
              ? fieldValue < Number(conditionValue)
              : false;
          default:
            return true;
        }
      }
    });
  });
}, [flattenedTransportData, startDate, endDate, transportFilterConditions]);


  // --- INVOICE REPORT DATA LOGIC ---
  const { data: invoiceApiResponse, isLoading: isInvoiceLoading } = useQuery({
    queryKey: ['allInvoiceData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_INVOICE_DATA);
      return response.cube;
    },
  });

  const flattened_Invoices = useMemo(() => {
    if (!invoiceApiResponse) return [];
    return invoiceApiResponse.map(row => ({
      totalAmount: row.invoices?.totalAmount,
      invoice_number: row.invoices?.invoice_number,
      issueDate: row.invoices?.issueDate?.value,
      dueDate: row.invoices?.dueDate?.value,
      amountPaid: row.invoices?.amountPaid,
      balanceDue: row.invoices?.balanceDue,
      status: row.invoices?.status,
      student_name: row.students?.fullName,
      is_re_registering: row.students?.is_re_registering?.toLowerCase() === 'yes',
      branch_name: row.branches?.name,
      course_name: row.courses?.name,
      brand_name: row.brands?.name,
      department_name: row.courses?.category,
      batch_name: row.batches?.name,
      teacher_name: row.employees?.fullName, // Assuming the teacher is the related employee
    }));
  }, [invoiceApiResponse]);

  const handleInvoiceFiltersChange = (filters: FilterCondition[]) => {
    setInvoiceFilterConditions(filters);
  };

  // Add a state for dateField to allow user to select which date to filter by (default: 'issueDate')
  const [dateField, setDateField] = useState<'issueDate' | 'dueDate'>('issueDate');

  const filteredInvoices = useMemo(() => {
  return flattened_Invoices.filter(invoice => {
    // Date filters - check both issueDate AND dueDate
    if (startDate) {
      const issueDate = invoice.issueDate ? new Date(invoice.issueDate) : null;
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const startDateObj = new Date(startDate);

      if (issueDate && dueDate && issueDate < startDateObj && dueDate < startDateObj) {
        return false;
      }
      if (issueDate && !dueDate && issueDate < startDateObj) {
        return false;
      }
      if (!issueDate && dueDate && dueDate < startDateObj) {
        return false;
      }
    }

    if (endDate) {
      const issueDate = invoice.issueDate ? new Date(invoice.issueDate) : null;
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);

      if (issueDate && dueDate && issueDate > endDateObj && dueDate > endDateObj) {
        return false;
      }
      if (issueDate && !dueDate && issueDate > endDateObj) {
        return false;
      }
      if (!issueDate && dueDate && dueDate > endDateObj) {
        return false;
      }
    }

    // Advanced filter conditions
    return invoiceFilterConditions.every(condition => {
      if (!condition.field) return true;

      let fieldValue: string | number | boolean | undefined;

      switch (condition.field) {
        case "invoice_number":
          fieldValue = invoice.invoice_number?.toLowerCase() || "";
          break;
        case "student_name":
          fieldValue = invoice.student_name?.toLowerCase() || "";
          break;
        case "is_re_registering":
          fieldValue = invoice.is_re_registering;
          break;
        case "branch_name":
          fieldValue = invoice.branch_name?.toLowerCase() || "";
          break;
        case "brand_name":
          fieldValue = invoice.brand_name?.toLowerCase() || "";
          break;
        case "department_name":
          fieldValue = invoice.department_name?.toLowerCase() || "";
          break;
        case "course_name":
          fieldValue = invoice.course_name?.toLowerCase() || "";
          break;
        case "batch_name":
          fieldValue = invoice.batch_name?.toLowerCase() || "";
          break;
        case "teacher_name":
          fieldValue = invoice.teacher_name?.toLowerCase() || "";
          break;
        case "totalAmount":
          fieldValue = parseFloat(invoice.totalAmount || "0");
          break;
        case "amountPaid":
          fieldValue = parseFloat(invoice.amountPaid || "0");
          break;
        case "balanceDue":
          fieldValue = parseFloat(invoice.balanceDue || "0");
          break;
        case "status":
          fieldValue = invoice.status?.toLowerCase() || "";
          break;
        default:
          return true;
      }

      // ✅ Multi-select support
      if (Array.isArray(condition.value)) {
        const conditionValues = condition.value.map(v =>
          v?.toString().toLowerCase()
        );

        switch (condition.operator) {
          case "equals":
            return conditionValues.includes(fieldValue?.toString().toLowerCase() || "");
          case "notEquals":
            return !conditionValues.includes(fieldValue?.toString().toLowerCase() || "");
          case "contains":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").includes(v)
            );
          case "notContains":
            return conditionValues.every(v =>
              !(fieldValue?.toString().toLowerCase() || "").includes(v)
            );
          case "startsWith":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").startsWith(v)
            );
          case "endsWith":
            return conditionValues.some(v =>
              (fieldValue?.toString().toLowerCase() || "").endsWith(v)
            );
          default:
            return true;
        }
      } else {
        const conditionValue =
          typeof condition.value === "string"
            ? condition.value.toLowerCase()
            : condition.value;

        switch (condition.operator) {
          case "equals":
            return fieldValue == conditionValue;
          case "notEquals":
            return fieldValue != conditionValue;
          case "contains":
            return fieldValue?.toString().includes(conditionValue);
          case "notContains":
            return !fieldValue?.toString().includes(conditionValue);
          case "startsWith":
            return fieldValue?.toString().startsWith(conditionValue);
          case "endsWith":
            return fieldValue?.toString().endsWith(conditionValue);
          case "isEmpty":
            return !fieldValue || fieldValue.toString().trim() === "";
          case "isNotEmpty":
            return !!fieldValue && fieldValue.toString().trim() !== "";
          case "greaterThan":
            return typeof fieldValue === "number"
              ? fieldValue > Number(conditionValue)
              : false;
          case "lessThan":
            return typeof fieldValue === "number"
              ? fieldValue < Number(conditionValue)
              : false;
          default:
            return true;
        }
      }
    });
  });
}, [flattened_Invoices, startDate, endDate, invoiceFilterConditions]);



  // --- SCHEDULE REPORT DATA LOGIC ---
  const { data: scheduleApiResponse, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['allScheduleData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_SCHEDULE_DATA);
      console.log('Schedule API Response:', response);

      return response.cube;
    },
  });

  const flattenedScheduleData = useMemo(() => {
    if (!scheduleApiResponse) return [];
    return scheduleApiResponse.map(row => ({
      created_at: row.schedule?.created_at?.value,
      day: row.schedule?.day,
      start_time: row.schedule?.start_time,
      end_time: row.schedule?.end_time,
      batch_name: row.batches?.name,
      teacher_name: row.employees?.fullName,
      course_name: row.courses?.name,
      brand_name: row.brands?.name,
      department_name: row.courses?.category,
      branch_name: row.branches?.name,
    }));
  }, [scheduleApiResponse]);

  const handleScheduleFiltersChange = (filters: FilterCondition[]) => {
    setScheduleFilterConditions(filters);
  };


  const filteredScheduleData = useMemo(() => {
  return flattenedScheduleData.filter(schedule => {
    // Date filters
    if (startDate && schedule.created_at) {
      const itemDate = new Date(schedule.created_at);
      if (itemDate < new Date(startDate)) return false;
    }
    if (endDate && schedule.created_at) {
      const itemDate = new Date(schedule.created_at);
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      if (itemDate >= endDatePlusOne) return false;
    }

    // Advanced filter conditions
    return scheduleFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | undefined;
      let conditionValues: string[] = [];

      // Normalize condition.value to an array (multi-select support)
      if (Array.isArray(condition.value)) {
        conditionValues = condition.value.map(v => v.toString().toLowerCase());
      } else if (condition.value) {
        conditionValues = [condition.value.toString().toLowerCase()];
      }

      // Get the field value from the schedule object
      switch (condition.field) {
        case 'day':
          fieldValue = schedule.day?.toLowerCase();
          break;
        case 'branch_name':
          fieldValue = schedule.branch_name?.toLowerCase();
          break;
        case 'brand_name':
          fieldValue = schedule.brand_name?.toLowerCase();
          break;
        case 'department_name':
          fieldValue = schedule.department_name?.toLowerCase();
          break;
        case 'batch_name':
          fieldValue = schedule.batch_name?.toLowerCase();
          break;
        case 'course_name':
          fieldValue = schedule.course_name?.toLowerCase();
          break;
        case 'teacher_name':
          fieldValue = schedule.teacher_name?.toLowerCase();
          break;
        case 'start_time':
          fieldValue = schedule.start_time;
          break;
        case 'end_time':
          fieldValue = schedule.end_time;
          break;
        default:
          return true;
      }

      // Handle different operators with multi-select support
      switch (condition.operator) {
        case 'equals':
          return conditionValues.some(val => fieldValue === val);
        case 'notEquals':
          return conditionValues.every(val => fieldValue !== val);
        case 'contains':
          return conditionValues.some(val => fieldValue?.includes(val));
        case 'notContains':
          return conditionValues.every(val => !fieldValue?.includes(val));
        case 'startsWith':
          return conditionValues.some(val => fieldValue?.startsWith(val));
        case 'endsWith':
          return conditionValues.some(val => fieldValue?.endsWith(val));
        case 'isEmpty':
          return !fieldValue || fieldValue.trim() === '';
        case 'isNotEmpty':
          return !!fieldValue && fieldValue.trim() !== '';
        default:
          return true;
      }
    });
  });
}, [flattenedScheduleData, startDate, endDate, scheduleFilterConditions]);



  // --- DISCONTINUED REPORT DATA LOGIC ---
  const { data: allAttendanceApiResponse, isLoading: isDiscontinuedLoading } = useQuery({
    queryKey: ['allAttendanceForDiscontinuedReport'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_ALL_ATTENDANCE_DATA);
      console.log('Discontinued Students API Response:', response);

      return response.cube;
    },
  });

  // This is the core logic for this report
  const discontinuedStudentsList = useMemo(() => {
    if (!allAttendanceApiResponse) return [];

    // 1. Flatten the data for easier processing
    const flatAttendance = allAttendanceApiResponse.map(row => ({
      student_name: row.students?.fullName,
      status: row.attendance?.status?.toLowerCase(),
      date: new Date(row.attendance?.date?.value), // Convert to Date object for comparison
      branch_name: row.branches?.name,
      brand_name: row.brands?.name,
      department_name: row.courses?.category,
      batch_name: row.batches?.name,
      course_name: row.courses?.name,
      teacher_name: row.employees?.fullName,
    }));

    // 2. Group attendance records by student name
    const studentsGrouped = flatAttendance.reduce((acc, record) => {
      if (!acc[record.student_name]) {
        acc[record.student_name] = [];
      }
      acc[record.student_name].push(record);
      return acc;
    }, {} as Record<string, typeof flatAttendance>);

    // 3. Find the last record for each student and check the condition
    const discontinuedList = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const studentName in studentsGrouped) {
      const records = studentsGrouped[studentName];
      // Sort records by date descending to easily find the latest one
      records.sort((a, b) => b.date.getTime() - a.date.getTime());

      const lastRecord = records[0];

      // Check the condition: last record is 'absent' or 'cancelled' AND is older than 30 days
      if (lastRecord && (lastRecord.status === 'absent' || lastRecord.status === 'cancelled') && lastRecord.date < thirtyDaysAgo) {
        discontinuedList.push(lastRecord);
      }
    }

    return discontinuedList;
  }, [allAttendanceApiResponse]);

  const handleDiscontinuedFiltersChange = (filters: FilterCondition[]) => {
    setDiscontinuedFilterConditions(filters);
  };

  const filteredDiscontinuedStudents = useMemo(() => {
  return discontinuedStudentsList.filter(student => {
    // Date filters
    if (startDate && student.date) {
      const itemDate = new Date(student.date);
      if (itemDate < new Date(startDate)) return false;
    }
    if (endDate && student.date) {
      const itemDate = new Date(student.date);
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      if (itemDate >= endDatePlusOne) return false;
    }

    // Advanced filter conditions with multi-select support
    return discontinuedFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | undefined;
      let conditionValues: string[] = [];

      // Normalize condition.value into an array
      if (Array.isArray(condition.value)) {
        conditionValues = condition.value.map(v => v.toString().toLowerCase());
      } else if (condition.value) {
        conditionValues = [condition.value.toString().toLowerCase()];
      }

      // Get the field value from the student object
      switch (condition.field) {
        case 'student_name':
          fieldValue = student.student_name?.toLowerCase();
          break;
        case 'branch_name':
          fieldValue = student.branch_name?.toLowerCase();
          break;
        case 'brand_name':
          fieldValue = student.brand_name?.toLowerCase();
          break;
        case 'department_name':
          fieldValue = student.department_name?.toLowerCase();
          break;
        case 'batch_name':
          fieldValue = student.batch_name?.toLowerCase();
          break;
        case 'course_name':
          fieldValue = student.course_name?.toLowerCase();
          break;
        case 'teacher_name':
          fieldValue = student.teacher_name?.toLowerCase();
          break;
        case 'status':
          fieldValue = student.status?.toLowerCase();
          break;
        default:
          return true;
      }

      // Handle operators with multi-select support
      switch (condition.operator) {
        case 'equals':
          return conditionValues.some(val => fieldValue === val);
        case 'notEquals':
          return conditionValues.every(val => fieldValue !== val);
        case 'contains':
          return conditionValues.some(val => fieldValue?.includes(val));
        case 'notContains':
          return conditionValues.every(val => !fieldValue?.includes(val));
        case 'startsWith':
          return conditionValues.some(val => fieldValue?.startsWith(val));
        case 'endsWith':
          return conditionValues.some(val => fieldValue?.endsWith(val));
        case 'isEmpty':
          return !fieldValue || fieldValue.trim() === '';
        case 'isNotEmpty':
          return !!fieldValue && fieldValue.trim() !== '';
        default:
          return true;
      }
    });
  });
}, [discontinuedStudentsList, startDate, endDate, discontinuedFilterConditions]);


  // --- STUDENT LIST REPORT DATA LOGIC ---
  const { data: studentListApiResponse, isLoading: isStudentListLoading } = useQuery({
    queryKey: ['allStudentListData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_STUDENT_LIST_DATA);
      console.log('Student List API Response:', response);
      return response.cube;
    },
  });

  // This is the most complex data transformation logic
  const flattenedStudentList = useMemo(() => {
    if (!studentListApiResponse) return [];

    // 1. Create a map of the last attendance record for each student for efficient lookup
    const lastAttendanceMap = new Map<string, { date: Date; status: string }>();
    studentListApiResponse.forEach(row => {
      const studentName = row.students?.fullName;
      const attendanceDate = row.attendance?.date?.value;
      if (studentName && attendanceDate) {
        const currentDate = new Date(attendanceDate);
        const existingRecord = lastAttendanceMap.get(studentName);
        if (!existingRecord || currentDate > existingRecord.date) {
          lastAttendanceMap.set(studentName, { date: currentDate, status: row.attendance.status.toLowerCase() });
        }
      }
    });

    // 2. Create a unique list of students with all their details and a calculated status
    const uniqueStudents = new Map<string, any>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    studentListApiResponse.forEach(row => {
      const studentName = row.students?.fullName;
      if (studentName && !uniqueStudents.has(studentName)) {
        let computed_status = row.students?.status; // Start with the base status (e.g., Active, Inactive)
        const lastRecord = lastAttendanceMap.get(studentName);

        // Check for Discontinued status
        if (lastRecord && (lastRecord.status === 'absent' || lastRecord.status === 'cancelled') && lastRecord.date < thirtyDaysAgo) {
          computed_status = 'Discontinued';
        }

        uniqueStudents.set(studentName, {
          fullName: studentName,
          email: row.students?.email,
          branch_name: row.branches?.name,
          brand_name: row.brands?.name,
          department_name: row.courses?.category,
          batch_name: row.batches?.name,
          course_name: row.courses?.name,
          teacher_name: row.employees?.fullName,
          computed_status: computed_status,
          created_at: row.students?.created_at?.value,
        });
      }
    });

    return Array.from(uniqueStudents.values());
  }, [studentListApiResponse]);

  const handleStudentListFiltersChange = (filters: FilterCondition[]) => {
    setStudentListFilterConditions(filters);
  };

  const filteredStudentList = useMemo(() => {
  return flattenedStudentList.filter(student => {
    // Date filters
    if (startDate && student.created_at) {
      const itemDate = new Date(student.created_at);
      if (itemDate < new Date(startDate)) return false;
    }
    if (endDate && student.created_at) {
      const itemDate = new Date(student.created_at);
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      if (itemDate >= endDatePlusOne) return false;
    }

    // Advanced filter conditions
    return studentListFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | undefined;
      let conditionValues: string[] = [];

      // Normalize condition.value into an array
      if (Array.isArray(condition.value)) {
        conditionValues = condition.value.map(v => v.toString().toLowerCase());
      } else if (condition.value) {
        conditionValues = [condition.value.toString().toLowerCase()];
      }

      // Get the field value from the student object
      switch (condition.field) {
        case 'fullName':
          fieldValue = student.fullName?.toLowerCase();
          break;
        case 'email':
          fieldValue = student.email?.toLowerCase();
          break;
        case 'branch_name':
          fieldValue = student.branch_name?.toLowerCase();
          break;
        case 'brand_name':
          fieldValue = student.brand_name?.toLowerCase();
          break;
        case 'department_name':
          fieldValue = student.department_name?.toLowerCase();
          break;
        case 'batch_name':
          fieldValue = student.batch_name?.toLowerCase();
          break;
        case 'course_name':
          fieldValue = student.course_name?.toLowerCase();
          break;
        case 'teacher_name':
          fieldValue = student.teacher_name?.toLowerCase();
          break;
        case 'computed_status':
          fieldValue = student.computed_status?.toLowerCase();
          break;
        default:
          return true;
      }

      // Handle operators with multi-select support
      switch (condition.operator) {
        case 'equals':
          return conditionValues.some(val => fieldValue === val);
        case 'notEquals':
          return conditionValues.every(val => fieldValue !== val);
        case 'contains':
          return conditionValues.some(val => fieldValue?.includes(val));
        case 'notContains':
          return conditionValues.every(val => !fieldValue?.includes(val));
        case 'startsWith':
          return conditionValues.some(val => fieldValue?.startsWith(val));
        case 'endsWith':
          return conditionValues.some(val => fieldValue?.endsWith(val));
        case 'isEmpty':
          return !fieldValue || fieldValue.trim() === '';
        case 'isNotEmpty':
          return !!fieldValue && fieldValue.trim() !== '';
        default:
          return true;
      }
    });
  });
}, [flattenedStudentList, startDate, endDate, studentListFilterConditions]);


  // --- BATCH ATTENDANCE REPORT DATA LOGIC ---
  const { data: attendanceSummaryApiResponse, isLoading: isBatchAttendanceLoading } = useQuery({
    queryKey: ['allAttendanceForSummary'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_ALL_ATTENDANCE_FOR_SUMMARY);
      return response.cube;
    },
  });



  const dateFilteredAttendance = useMemo(() => {
    if (!attendanceSummaryApiResponse) return [];

    // If no start or end date is selected, return all data
    if (!dateRange.startDate || !dateRange.endDate) {
      return attendanceSummaryApiResponse;
    }

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    // Set time to the end of the day to ensure the entire end date is included
    end.setHours(23, 59, 59, 999);

    return attendanceSummaryApiResponse.filter(row => {
      const attendanceDateStr = row.attendance?.date?.value;

      if (!attendanceDateStr) return false;

      const attendanceDate = new Date(attendanceDateStr);
      return attendanceDate >= start && attendanceDate <= end;
    });
  }, [attendanceSummaryApiResponse, dateRange]);



  // Core summarization logic
  const summarizedStudentAttendance = useMemo(() => {
    // --- Change this: Check for dateFilteredAttendance now
    if (!dateFilteredAttendance) return [];

    // --- And change this: Reduce the dateFilteredAttendance array
    const studentsGrouped = dateFilteredAttendance.reduce((acc, row) => {
      const studentName = row.students?.fullName;
      if (!studentName) return acc;

      if (!acc[studentName]) {
        acc[studentName] = {
          studentName: studentName,
          studentId: row.students?.student_id,
          branchName: row.branches?.name,
          courseName: row.courses?.name,
          batchName: row.batches?.name,
          teacherName: row.employees?.fullName,
          brand_name: row.brands?.name,
          department_name: row.courses?.category,
          presentCount: 0,
          absentCount: 0,
          leaveCount: 0,
          Compensation:0,
        };
      }

    const status = row.attendance?.status?.toLowerCase();
    if (status === "present") {
      acc[studentName].presentCount++;
    } else if (status === "absent") {
      acc[studentName].absentCount++;
    } else if (status === "leave") {
      acc[studentName].leaveCount++;
    }

    // ✅ New check for compensation
    if (row.attendance?.isCompensation === 'true') {
      acc[studentName].Compensation++;
    }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(studentsGrouped);
  }, [dateFilteredAttendance]);




  const handleBatchAttendanceFiltersChange = (filters: FilterCondition[]) => {
    setBatchAttendanceFilterConditions(filters);
  };



  const filteredBatchAttendance = useMemo(() => {
  return summarizedStudentAttendance.filter(student => {
    return batchAttendanceFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | number | undefined;

      // Normalize fieldValue
      switch (condition.field) {
        case "student_id":
          fieldValue = student.studentId?.toString();
          break;
        case "student":
          fieldValue = student.studentName?.toLowerCase() || "";
          break;
        case "branch":
          fieldValue = student.branchName?.toLowerCase() || "";
          break;
        case "brand":
          fieldValue = student.brand_name?.toLowerCase() || "";
          break;
        case "department":
          fieldValue = student.department_name?.toLowerCase() || "";
          break;
        case "batch":
          fieldValue = student.batchName?.toLowerCase() || "";
          break;
        case "course":
          fieldValue = student.courseName?.toLowerCase() || "";
          break;
        case "teacher":
          fieldValue = student.teacherName?.toLowerCase() || "";
          break;

        // ✅ Special case for status (counts)
        case "status":
          if (Array.isArray(condition.value)) {
            return condition.value.some(status => {
              if (status === "present") return student.presentCount > 0;
              if (status === "absent") return student.absentCount > 0;
              if (status === "leave") return student.leaveCount > 0;
              if (status === "compensation") return student.Compensation > 0;
              return false;
            });
          } else {
            if (condition.value === "present") return student.presentCount > 0;
            if (condition.value === "absent") return student.absentCount > 0;
            if (condition.value === "leave") return student.leaveCount > 0;
            if (condition.value === "compensation") return student.Compensation > 0;
            return true;
          }
        default:
          return true;
      }

      // ✅ Multi-select for ALL text/ID fields
      if (Array.isArray(condition.value)) {
        const conditionValues = condition.value.map(v => v.toString().toLowerCase());
        switch (condition.operator) {
          case "equals":
            return conditionValues.includes(fieldValue?.toString().toLowerCase() || "");
          case "notEquals":
            return !conditionValues.includes(fieldValue?.toString().toLowerCase() || "");
          default:
            return true;
        }
      } else {
        const conditionValue = condition.value?.toString().toLowerCase() || "";
        switch (condition.operator) {
          case "equals":
            return fieldValue?.toString().toLowerCase() === conditionValue;
          case "notEquals":
            return fieldValue?.toString().toLowerCase() !== conditionValue;
          case "contains":
            return fieldValue?.toString().includes(conditionValue);
          case "notContains":
            return !fieldValue?.toString().includes(conditionValue);
          case "startsWith":
            return fieldValue?.toString().startsWith(conditionValue);
          case "endsWith":
            return fieldValue?.toString().endsWith(conditionValue);
          case "isEmpty":
            return !fieldValue || fieldValue.toString().trim() === "";
          case "isNotEmpty":
            return !!fieldValue && fieldValue.toString().trim() !== "";
          default:
            return true;
        }
      }
    });
  });
}, [summarizedStudentAttendance, batchAttendanceFilterConditions]);



  // --- PARENT'S DETAILS REPORT DATA LOGIC ---
  const { data: parentDetailsApiResponse, isLoading: isParentDetailsLoading } = useQuery({
    queryKey: ['allParentDetailsData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_PARENT_DETAILS_DATA);
      console.log('Parent Details API Response:', response);
      return response.cube;
    },
  });

  // FIX 2: Simplify the data transformation. We now use the parent's status directly.
  const flattenedParentDetails = useMemo(() => {
    if (!parentDetailsApiResponse) return [];

    // Use a Map to ensure we only have one entry per parent, even if they have multiple children in the raw data
    const uniqueParents = new Map<string, any>();

    parentDetailsApiResponse.forEach(row => {
      const parentName = row.parents?.fullName;
      if (parentName && !uniqueParents.has(parentName)) {
        uniqueParents.set(parentName, {
          parent_name: parentName,
          parent_phone: row.parents?.phone,
          parent_email: row.parents?.email,
          parent_address: row.parents?.residence_address,
          parent_community: row.parents?.community,
          parent_status: row.parents?.status, // Use the parent's own status
          // Keep the child's info for filtering purposes
          student_name: row.students?.fullName,
          branch_name: row.branches?.name,
          brand_name: row.brands?.name,
          department_name: row.courses?.category,
          batch_name: row.batches?.name,
          course_name: row.courses?.name,
          teacher_name: row.employees?.fullName,
          created_at: row.parents?.created_at?.value,
        });
      }
    });

    return Array.from(uniqueParents.values());
  }, [parentDetailsApiResponse]);

  const handleParentDetailsFiltersChange = (filters: FilterCondition[]) => {
    setParentDetailsFilterConditions(filters);
  };

  // FIX 3: Update the filtering logic to use parent_status and add a student filter
  const filteredParentDetails = useMemo(() => {
  return flattenedParentDetails.filter(parent => {
    // Date filters
    if (startDate && parent.created_at) {
      const itemDate = new Date(parent.created_at);
      if (itemDate < new Date(startDate)) return false;
    }
    if (endDate && parent.created_at) {
      const itemDate = new Date(parent.created_at);
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      if (itemDate >= endDatePlusOne) return false;
    }

    // Advanced filter conditions
    return parentDetailsFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string | undefined;
      let conditionValues: string[] = [];

      // Normalize condition.value into an array
      if (Array.isArray(condition.value)) {
        conditionValues = condition.value.map(v => v.toString().toLowerCase());
      } else if (condition.value) {
        conditionValues = [condition.value.toString().toLowerCase()];
      }

      // Get the field value from the parent object
      switch (condition.field) {
        case 'parent_name':
          fieldValue = parent.parent_name?.toLowerCase();
          break;
        case 'parent_phone':
          fieldValue = parent.parent_phone?.toLowerCase();
          break;
        case 'parent_email':
          fieldValue = parent.parent_email?.toLowerCase();
          break;
        case 'parent_address':
          fieldValue = parent.parent_address?.toLowerCase();
          break;
        case 'parent_community':
          fieldValue = parent.parent_community?.toLowerCase();
          break;
        case 'parent_status':
          fieldValue = parent.parent_status?.toLowerCase();
          break;
        case 'student_name':
          fieldValue = parent.student_name?.toLowerCase();
          break;
        case 'branch_name':
          fieldValue = parent.branch_name?.toLowerCase();
          break;
        case 'brand_name':
          fieldValue = parent.brand_name?.toLowerCase();
          break;
        case 'department_name':
          fieldValue = parent.department_name?.toLowerCase();
          break;
        case 'batch_name':
          fieldValue = parent.batch_name?.toLowerCase();
          break;
        case 'course_name':
          fieldValue = parent.course_name?.toLowerCase();
          break;
        case 'teacher_name':
          fieldValue = parent.teacher_name?.toLowerCase();
          break;
        default:
          return true;
      }

      // Handle operators with multi-select support
      switch (condition.operator) {
        case 'equals':
          return conditionValues.some(val => fieldValue === val);
        case 'notEquals':
          return conditionValues.every(val => fieldValue !== val);
        case 'contains':
          return conditionValues.some(val => fieldValue?.includes(val));
        case 'notContains':
          return conditionValues.every(val => !fieldValue?.includes(val));
        case 'startsWith':
          return conditionValues.some(val => fieldValue?.startsWith(val));
        case 'endsWith':
          return conditionValues.some(val => fieldValue?.endsWith(val));
        case 'isEmpty':
          return !fieldValue || fieldValue.trim() === '';
        case 'isNotEmpty':
          return !!fieldValue && fieldValue.trim() !== '';
        default:
          return true;
      }
    });
  });
}, [flattenedParentDetails, startDate, endDate, parentDetailsFilterConditions]);



  // --- INVOICE CANCELLATION REPORT DATA LOGIC ---
  const { data: cancellationApiResponse, isLoading: isCancellationsLoading } = useQuery({
    queryKey: ['allInvoiceCancellationData'],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_INVOICE_CANCELLATION_DATA);
      return response.cube;
    },
  });

  const flattenedCancellations = useMemo(() => {
    if (!cancellationApiResponse) return [];

    // Filter the raw data to only include records where the invoice status is "cancelled"
    return cancellationApiResponse
      .filter(row => row.invoices?.status?.toLowerCase() === 'cancelled')
      .map(row => ({
        cancellation_date: row.invoices?.created_at?.value,
        status: row.invoices?.status,
        invoice_number: row.invoices?.invoice_number,
        student_name: row.students?.fullName,
        batch_name: row.batches?.name,
        branch_name: row.branches?.name,
        brand_name: row.brands?.name,
        department_name: row.courses?.category,
        course_name: row.courses?.name,
        teacher_name: row.employees?.fullName, // Assuming employee is the teacher associated
      }));
  }, [cancellationApiResponse]);

  const handleCancellationFiltersChange = (filters: FilterCondition[]) => {
    setCancellationFilterConditions(filters);
  };


  const filteredCancellations = useMemo(() => {
  return flattenedCancellations.filter(item => {
    const itemDate = new Date(item.cancellation_date);

    // Date filters (inclusive)
    if (startDate && itemDate < new Date(startDate)) return false;
    if (endDate) {
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      if (itemDate >= endDatePlusOne) return false;
    }

    // Advanced filter conditions with multi-select support
    return cancellationFilterConditions.every(condition => {
      if (!condition.field) return true; // Skip if no field selected

      let fieldValue: string = '';
      let conditionValues: string[] = [];

      // Normalize condition.value into an array
      if (Array.isArray(condition.value)) {
        conditionValues = condition.value.map(v => v.toString().toLowerCase());
      } else if (condition.value) {
        conditionValues = [condition.value.toString().toLowerCase()];
      }

      // Get the field value from the cancellation object
      switch (condition.field) {
        case 'student':
          fieldValue = item.student_name?.toLowerCase() || '';
          conditionValues = conditionValues.map(v => getNameFromId('student', v)?.toLowerCase() || '');
          break;
        case 'branch':
          fieldValue = item.branch_name?.toLowerCase() || '';
          conditionValues = conditionValues.map(v => getNameFromId('branch', v)?.toLowerCase() || '');
          break;
        case 'brand':
          fieldValue = item.brand_name?.toLowerCase() || '';
          conditionValues = conditionValues.map(v => getNameFromId('brand', v)?.toLowerCase() || '');
          break;
        case 'department':
          fieldValue = item.department_name?.toLowerCase() || '';
          conditionValues = conditionValues.map(v => getNameFromId('department', v)?.toLowerCase() || '');
          break;
        case 'batch':
          fieldValue = item.batch_name?.toLowerCase() || '';
          conditionValues = conditionValues.map(v => getNameFromId('batch', v)?.toLowerCase() || '');
          break;
        case 'course':
          fieldValue = item.course_name?.toLowerCase() || '';
          conditionValues = conditionValues.map(v => getNameFromId('course', v)?.toLowerCase() || '');
          break;
        case 'teacher':
          fieldValue = item.teacher_name?.toLowerCase() || '';
          conditionValues = conditionValues.map(v => getNameFromId('teacher', v)?.toLowerCase() || '');
          break;
        case 'invoiceNumber':
          fieldValue = item.invoice_number?.toString().toLowerCase() || '';
          break;
        default:
          return true;
      }

      // Handle operators with multi-select support
      switch (condition.operator) {
        case 'equals':
          return conditionValues.some(val => fieldValue === val);
        case 'notEquals':
          return conditionValues.every(val => fieldValue !== val);
        case 'contains':
          return conditionValues.some(val => fieldValue.includes(val));
        case 'notContains':
          return conditionValues.every(val => !fieldValue.includes(val));
        case 'startsWith':
          return conditionValues.some(val => fieldValue.startsWith(val));
        case 'endsWith':
          return conditionValues.some(val => fieldValue.endsWith(val));
        case 'isEmpty':
          return !fieldValue || fieldValue.trim() === '';
        case 'isNotEmpty':
          return !!fieldValue && fieldValue.trim() !== '';
        default:
          return true;
      }
    });
  });
}, [flattenedCancellations, startDate, endDate, cancellationFilterConditions]);




  // CORRECTED: Cube.js query for individual student attendance details
  //   const { resultSet: studentAttendanceResultSet, isLoading: isStudentDataLoading } = useCubeQuery(
  //   { // Argument 1: The Query Object
  //     measures: ["Attendance.count"],
  //     dimensions: ["Attendance.status", "Attendance.date", "Attendance.batchName"],
  //     filters: [
  //       ...(selectedStudent?.student?.id ? [{ member: "students.id", operator: "equals", values: [selectedStudent.student.id.toString()] }] : []),
  //       ...(startDate ? [{ member: "Attendance.date", operator: "gte", values: [startDate.toISOString().split('T')[0]] }] : []),
  //       ...(endDate ? [{ member: "Attendance.date", operator: "lte", values: [endDate.toISOString().split('T')[0]] }] : []),
  //     ],
  //     order: { "Attendance.date": "desc" },
  //   }, 
  //    { // Argument 2: The Options Object
  //     // This now correctly controls the hook on the client-side
  //     enabled: !!selectedStudent,
  //   }
  // );

  // CORRECTED: Process and set individual student attendance data
  // useEffect(() => {
  //   if (studentAttendanceResultSet) {
  //     setStudentAttendanceRecords(studentAttendanceResultSet.tablePivot());
  //   } else {
  //     setStudentAttendanceRecords([]);
  //   }
  // }, [studentAttendanceResultSet]);


  // Filter options for ReactSelect
  const brandOptions = useMemo(() => [{ label: "All Brands", value: "all" }, ...brands.map(b => ({ label: b.name, value: b.id.toString() }))], [brands]);
  const departmentOptions = useMemo(() => [{ label: "All Departments", value: "all" }, ...departments.map(d => ({ label: d.name, value: d.id.toString() }))], [departments]);
  const courseOptions = useMemo(() => [{ label: "All Courses", value: "all" }, ...courses.map(c => ({ label: c.name, value: c.id.toString() }))], [courses]);
  const teacherOptions = useMemo(() => [{ label: "All Teachers", value: "all" }, ...teachers.map(t => ({ label: `${t.firstName} ${t.lastName}`, value: t.id.toString() }))], [teachers]);
  const batchOptions = useMemo(() => batches.map(b => ({ label: `${b.name} - ${b.branch}`, value: b.id.toString() })), [batches]);



  async function imageToBase64(src: string): Promise<string> {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Helper to get the dimensions of a Base64 image.
   */
  async function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = base64;
    });
  }

  /**
   * Generates a human-readable date period string.
   */
  function getPeriodText(startDate?: Date | null, endDate?: Date | null, defaultText: string = "for the current period"): string {
    if (startDate && endDate) {
      return `${format(startDate, "dd-MM-yyyy")} to ${format(endDate, "dd-MM-yyyy")}`;
    }
    if (startDate) {
      return `from ${format(startDate, "dd-MM-yyyy")}`;
    }
    return defaultText;
  }

  /**
   * Creates a file-safe name for the report.
   */
  function getFileName(reportName: string, periodText: string): string {
    const fileSafePeriod = periodText.replace(/ /g, '_').replace(/,/g, '');
    return `${reportName}-${fileSafePeriod}`;
  }


  // --- GENERIC EXPORT GENERATORS ---

  /**
   * Adds a standardized header (logo, title, details) to a jsPDF document.
   */
  async function addPdfHeader(doc: jsPDF, title: string, periodText: string) {
    const pageWidth = doc.internal.pageSize.width;

    // 1. Add Logo
    const logoBase64 = await imageToBase64('/header.png');
    const dimensions = await getImageDimensions(logoBase64);
    const scaleFactor = 0.25;
    const imgWidth = dimensions.width * scaleFactor;
    const imgHeight = dimensions.height * scaleFactor;
    doc.addImage(logoBase64, 'PNG', 40, 40, imgWidth, imgHeight);

    // 2. Add Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 80, { align: 'center' });

    // 3. Add Sub-details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let startY = 150;
    if (periodText) {
      doc.text(`Period: ${periodText}`, 40, startY);
      startY += 15;
    }
    doc.text(`Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}`, 40, startY);

    return startY + 20; // Return the starting Y position for the table
  }

  /**
   * Generic function to generate and save an Excel file.
   */
  function generateExcel(data: any[], fileName: string, sheetName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Generic function to generate and save a PDF file.
   */
  async function generatePdf(config: {
    fileName: string;
    title: string;
    periodText: string;
    columns: string[];
    rows: any[][];
    orientation?: 'p' | 'l';
    autoTableOptions?: object;
  }) {
    const { fileName, title, periodText, columns, rows, orientation = 'l', autoTableOptions = {} } = config;
    const doc = new jsPDF(orientation, 'pt', 'a4');

    const tableStartY = await addPdfHeader(doc, title, periodText);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: tableStartY,
      theme: 'grid',
      headStyles: { fillColor: [38, 52, 102], textColor: 255, fontStyle: 'bold' },
      ...autoTableOptions,
    });

    doc.save(`${fileName}.pdf`);
  }


  // Helper to format time strings for export (e.g., "14:00:00" -> "14:00")
  function formatExportTime(time?: string) {
    if (!time) return '';
    // If time is already in HH:mm format, return as is
    if (/^\d{2}:\d{2}$/.test(time)) return time;
    // If time is in HH:mm:ss, trim to HH:mm
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time.slice(0, 5);
    return time;
  }

  // --- MAIN COMPONENT EXPORT HANDLER ---


  function formatDateSafely(dateInput: string | Date | null | undefined, formatString: string): string {
    // 1. Check for null, undefined, or empty string right away
    if (!dateInput) {
      return 'N/A';
    }

    const date = new Date(dateInput);

    // 2. Check if the created Date object is valid.
    // An invalid date's time is NaN (Not-a-Number).
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    // 3. If the date is valid, format it.
    return format(date, formatString);
  }


  const handleExportClick = (type: "excel" | "pdf") => {
    // Define reportConfig here so it is available in this scope
    const reportConfig = {
      "attendance": {
        title: "Batch Attendance Report",
        data: filteredBatchAttendance,
        checkData: () => filteredBatchAttendance.length > 0,
        excelMapper: (item: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": item.studentName,
          "Branch": item.branchName,
          "Batch": item.batchName,
          "Present": item.presentCount,
          "Absent": item.absentCount,
          "Leave": item.leaveCount,
          "Compensation":item.compensation
        }),
        pdfColumns: ["#", "Student Name", "Branch", "Batch", "Present", "Absent", "Leave","Compensation"],
        pdfRowMapper: (item: any, index: number) => [
          index + 1,
          item.studentName,
          item.branchName,
          item.batchName,
          item.presentCount,
          item.absentCount,
          item.leaveCount,
          item.compensation
        ],
      },
      "students": {
        title: "Student Attendance Report",
        data: studentAttendanceRecords,
        checkData: () => selectedStudent && studentAttendanceRecords.length > 0,
        excelMapper: (item: any, index: number) => ({
          "SL No": index + 1,
          "Date": format(new Date(item.date), "dd-MM-yyyy"),
          "Status": item.status,
          "Batch": item.batchName,
        }),
        pdfColumns: ["#", "Date", "Status", "Batch"],
        pdfRowMapper: (item: any, index: number) => [
          index + 1,
          format(new Date(item.date), "dd-MM-yy"),
          item.status,
          item.batchName,
        ],
      },
      "compensation_report": {
        title: "Compensation Class Report",
        data: filteredCompensationData,
        excelMapper: (comp: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": comp.student_name,
          "Branch": comp.branch_name,
          "Batch": comp.batch_name,
          "Compensation Batch": comp.compensation_batch_name,
          "Compensation Date": comp.compensation_date ? format(new Date(comp.compensation_date), "MMM d, yyyy") : 'N/A',
          "Teacher": comp.teacher_name,
          "Course": comp.course_name,
        }),
        pdfColumns: ["#", "Date", "Student", "Teacher", "Course", "Batch", "Compensation Batch", "Branch"],
        pdfRowMapper: (comp: any, index: number) => [
          index + 1,
          comp.compensation_date ? format(new Date(comp.compensation_date), "dd-MM-yy") : 'N/A',
          comp.student_name,
          comp.teacher_name,
          comp.course_name,
          comp.batch_name,
          comp.compensation_batch_name,
          comp.branch_name,
        ],
      },
      "unpaid_report": {
        title: "Unpaid Invoices Report",
        data: filteredUnpaidInvoices,
        periodSuffix: "(by Due Date)",
        excelMapper: (inv: any, index: number) => ({
          "SL No": index + 1,
          "Invoice #": inv.invoice_number,
          "Student Name": inv.student_name,
          "Branch": inv.branch_name,
          "Total Amount": inv.totalAmount,
          "Amount Paid": inv.amount_paid,
          "Balance Due": inv.balanceDue,
          "Status": inv.status,
          "Issue Date": formatDateSafely(inv.issueDate, "MMM d, yyyy"),
          "Due Date": formatDateSafely(inv.due_date, "MMM d, yyyy"),
        }),
        pdfColumns: ["#", "Invoice #", "Student", "Branch", "Total", "Paid", "Balance", "Status", "Issue Date", "Due Date"],
        pdfRowMapper: (inv: any, index: number) => [
          index + 1,
          inv.invoice_number,
          inv.student_name,
          inv.branch_name,
          inv.totalAmount,
          inv.amount_paid,
          inv.balanceDue,
          inv.status,
          formatDateSafely(inv.issueDate, "dd-MM-yy"),
          formatDateSafely(inv.due_date, "dd-MM-yy"),
        ],
      },
      "enquiry_report": {
        title: "Enquiry Report",
        data: filteredEnquiries,
        periodSuffix: "(by Enquiry Date)",
        excelMapper: (enq: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": enq.fullName,
          "Email": enq.email,
          "Phone": enq.phone,
          "Branch": enq.branch_name,
          "Course": enq.course_name,
          "Enquiry Date": formatDateSafely(enq.registration_date, "MMM d, yyyy"),
          "Status": enq.status,
        }),
        pdfColumns: ["#", "Date", "Name", "Email", "Phone", "Branch", "Course"],
        pdfRowMapper: (enq: any, index: number) => [
          index + 1,
          format(new Date(enq.registration_date), "dd-MM-yy"),
          enq.fullName,
          enq.email,
          enq.phone,
          enq.branch_name,
          enq.course_name,
        ],
      },
      "inventory_report": {
        title: "Inventory Stock Report",
        data: filteredInventory,
        periodText: null,
        excelMapper: (item: any, index: number) => ({
          "SL No": index + 1,
          "Item Name": item.item_name,
          "Stock Quantity": item.stock_quantity,
        }),
        pdfColumns: ["#", "Item Name", "Stock Quantity"],
        pdfRowMapper: (item: any, index: number) => [
          index + 1,
          item.item_name,
          item.stock_quantity,
        ],
        pdfOrientation: 'p',
      },
      "transport_report": {
        title: "Transport Revenue Report",
        data: filteredTransportData,
        excelMapper: (item: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": item.student_name,
          "Branch": item.branch_name,
          "Course": item.course_name,
          "Batch": item.batch_name,
          "Mode": item.mode,
          "Picking Point": item.picking_point,
          "Dropping Point": item.dropping_point,
          "Total Amount": item.totalAmount,
        }),
        pdfColumns: ["#", "Student", "Branch", "Course", "Batch", "Mode", "Picking Point", "Dropping Point", "Amount"],
        pdfRowMapper: (item: any, index: number) => [
          index + 1,
          item.student_name,
          item.branch_name,
          item.course_name,
          item.batch_name,
          item.mode,
          item.picking_point,
          item.dropping_point,
          item.totalAmount,
        ],
      },
      "invoice_report": {
        title: "Invoice Report",
        data: flattened_Invoices,
        periodSuffix: "(by Issue Date)",
        excelMapper: (invoice: any, index: number) => ({
          "SL No": index + 1,
          "Invoice #": invoice.invoice_number,
          "Student Name": invoice.student_name,
          "Branch": invoice.branch_name,
          "Total Amount": invoice.totalAmount,
          "Amount Paid": invoice.amountPaid,
          "Balance Due": invoice.balanceDue,
          "Status": invoice.status,
          "Issue Date": formatDateSafely(new Date(invoice.issueDate), "MMM d, yyyy"),
          "Due Date": formatDateSafely(new Date(invoice.dueDate), "MMM d, yyyy"),
        }),
        pdfColumns: ["#", "Invoice #", "Student", "Branch", "Total", "Paid", "Balance", "Status", "Issue Date", "Due Date"],
        pdfRowMapper: (invoice: any, index: number) => [
          index + 1,
          invoice.invoice_number,
          invoice.student_name,
          invoice.branch_name,
          invoice.totalAmount,
          invoice.amountPaid,
          invoice.balanceDue,
          invoice.status,
          format(new Date(invoice.issueDate), "dd-MM-yy"),
          format(new Date(invoice.dueDate), "dd-MM-yy"),
        ],
      },
      "schedule_report": {
        title: "Class Schedule Report",
        data: filteredScheduleData,
        excelMapper: (item: any, index: number) => ({
          "SL No": index + 1,
          "Day": item.day,
          "Start Time": formatExportTime(item.start_time),
          "End Time": formatExportTime(item.end_time),
          "Batch": item.batch_name,
          "Course": item.course_name,
          "Teacher": item.teacher_name,
          "Branch": item.branch_name,
        }),
        pdfColumns: ["#", "Day", "Time", "Batch", "Course", "Teacher", "Branch"],
        pdfRowMapper: (item: any, index: number) => [
          index + 1,
          item.day,
          `${formatExportTime(item.start_time)} - ${formatExportTime(item.end_time)}`,
          item.batch_name,
          item.course_name,
          item.teacher_name,
          item.branch_name,
        ],
      },
      "discontinued_report": {
        title: "Discontinued Students Report",
        data: filteredDiscontinuedStudents,
        excelMapper: (student: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": student.student_name,
          "Branch": student.branch_name,
          "Batch": student.batch_name,
          "Course": student.course_name,
          "Last Attendance Date": formatDateSafely(student.date, "MMM d, yyyy"),
          "Last Status": student.status,
        }),
        pdfColumns: ["#", "Student Name", "Branch", "Batch", "Course", "Last Attendance", "Last Status"],
        pdfRowMapper: (student: any, index: number) => [
          index + 1,
          student.student_name,
          student.branch_name,
          student.batch_name,
          student.course_name,
          format(new Date(student.date), "dd-MM-yy"),
          student.status,
        ],
      },
      "student_list_report": {
        title: "Student List Report",
        data: filteredStudentList,
        excelMapper: (student: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": student.fullName,
          "Email": student.email,
          "Branch": student.branch_name,
          "Batch": student.batch_name,
          "Course": student.course_name,
          "Status": student.computed_status,
        }),
        pdfColumns: ["#", "Student Name", "Email", "Branch", "Batch", "Course", "Status"],
        pdfRowMapper: (student: any, index: number) => [
          index + 1,
          student.fullName,
          student.email,
          student.branch_name,
          student.batch_name,
          student.course_name,
          student.computed_status,
        ],
      },
      "new_admission_report": {
        title: "Student List Report",
        data: filteredStudentList,
        excelMapper: (student: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": student.fullName,
          "Email": student.email,
          "Branch": student.branch_name,
          "Batch": student.batch_name,
          "Course": student.course_name,
          "Status": student.computed_status,
        }),
        pdfColumns: ["#", "Student Name", "Email", "Branch", "Batch", "Course", "Status"],
        pdfRowMapper: (student: any, index: number) => [
          index + 1,
          student.fullName,
          student.email,
          student.branch_name,
          student.batch_name,
          student.course_name,
          student.computed_status,
        ],
      },
      "batch_attendance_report": {
        title: "Batch Attendance Summary Report",
        data: filteredBatchAttendance,
        excelMapper: (student: any, index: number) => {
          const total = student.presentCount + student.absentCount;
          const percentage = total > 0 ? `${Math.round((student.presentCount / total) * 100)}%` : "0%";
          return {
            "SL No": index + 1,
            "Student ID": student.studentId,
            "Student Name": student.studentName,
            "Branch": student.branchName,
            "Batch": student.batchName,
            "Course": student.courseName,
            "Present": student.presentCount,
            "Absent": student.absentCount,
            "Leave": student.leaveCount,
            "Compensation":student.Compensation,
            "Attendance %": percentage,
          };
        },
        pdfColumns: ["#", "Student ID", "Student Name", "Branch", "Batch", "Present", "Absent", "Leave","Compensation", "Attendance %"],
        pdfRowMapper: (student: any, index: number) => {
          const total = student.presentCount + student.absentCount;
          const percentage = total > 0 ? `${Math.round((student.presentCount / total) * 100)}%` : "0%";
          return [
            index + 1,
            student.studentId,
            student.studentName,
            student.branchName,
            student.batchName,
            student.presentCount,
            student.absentCount,
            student.leaveCount,
            student.Compensation,
            percentage,
          ];
        },
      },
      "parent_details_report": {
        title: "Parent's Details Report",
        data: filteredParentDetails,
        excelMapper: (p: any, index: number) => ({
          "SL No": index + 1,
          "Parent Name": p.parent_name,
          "Phone": p.parent_phone,
          "Email": p.parent_email,
          "Address": p.parent_address,
          "Community": p.parent_community,
          "Status": p.parent_status,
        }),
        pdfColumns: ["#", "Parent Name", "Phone", "Email", "Address", "Community", "Status"],
        pdfRowMapper: (p: any, index: number) => [
          index + 1,
          p.parent_name,
          p.parent_phone,
          p.parent_email,
          p.parent_address,
          p.parent_community,
          p.parent_status,
        ],
      },
      "receipt_report": {
        title: "Receipt Report",
        data: filteredReceipts,
        excelMapper: (receipt: any, index: number) => {
          const date = receipt.payment_date
            ? new Date(receipt.payment_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "MMM d, yyyy")
            : 'N/A';

          return {
            "SL No": index + 1,
            "Receipt #": receipt.receipt_number,
            "Student Name": receipt.student_name,
            "Branch": receipt.branch_name,
            "Amount": receipt.amount,
            "Payment Mode": receipt.payment_mode,
            "Date": formattedDate,
          };
        },
        pdfColumns: ["#", "Receipt #", "Student", "Branch", "Amount", "Payment Mode", "Date"],
        pdfRowMapper: (receipt: any, index: number) => {
          const date = receipt.payment_date
            ? new Date(receipt.payment_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "dd-MM-yy")
            : 'N/A';

          return [
            index + 1,
            receipt.receipt_number,
            receipt.student_name,
            receipt.branch_name,
            receipt.amount,
            receipt.payment_mode,
            formattedDate,
          ];
        },
      },
      "Credit note Report": {
        title: "Credit Note Report",
        data: filteredCreditNotes,
        excelMapper: (note: any, index: number) => {
          const date = note.credit_note_date
            ? new Date(note.credit_note_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "MMM d, yyyy")
            : 'N/A';

          return {
            "SL No": index + 1,
            "Credit Note #": note.credit_note_number,
            "Student Name": note.student_name,
            "Branch": note.branch_name,
            "Amount": note.amount,
            "Reason": note.reason,
            "Date": formattedDate,
          };
        },
        pdfColumns: ["#", "Credit Note #", "Student", "Branch", "Amount", "Reason", "Date"],
        pdfRowMapper: (note: any, index: number) => {
          const date = note.credit_note_date
            ? new Date(note.credit_note_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "dd-MM-yy")
            : 'N/A';

          return [
            index + 1,
            note.credit_note_number,
            note.student_name,
            note.branch_name,
            note.amount,
            note.reason,
            formattedDate,
          ];
        },
      },
      "invoice_cancellation_report": {
        title: "invoice_cancellation_report",
        data: filteredCancellations,
        excelMapper: (note: any, index: number) => {
          const date = note.cancellation_date
            ? new Date(note.cancellation_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "MMM d, yyyy")
            : 'N/A';

          return {
            "SL No": index + 1,
            "Invoice #": note.invoice_number,
            "Student Name": note.student_name,
            "Branch": note.branch_name,
            "Batch": note.batch_name,
            "Course Name": note.course_name,
            "Status": note.status,
            "Date": formattedDate,
          };
        },
        pdfColumns: ["#", "Invoice #", "Student", "Branch", "Batch", "Course", "Status", "Date"],
        pdfRowMapper: (note: any, index: number) => {
          const date = note.cancellation_date
            ? new Date(note.cancellation_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "dd-MM-yy")
            : 'N/A';

          return [
            index + 1,
            note.invoice_number,
            note.student_name,
            note.branch_name,
            note.batch_name,
            note.course_name,
            note.status,
            formattedDate,
          ];
        },
      },
    };

    const config = reportConfig[activeTab]; // 'activeTab' is from your component's state

    if (!config) {
      return alert("No export functionality for this tab.");
    }
    if (config.checkData && !config.checkData()) {
      return alert("No data available to export.");
    }

    // --- Prepare all the necessary info for the export ---
    const periodText = config.periodText === null ? "" : (config.customPeriodText || getPeriodText(startDate, endDate));
    const fileName = getFileName(config.title.replace(/ /g, '-'), periodText);

    // Package everything the backend will need
    const payload = {
      type, // 'pdf' or 'excel'
      fileName,
      title: config.title,
      sheetName: config.title.split(' ')[0],
      periodText: periodText ? `${periodText} ${config.periodSuffix || ""}`.trim() : "",
      orientation: config.pdfOrientation || 'l',
      // Data for PDF (rows of arrays)
      pdf: {
        columns: config.pdfColumns,
        rows: config.data.map(config.pdfRowMapper)
      },
      // Data for Excel (rows of objects) and column definitions
      excel: {
        columns: Object.values(config.excelMapper({}, 0)).map(val => String(val)),
        rows: config.data.map(config.excelMapper)
      }
    };

    const calculateAutoSums = (data: any[], mapper: Function) => {
    if (data.length === 0) return { numericFields: [], sums: {} };
    
    const sampleRow = mapper(data[0], 0);
    const numericFields = Object.entries(sampleRow)
      .filter(([key, value]) => {
        // Check if value is numeric
        const numValue = Number(value);
        return !isNaN(numValue) && isFinite(numValue) && key !== "SL No";
      })
      .map(([key]) => key);
    
    const sums: { [key: string]: number } = {};
    
    numericFields.forEach(field => {
      sums[field] = data.reduce((total, item, index) => {
        const row = mapper(item, index);
        const value = parseFloat(String(row[field])) || 0;
        return total + value;
      }, 0);
    });
    
    return { numericFields, sums };
  };
  
  // Add auto-sum row for Excel
  if (type === 'excel') {
    const { numericFields, sums } = calculateAutoSums(config.data, config.excelMapper);
    
    // Add sum row to Excel data if there are numeric fields
    if (numericFields.length > 0) {
      const sumRow: any = {};
      Object.keys(config.excelMapper(config.data[0], 0)).forEach(key => {
        sumRow[key] = numericFields.includes(key) ? sums[key] : (key === "SL No" ? "TOTAL" : "");
      });
      
      payload.excel.rows.push(sumRow);
    }
  }
    setExportConfig(payload);
    setIsModalOpen(true);
  };

  const handleConfirmExport = async (password: string) => {
    if (!exportConfig) return;

    // Prepare the final payload for the backend API
    const bodyPayload = {
      password,
      reportData: exportConfig.type === 'excel' ? exportConfig.excel.rows : exportConfig.pdf.rows,
      config: {
        fileName: exportConfig.fileName,
        title: exportConfig.title,
        sheetName: exportConfig.sheetName,
        periodText: exportConfig.periodText,
        orientation: exportConfig.orientation,
        columns: exportConfig.type === 'pdf' ? exportConfig.pdf.columns : undefined,
        excelColumns: exportConfig.type === 'excel' ? Object.keys(exportConfig.excel.rows[0]) : undefined,
      }
    };

    try {
      const response = await fetch(`/api/export/${exportConfig.type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Handle the file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${exportConfig.fileName}.${exportConfig.type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error) {
      console.error('Error during file export:', error);
      alert('Failed to export file.');
    } finally {
      setIsModalOpen(false); // Close the modal
      setExportConfig(null);
    }
  };

  // This would be inside your main React component
  const handleTopExport = async (type: "excel" | "pdf") => {
    // Helper functions
    const getPeriodText = (start: Date | null, end: Date | null) => {
      if (start && end) return `${format(start, "dd-MM-yyyy")} to ${format(end, "dd-MM-yyyy")}`;
      if (start) return `from ${format(start, "dd-MM-yyyy")}`;
      return "for all time";
    };

    const getFileName = (title: string, periodText: string) => {
      const safePeriod = periodText.replace(/ /g, '_').replace(/,/g, '');
      return `${title}${safePeriod ? `-${safePeriod}` : ''}`;
    };

    const generateExcel = (data: any[], fileName: string, sheetName: string) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const generatePdf = async ({
      fileName,
      title,
      periodText,
      columns,
      rows,
      orientation = 'l',
      customHeader = null,
      customSubheader = null,
    }: {
      fileName: string;
      title: string;
      periodText: string;
      columns: string[];
      rows: any[][];
      orientation?: 'p' | 'l';
      customHeader?: string | null;
      customSubheader?: string | null;
    }) => {
      const doc = new jsPDF(orientation, 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.width;

      // Add Header Image
      const logoBase64 = await imageToBase64('/header.png');
      const dimensions = await getImageDimensions(logoBase64);
      const scaleFactor = 0.25;
      doc.addImage(logoBase64, 'PNG', 40, 40, dimensions.width * scaleFactor, dimensions.height * scaleFactor);

      // Add Main Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, 80, { align: 'center' });

      // Add Sub-details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let startY = 150;

      if (customHeader) {
        doc.text(customHeader, 40, startY);
        startY += 15;
      }

      if (periodText) {
        doc.text(`Period: ${periodText}`, 40, startY);
        startY += 15;
      }

      if (customSubheader) {
        doc.text(customSubheader, 40, startY);
        startY += 15;
      }

      doc.text(`Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}`, 40, startY);

      // Add Table
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: startY + 10,
        theme: 'grid',
        headStyles: { fillColor: [38, 52, 102], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 25 } }
      });

      doc.save(`${fileName}.pdf`);
    };

    // Report-specific configurations
    const reportConfig = {
      "attendance": {
        title: "Batch Attendance Report",
        data: filteredBatchAttendance,
        checkData: () => filteredBatchAttendance.length > 0,
        excelMapper: (item: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": item.studentName,
          "Branch": item.branchName,
          "Batch": item.batchName,
          "Present": item.presentCount,
          "Absent": item.absentCount,
          "Leave": item.leaveCount,
        }),
        pdfColumns: ["#", "Student Name", "Branch", "Batch", "Present", "Absent", "Leave"],
        pdfRowMapper: (item: any, index: number) => [
          index + 1,
          item.studentName,
          item.branchName,
          item.batchName,
          item.presentCount,
          item.absentCount,
          item.leaveCount,
        ],
      },
      "students": {
        title: "Student Attendance Report",
        data: studentAttendanceRecords,
        checkData: () => selectedStudent && studentAttendanceRecords.length > 0,
        excelMapper: (item: any, index: number) => ({
          "SL No": index + 1,
          "Date": format(new Date(item.date), "dd-MM-yyyy"),
          "Status": item.status,
          "Batch": item.batchName,
        }),
        pdfColumns: ["#", "Date", "Status", "Batch"],
        pdfRowMapper: (item: any, index: number) => [
          index + 1,
          format(new Date(item.date), "dd-MM-yy"),
          item.status,
          item.batchName,
        ],
      },
      "compensation_report": {
        title: "Compensation Class Report",
        data: filteredCompensationData,
        excelMapper: (comp: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": comp.student_name,
          "Branch": comp.branch_name,
          "Batch": comp.batch_name,
          "Compensation Batch": comp.compensation_batch_name,
          "Compensation Date": comp.compensation_date ? format(new Date(comp.compensation_date), "MMM d, yyyy") : 'N/A',
          "Teacher": comp.teacher_name,
          "Course": comp.course_name,
        }),
        pdfColumns: ["#", "Date", "Student", "Teacher", "Course", "Batch", "Compensation Batch", "Branch"],
        pdfRowMapper: (comp: any, index: number) => [
          index + 1,
          comp.compensation_date ? format(new Date(comp.compensation_date), "dd-MM-yy") : 'N/A',
          comp.student_name,
          comp.teacher_name,
          comp.course_name,
          comp.batch_name,
          comp.compensation_batch_name,
          comp.branch_name,
        ],
      },
      "unpaid_report": {
        title: "Unpaid Invoices Report",
        data: filteredUnpaidInvoices,
        periodSuffix: "(by Due Date)",
        excelMapper: (inv: any, index: number) => ({
          "SL No": index + 1,
          "Invoice #": inv.invoice_number,
          "Student Name": inv.student_name,
          "Branch": inv.branch_name,
          "Total Amount": inv.totalAmount,
          "Amount Paid": inv.amount_paid,
          "Balance Due": inv.balanceDue,
          "Status": inv.status,
          "Issue Date": format(new Date(inv.issueDate), "MMM d, yyyy"),
          "Due Date": format(new Date(inv.due_date), "MMM d, yyyy"),
        }),
        pdfColumns: ["#", "Invoice #", "Student", "Branch", "Total", "Paid", "Balance", "Status", "Issue Date", "Due Date"],
        pdfRowMapper: (inv: any, index: number) => [
          index + 1,
          inv.invoice_number,
          inv.student_name,
          inv.branch_name,
          inv.totalAmount,
          inv.amount_paid,
          inv.balanceDue,
          inv.status,
          format(new Date(inv.issueDate), "dd-MM-yy"),
          format(new Date(inv.due_date), "dd-MM-yy"),
        ],
      },
      "enquiry_report": {
        title: "Enquiry Report",
        data: filteredEnquiries,
        periodSuffix: "(by Enquiry Date)",
        excelMapper: (enq: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": enq.fullName,
          "Email": enq.email,
          "Phone": enq.phone,
          "Branch": enq.branch_name,
          "Course": enq.course_name,
          "Enquiry Date": format(new Date(enq.registration_date), "MMM d, yyyy"),
          "Status": enq.status,
        }),
        pdfColumns: ["#", "Date", "Name", "Email", "Phone", "Branch", "Course"],
        pdfRowMapper: (enq: any, index: number) => [
          index + 1,
          format(new Date(enq.registration_date), "dd-MM-yy"),
          enq.fullName,
          enq.email,
          enq.phone,
          enq.branch_name,
          enq.course_name,
        ],
      },
      "inventory_report": {
        title: "Inventory Stock Report",
        data: filteredInventory,
        periodText: null,
        excelMapper: (item: any, index: number) => ({
          "SL No": index + 1,
          "Item Name": item.item_name,
          "Stock Quantity": item.stock_quantity,
        }),
        pdfColumns: ["#", "Item Name", "Stock Quantity"],
        pdfRowMapper: (item: any, index: number) => [
          index + 1,
          item.item_name,
          item.stock_quantity,
        ],
        pdfOrientation: 'p',
      },
      "transport_report": {
        title: "Transport Revenue Report",
        data: filteredTransportData,
        excelMapper: (item: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": item.student_name,
          "Branch": item.branch_name,
          "Course": item.course_name,
          "Batch": item.batch_name,
          "Mode": item.mode,
          "Picking Point": item.picking_point,
          "Dropping Point": item.dropping_point,
          "Total Amount": item.totalAmount,
        }),
        pdfColumns: ["#", "Student", "Branch", "Course", "Batch", "Mode", "Picking Point", "Dropping Point", "Amount"],
        pdfRowMapper: (item: any, index: number) => [
          index + 1,
          item.student_name,
          item.branch_name,
          item.course_name,
          item.batch_name,
          item.mode,
          item.picking_point,
          item.dropping_point,
          item.totalAmount,
        ],
      },
      "invoice_report": {
        title: "Invoice Report",
        data: flattened_Invoices,
        periodSuffix: "(by Issue Date)",
        excelMapper: (invoice: any, index: number) => ({
          "SL No": index + 1,
          "Invoice #": invoice.invoice_number,
          "Student Name": invoice.student_name,
          "Branch": invoice.branch_name,
          "Total Amount": invoice.totalAmount,
          "Amount Paid": invoice.amountPaid,
          "Balance Due": invoice.balanceDue,
          "Status": invoice.status,
          "Issue Date": format(new Date(invoice.issueDate), "MMM d, yyyy"),
          "Due Date": format(new Date(invoice.dueDate), "MMM d, yyyy"),
        }),
        pdfColumns: ["#", "Invoice #", "Student", "Branch", "Total", "Paid", "Balance", "Status", "Issue Date", "Due Date"],
        pdfRowMapper: (invoice: any, index: number) => [
          index + 1,
          invoice.invoice_number,
          invoice.student_name,
          invoice.branch_name,
          invoice.totalAmount,
          invoice.amountPaid,
          invoice.balanceDue,
          invoice.status,
          format(new Date(invoice.issueDate), "dd-MM-yy"),
          format(new Date(invoice.dueDate), "dd-MM-yy"),
        ],
      },
      "schedule_report": {
        title: "Class Schedule Report",
        data: filteredScheduleData,
        excelMapper: (item: any, index: number) => ({
          "SL No": index + 1,
          "Day": item.day,
          "Start Time": formatExportTime(item.start_time),
          "End Time": formatExportTime(item.end_time),
          "Batch": item.batch_name,
          "Course": item.course_name,
          "Teacher": item.teacher_name,
          "Branch": item.branch_name,
        }),
        pdfColumns: ["#", "Day", "Time", "Batch", "Course", "Teacher", "Branch"],
        pdfRowMapper: (item: any, index: number) => [
          index + 1,
          item.day,
          `${formatExportTime(item.start_time)} - ${formatExportTime(item.end_time)}`,
          item.batch_name,
          item.course_name,
          item.teacher_name,
          item.branch_name,
        ],
      },
      "discontinued_report": {
        title: "Discontinued Students Report",
        data: filteredDiscontinuedStudents,
        excelMapper: (student: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": student.student_name,
          "Branch": student.branch_name,
          "Batch": student.batch_name,
          "Course": student.course_name,
          "Last Attendance Date": format(new Date(student.date), "MMM d, yyyy"),
          "Last Status": student.status,
        }),
        pdfColumns: ["#", "Student Name", "Branch", "Batch", "Course", "Last Attendance", "Last Status"],
        pdfRowMapper: (student: any, index: number) => [
          index + 1,
          student.student_name,
          student.branch_name,
          student.batch_name,
          student.course_name,
          format(new Date(student.date), "dd-MM-yy"),
          student.status,
        ],
      },
      "student_list_report": {
        title: "Student List Report",
        data: filteredStudentList,
        excelMapper: (student: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": student.fullName,
          "Email": student.email,
          "Branch": student.branch_name,
          "Batch": student.batch_name,
          "Course": student.course_name,
          "Status": student.computed_status,
        }),
        pdfColumns: ["#", "Student Name", "Email", "Branch", "Batch", "Course", "Status"],
        pdfRowMapper: (student: any, index: number) => [
          index + 1,
          student.fullName,
          student.email,
          student.branch_name,
          student.batch_name,
          student.course_name,
          student.computed_status,
        ],
      },
      "new_admission_report": {
        title: "Student List Report",
        data: filteredStudentList,
        excelMapper: (student: any, index: number) => ({
          "SL No": index + 1,
          "Student Name": student.fullName,
          "Email": student.email,
          "Branch": student.branch_name,
          "Batch": student.batch_name,
          "Course": student.course_name,
          "Status": student.computed_status,
        }),
        pdfColumns: ["#", "Student Name", "Email", "Branch", "Batch", "Course", "Status"],
        pdfRowMapper: (student: any, index: number) => [
          index + 1,
          student.fullName,
          student.email,
          student.branch_name,
          student.batch_name,
          student.course_name,
          student.computed_status,
        ],
      },
      "batch_attendance_report": {
        title: "Batch Attendance Summary Report",
        data: filteredBatchAttendance,
        excelMapper: (student: any, index: number) => {
          const total = student.presentCount + student.absentCount;
          const percentage = total > 0 ? `${Math.round((student.presentCount / total) * 100)}%` : "0%";
          return {
            "SL No": index + 1,
            "Student ID": student.studentId,
            "Student Name": student.studentName,
            "Branch": student.branchName,
            "Batch": student.batchName,
            "Course": student.courseName,
            "Present": student.presentCount,
            "Absent": student.absentCount,
            "Leave": student.leaveCount,
            "Compensation":student.compensation,
            "Attendance %": percentage,
          };
        },
        pdfColumns: ["#", "Student ID", "Student Name", "Branch", "Batch", "Present", "Absent", "Leave","Compensation", "Attendance %"],
        pdfRowMapper: (student: any, index: number) => {
          const total = student.presentCount + student.absentCount;
          const percentage = total > 0 ? `${Math.round((student.presentCount / total) * 100)}%` : "0%";
          return [
            index + 1,
            student.studentId,
            student.studentName,
            student.branchName,
            student.batchName,
            student.presentCount,
            student.absentCount,
            student.leaveCount,
            student.compensation,
            percentage,
          ];
        },
      },
      "parent_details_report": {
        title: "Parent's Details Report",
        data: filteredParentDetails,
        excelMapper: (p: any, index: number) => ({
          "SL No": index + 1,
          "Parent Name": p.parent_name,
          "Phone": p.parent_phone,
          "Email": p.parent_email,
          "Address": p.parent_address,
          "Community": p.parent_community,
          "Status": p.parent_status,
        }),
        pdfColumns: ["#", "Parent Name", "Phone", "Email", "Address", "Community", "Status"],
        pdfRowMapper: (p: any, index: number) => [
          index + 1,
          p.parent_name,
          p.parent_phone,
          p.parent_email,
          p.parent_address,
          p.parent_community,
          p.parent_status,
        ],
      },
      "receipt_report": {
        title: "Receipt Report",
        data: filteredReceipts,
        excelMapper: (receipt: any, index: number) => {
          const date = receipt.payment_date
            ? new Date(receipt.payment_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "MMM d, yyyy")
            : 'N/A';

          return {
            "SL No": index + 1,
            "Receipt #": receipt.receipt_number,
            "Student Name": receipt.student_name,
            "Branch": receipt.branch_name,
            "Amount": receipt.amount,
            "Payment Mode": receipt.payment_mode,
            "Date": formattedDate,
          };
        },
        pdfColumns: ["#", "Receipt #", "Student", "Branch", "Amount", "Payment Mode", "Date"],
        pdfRowMapper: (receipt: any, index: number) => {
          const date = receipt.payment_date
            ? new Date(receipt.payment_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "dd-MM-yy")
            : 'N/A';

          return [
            index + 1,
            receipt.receipt_number,
            receipt.student_name,
            receipt.branch_name,
            receipt.amount,
            receipt.payment_mode,
            formattedDate,
          ];
        },
      },
      "Credit note Report": {
        title: "Credit Note Report",
        data: filteredCreditNotes,
        excelMapper: (note: any, index: number) => {
          const date = note.credit_note_date
            ? new Date(note.credit_note_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "MMM d, yyyy")
            : 'N/A';

          return {
            "SL No": index + 1,
            "Credit Note #": note.credit_note_number,
            "Student Name": note.student_name,
            "Branch": note.branch_name,
            "Amount": note.amount,
            "Reason": note.reason,
            "Date": formattedDate,
          };
        },
        pdfColumns: ["#", "Credit Note #", "Student", "Branch", "Amount", "Reason", "Date"],
        pdfRowMapper: (note: any, index: number) => {
          const date = note.credit_note_date
            ? new Date(note.credit_note_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "dd-MM-yy")
            : 'N/A';

          return [
            index + 1,
            note.credit_note_number,
            note.student_name,
            note.branch_name,
            note.amount,
            note.reason,
            formattedDate,
          ];
        },
      },
      "invoice_cancellation_report": {
        title: "invoice_cancellation_report",
        data: filteredCancellations,
        excelMapper: (note: any, index: number) => {
          const date = note.cancellation_date
            ? new Date(note.cancellation_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "MMM d, yyyy")
            : 'N/A';

          return {
            "SL No": index + 1,
            "Invoice #": note.invoice_number,
            "Student Name": note.student_name,
            "Branch": note.branch_name,
            "Batch": note.batch_name,
            "Course Name": note.course_name,
            "Status": note.status,
            "Date": formattedDate,
          };
        },
        pdfColumns: ["#", "Invoice #", "Student", "Branch", "Batch", "Course", "Status", "Date"],
        pdfRowMapper: (note: any, index: number) => {
          const date = note.cancellation_date
            ? new Date(note.cancellation_date)
            : null;
          const formattedDate = date && isValid(date)
            ? format(date, "dd-MM-yy")
            : 'N/A';

          return [
            index + 1,
            note.invoice_number,
            note.student_name,
            note.branch_name,
            note.batch_name,
            note.course_name,
            note.status,
            formattedDate,
          ];
        },
      },
    };

    const config = reportConfig[activeTab];

    if (!config) {
      return alert("No export functionality for this tab.");
    }

    // Special cases that need data checks
    if (activeTab === "attendance" && !config.checkData()) {
      return alert("No batch attendance data available to export.");
    }

    if (activeTab === "students" && !config.checkData()) {
      return alert("No student attendance data available to export.");
    }

    const {
      data,
      title,
      periodSuffix = "",
      excelMapper,
      pdfColumns,
      pdfRowMapper,
      pdfOrientation = 'l',
      periodText: customPeriodText,
    } = config;

    if (!data || data.length === 0) {
      return alert("No data available to export.");
    }

    const periodText = customPeriodText === null ? "" : (customPeriodText || getPeriodText(startDate, endDate));
    const fileName = getFileName(title.replace(/ /g, '-'), periodText);

    if (type === 'excel') {
      const excelData = data.map(excelMapper);
      generateExcel(excelData, fileName, title.split(' ')[0]);
    } else {
      const tableRows = data.map(pdfRowMapper);
      await generatePdf({
        fileName,
        title,
        periodText: periodText ? `${periodText} ${periodSuffix}`.trim() : "",
        columns: pdfColumns,
        rows: tableRows,
        orientation: pdfOrientation,
      });
    }
  };


  // Add scroll check function
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      checkScrollButtons();
      scrollElement.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        scrollElement.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, []);
   const tabs = [
    { value: 'batch_attendance_report', label: 'Batch Attendance' },
    { value: 'Credit note Report', label: 'Credit note Report' },
    { value: 'receipt_report', label: 'Receipt Report' },
    { value: 'compensation_report', label: 'Compensation Report' },
    { value: 'unpaid_report', label: 'Unpaid Report' },
    { value: 'enquiry_report', label: 'Enquiry Report' },
    { value: 'inventory_report', label: 'Inventory Report' },
    { value: 'transport_report', label: 'Transport Report' },
    { value: 'invoice_report', label: 'Invoice Report' },
    { value: 'schedule_report', label: 'Schedule Report' },
    { value: 'discontinued_report', label: 'Discontinued Report' },
    { value: 'student_list_report', label: 'Student List' },
    { value: 'new_admission_report', label: 'New admission' },
    { value: 'parent_details_report', label: 'Parent\'s Details' },
    { value: 'invoice_cancellation_report', label: 'Invoice Cancellations' }
  ];


   const selectedTabLabel = tabs.find(tab => tab.value === activeTab)?.label;

  const handleTabSelect = (newTab) => {
    setActiveTab(newTab);

    // Clear dates only for tabs that need it (same logic as your original)
    const tabsThatNeedDateClearance = [
      "batch_attendance_report",
      "Credit note Report",
      "receipt_report",
      "compensation_report",
      "unpaid_report",
      "enquiry_report",
      "inventory_report",
      "transport_report",
      "invoice_report",
      "schedule_report",
      "discontinued_report",
      "student_list_report",
      "new_admission_report",
      "parent_details_report",
      "invoice_cancellation_report"
    ];

    if (tabsThatNeedDateClearance.includes(newTab)) {
      setStartDate(null);
      setEndDate(null);
    }

    setIsOpen(false);
  };


  return (
    <AppShell>
      <PageHeader
        title="Reports & Analytics"
        description="Analyze key performance indicators and business metrics."
        actions={
          <>
            <Button onClick={() => handleExportClick('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => handleExportClick('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </>
        }
      />

      {isModalOpen && (
        <PasswordModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmExport}
          exportType={exportConfig?.type}
        />
      )}


      <Tabs
        value={activeTab}
        onValueChange={(newTab) => {
          setActiveTab(newTab);

          // Clear dates only for tabs that need it
          const tabsThatNeedDateClearance = [
            "batch_attendance_report",
            "Credit note Report",
            "receipt_report",
            "compensation_report",
            "unpaid_report",
            "enquiry_report",
            "inventory_report",
            "transport_report",
            "invoice_report",
            "schedule_report",
            "discontinued_report",
            "student_list_report",
            "new_admission_report",
            "parent_details_report",
            "invoice_cancellation_report"
          ];

          if (tabsThatNeedDateClearance.includes(newTab)) {
            setStartDate(null);
            setEndDate(null);
          }
        }}
        className="w-full"
      >
        <div className="w-full">
      {/* Replace your entire Tabs wrapper and scrollable header with this */}
      <SearchableReportDropdown
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
      />
      </div>

        
        <TabsContent value="batch_attendance_report" className="mt-0">
          <div className="mt-6">
            <BatchAttendanceReport
              batchAttendanceData={filteredBatchAttendance}
              isLoading={isBatchAttendanceLoading}
              // Pass all necessary data for the filters
              brands={brands}
              branches={branchesData}
              departments={departments}
              courses={courses}
              batches={batches}
              teachers={teachers}
              students={allBatchesStudents}
              onFiltersChange={setBatchAttendanceFilterConditions} // Pass the setter directly
              filterConditions={batchAttendanceFilterConditions} // Pass the current filters
              // onFiltersChange={handleBatchAttendanceFiltersChange}
              onDateRangeChange={handleDateRangeChange}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </div>
        </TabsContent>
        <TabsContent value="Credit note Report" className="mt-0">
          <div className="mt-6">
            <CreditNoteReport
              creditNoteData={filteredCreditNotes}
              isLoading={isCreditNoteLoading}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              brands={brands}
              departments={departments}
              courses={courses}
              teachers={teachers}
              batches={batches}
              students={allBatchesStudents}
              branches={branchesData}
              onFiltersChange={setCreditNoteFilterConditions}
              filterConditions={creditNoteFilterConditions}
            />
          </div>

        </TabsContent>
        <TabsContent value="receipt_report" className="mt-0">
          <div className="mt-6">
            <ReceiptReport
              receiptData={filteredReceipts}
              isLoading={isReceiptsLoading}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              brands={brands}
              departments={departments}
              courses={courses}
              teachers={teachers}
              batches={batches}
              students={allBatchesStudents}
              branches={branchesData}
              onFiltersChange={setFilterConditions}
              filterConditions={filterConditions}
            />
          </div>
        </TabsContent>
        <TabsContent value="compensation_report" className="mt-0">
          <div className="mt-6">
            <CompensationReport
              compensationData={filteredCompensationData}
              isLoading={isCompensationLoading}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              // Pass all necessary data for filters
              brands={brands}
              departments={departments}
              courses={courses}
              teachers={teachers}
              batches={batches}
              students={allBatchesStudents}
              branches={branchesData}
              onFiltersChange={setCompensationFilterConditions}
              onDateRangeChange={handleDateRangeChange}
              filterConditions={compensationFilterConditions}
            />
          </div>
        </TabsContent>
        <TabsContent value="unpaid_report" className="mt-0">
          <div className="mt-6">
            <UnpaidReport
              unpaidData={filteredUnpaidInvoices}
              isLoading={isUnpaidLoading}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              // Pass all necessary data for filters
              brands={brands}
              departments={departments}
              courses={courses}
              teachers={teachers}
              batches={batches}
              students={allBatchesStudents}
              branches={branchesData}
              onFiltersChange={setUnpaidFilterConditions}
              onDateRangeChange={handleDateRangeChange}
              filterConditions={unpaidFilterConditions}
            />
          </div>
        </TabsContent>
        <TabsContent value="enquiry_report" className="mt-0">
          <div className="mt-6">
            <EnquiryReport
              enquiryData={filteredEnquiries}
              isLoading={isEnquiriesLoading}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              // Pass data for filters
              students={allBatchesStudents}
              branches={branchesData}
              courses={courses}
              onFiltersChange={setEnquiryFilterConditions}
              onDateRangeChange={handleDateRangeChange}
              filterConditions={enquiryFilterConditions}
            />
          </div>
        </TabsContent>
        <TabsContent value="inventory_report" className="mt-0">
          <div className="mt-6">
            <InventoryReport
              inventoryData={filteredInventory}
              isLoading={isInventoryLoading}
              // PASS THE NEW PROPS DOWN
              itemOptions={inventoryItemOptions}
              selectedItem={selectedItemName}
              setSelectedItem={setSelectedItemName}
              onFiltersChange={setInventoryFilterConditions}
              onDateRangeChange={handleDateRangeChange}
              filterConditions={inventoryFilterConditions}
            />
          </div>
        </TabsContent>
        <TabsContent value="transport_report" className="mt-0">
          <div className="mt-6">
            <TransportReport
              transportData={filteredTransportData}
              isLoading={isTransportLoading}
              // Pass all necessary data for the filters
              brands={brands}
              branches={branchesData}
              batches={batches}
              courses={courses}
              students={allBatchesStudents} // Pass student data if you want to add a student filter
              onFiltersChange={setTransportFilterConditions}
              onDateRangeChange={handleDateRangeChange}
              filterConditions={transportFilterConditions}
            />
          </div>
        </TabsContent>
        <TabsContent value="invoice_report" className="mt-0">
          <div className="mt-6">
            <InvoiceReport
              invoiceData={filteredInvoices}
              isLoading={isInvoiceLoading}
              // startDate={startDate}
              // endDate={endDate}
              // setStartDate={setStartDate}
              // setEndDate={setEndDate}
              // Pass all necessary data for the filters
              brands={brands}
              branches={branchesData}
              departments={departments}
              courses={courses}
              batches={batches}
              teachers={teachers}
              students={allBatchesStudents}
              onFiltersChange={setInvoiceFilterConditions}
              onDateRangeChange={handleDateRangeChange}
              filterConditions={invoiceFilterConditions}
            />
          </div>
        </TabsContent>
        <TabsContent value="schedule_report" className="mt-0">
          <div className="mt-6">
            <ScheduleReport
              scheduleData={filteredScheduleData}
              isLoading={isScheduleLoading}
              // Pass all necessary data for the filters
              brands={brands}
              branches={branchesData}
              departments={departments}
              courses={courses}
              batches={batches}
              teachers={teachers}
              onFiltersChange={setScheduleFilterConditions}
              onDateRangeChange={handleDateRangeChange}
              filterConditions={scheduleFilterConditions}
            />
          </div>
        </TabsContent>
        <TabsContent value="discontinued_report" className="mt-0">
          <div className="mt-6">
            <DiscontinuedReport
              discontinuedData={filteredDiscontinuedStudents}
              isLoading={isDiscontinuedLoading}
              // Pass all necessary data for the filters
              brands={brands}
              branches={branchesData}
              departments={departments}
              courses={courses}
              batches={batches}
              teachers={teachers}
              students={allBatchesStudents}
              onFiltersChange={setDiscontinuedFilterConditions}
              onDateRangeChange={handleDateRangeChange}
              filterConditions={discontinuedFilterConditions}
            />
          </div>
        </TabsContent>
        <TabsContent value="student_list_report" className="mt-0">
          <div className="mt-6">
            <StudentListReport
              studentData={filteredStudentList}
              isLoading={isStudentListLoading}
              // Pass all necessary data for the filters
              brands={brands}
              branches={branchesData}
              departments={departments}
              courses={courses}
              batches={batches}
              teachers={teachers}
              students={allBatchesStudents} // Used for 'student' dropdown
              onFiltersChange={setStudentListFilterConditions}
              filter_Conditions={studentListFilterConditions}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </TabsContent>
        <TabsContent value="new_admission_report" className="mt-0">
          <div className="mt-6">
            <Newadmissionreport
              studentData={filteredStudentList}
              isLoading={isStudentListLoading}
              // Pass all necessary data for the filters
              brands={brands}
              branches={branchesData}
              departments={departments}
              courses={courses}
              batches={batches}
              teachers={teachers}
              students={allBatchesStudents} // Used for 'student' dropdown
              onFiltersChange={setStudentListFilterConditions}
              filter_Conditions={studentListFilterConditions}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </TabsContent>
        <TabsContent value="parent_details_report" className="mt-0">
          <div className="mt-6">
            <ParentDetailsReport
              parentData={filteredParentDetails}
              isLoading={isParentDetailsLoading}
              // Pass all necessary data for the filters
              brands={brands}
              branches={branchesData}
              departments={departments}
              courses={courses}
              batches={batches}
              teachers={teachers}
              students={allBatchesStudents}
              onFiltersChange={setParentDetailsFilterConditions}
              onDateRangeChange={handleDateRangeChange}
              filterConditions={parentDetailsFilterConditions}
            />
          </div>
        </TabsContent>
        <TabsContent value="invoice_cancellation_report" className="mt-0">
          <div className="mt-6">
            <InvoiceCancellationReport
              cancellationData={filteredCancellations}
              isLoading={isCancellationsLoading}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              // Pass all necessary data for the filters
              brands={brands}
              branches={branchesData}
              departments={departments}
              courses={courses}
              batches={batches}
              teachers={teachers}
              students={allBatchesStudents}
              onFiltersChange={setCancellationFilterConditions}
              filterConditions={cancellationFilterConditions}
            // onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </TabsContent>


      </Tabs>
      {/* Add custom CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          scroll-behavior: smooth;
        }
      `}</style>
    </AppShell>
  );
}