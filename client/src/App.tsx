import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import { CubeProvider } from '@cubejs-client/react';

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCourses from "@/pages/admin/courses";
import AdminFees from "@/pages/admin/fees";
import AdminInventory from "@/pages/admin/inventory";
import AdminStudents from "@/pages/admin/students";
import AdminParents from "@/pages/admin/parents";
import AdminAttendance from "@/pages/admin/attendance";
import AdminPayments from "@/pages/admin/payments";
import AdminTeachers from "@/pages/admin/teachers";
import AdminPayroll from "@/pages/admin/payroll";
import AdminReports from "@/pages/admin/reports";
import AdminSettings from "@/pages/admin/settings";
import AdminCalendar from "@/pages/admin/calendar";
import AdminMessages from "@/pages/admin/messages";
import PrintInvoice from "@/pages/admin/print-invoice";
import InvoicesPage from "./pages/admin/invoices";
import InvoicePage from "./pages/admin/InvoicePage";
import StudentEnrollments from "./pages/admin/studentEnrollments";
import PrintReceipt from "./pages/admin/printReceipt";
import StudentEnquiry from "./pages/admin/studentEnquiry";
import AdminItemStock from "./pages/admin/itemStock";

// Teacher pages
import TeacherDashboard from "@/pages/teacher/dashboard";
import TeacherStudents from "@/pages/teacher/students";
import TeacherAttendance from "@/pages/teacher/attendance";
import TeacherCalendar from "@/pages/teacher/calendar";
import TeacherBatches from "@/pages/teacher/batches";
import TeacherMessages from "@/pages/teacher/messages";

// Parent pages
import ParentDashboard from "@/pages/parent/dashboard";
import ParentChildren from "@/pages/parent/children";
import ParentAttendance from "@/pages/parent/attendance";
import ParentCalendar from "@/pages/parent/calendar";
import ParentMessages from "@/pages/parent/messages";
import ParentPayments from "@/pages/parent/payments";

// Student pages
import StudentDashboard from "@/pages/student/dashboard";
import StudentCourses from "@/pages/student/courses";
import StudentAttendance from "@/pages/student/attendance";
import StudentCalendar from "@/pages/student/calendar";
import StudentMessages from "@/pages/student/messages";
import StudentPayments from "@/pages/student/payments";
import StudentProfile from "@/pages/student/profile";
import ResetPasswordPage from "./pages/reset-password";
import CreditNotes from "./pages/admin/creditNotes";
import PrintCreditNote from "./pages/admin/printCreditNote";
import ParentCreditNotes from "./pages/parent/creditNotes";
import AdminBatches from "./pages/admin/batches";

// Branch Admin pages
import BranchAdminDashboard from "./pages/branchAdmin/dashboard";
import BranchAdminCourses from "./pages/branchAdmin/courses";
import BranchAdminInventory from "./pages/branchAdmin/inventory";
import BranchAdminStudents from "./pages/branchAdmin/students";
import BranchAdminStudentEnrollments from "./pages/branchAdmin/studentEnrollments";
import BranchAdminStudentEnquiry from "./pages/branchAdmin/studentEnquiry";
import BranchAdminParents from "./pages/branchAdmin/parents";
import BranchAdminBatches from "./pages/branchAdmin/batches";
import BranchAdminAttendance from "./pages/branchAdmin/attendance";
import BranchAdminPayments from "./pages/branchAdmin/payments";
import BranchAdminInvoicesPage from "./pages/branchAdmin/invoices";
import BranchAdminCreditNotes from "./pages/branchAdmin/creditNotes";
import BranchAdminTeachers from "./pages/branchAdmin/teachers";
import BranchAdminReports from "./pages/branchAdmin/reports";
import BranchAdminSettings from "./pages/branchAdmin/settings";
import BranchAdminPrintInvoice from "./pages/branchAdmin/print-invoice";
import BranchAdminPrintReceipt from "./pages/branchAdmin/printReceipt";
import AdminRoles from "./pages/admin/roles";
import BranchAdmin from "./pages/admin/branchAdmin";
// import TestCubeConnection from "./components/TestCubeConnection";


function Router() {
  return (
    <Switch>
      {/* Auth Page */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset/:token" component={ResetPasswordPage} />
      {/* Profile Page - accessible by all authenticated users */}
      <ProtectedRoute
        path="/profile"
        component={ProfilePage}
        allowedRoles={["admin", "teacher", "parent", "student", "branch_admin"]}
      />
      {/* Admin Routes */}
      <ProtectedRoute
        path="/"
        component={AdminDashboard}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/dashboard"
        component={AdminDashboard}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/courses"
        component={AdminCourses}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/fees"
        component={AdminFees}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/inventory"
        component={AdminInventory}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/stock-items"
        component={AdminItemStock}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/students"
        component={AdminStudents}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/student-enrollments"
        component={StudentEnrollments}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/student-enquiry"
        component={StudentEnquiry}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/parents"
        component={AdminParents}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/branch-admins"
        component={BranchAdmin}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/batches"
        component={AdminBatches}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/attendance"
        component={AdminAttendance}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/payments"
        component={AdminPayments}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/invoices"
        component={InvoicesPage}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/credit-notes"
        component={CreditNotes}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/teachers"
        component={AdminTeachers}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/employees"
        component={AdminTeachers}
        allowedRoles={["admin"]}
      />{" "}
      {/* Temporary redirect to teachers */}
      <ProtectedRoute
        path="/admin/payroll"
        component={AdminPayroll}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/reports"
        component={AdminReports}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/settings"
        component={AdminSettings}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/calendar"
        component={AdminCalendar}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/messages"
        component={AdminMessages}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/print-invoice/:invoiceId"
        component={PrintInvoice}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/invoice/:invoiceId"
        component={InvoicePage}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/print-receipt/:receiptNumber"
        component={PrintReceipt}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/print-credit-note/:creditNoteNumber"
        component={PrintCreditNote}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/roles"
        component={AdminRoles}
        allowedRoles={["admin"]}
      />

      {/* Branch Admin Routes */}
      <ProtectedRoute
        path="/branch-admin/dashboard"
        component={BranchAdminDashboard}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/courses"
        component={BranchAdminCourses}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/inventory"
        component={BranchAdminInventory}
        allowedRoles={["branch_admin"]}
      />
      {/* <ProtectedRoute
        path="/branch-admin/stock-items"
        component={BranchAdminItemStock}
        allowedRoles={["branch_admin"]}
      /> */}
      <ProtectedRoute
        path="/branch-admin/students"
        component={BranchAdminStudents}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/student-enrollments"
        component={BranchAdminStudentEnrollments}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/student-enquiry"
        component={BranchAdminStudentEnquiry}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/parents"
        component={BranchAdminParents}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/batches"
        component={BranchAdminBatches}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/attendance"
        component={BranchAdminAttendance}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/payments"
        component={BranchAdminPayments}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/invoices"
        component={BranchAdminInvoicesPage}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/invoice/:invoiceId"
        component={InvoicePage}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/credit-notes"
        component={BranchAdminCreditNotes}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/teachers"
        component={BranchAdminTeachers}
        allowedRoles={["branch_admin"]}
      />
      {/* Temporary redirect to teachers */}
      {/* <ProtectedRoute
        path="/branch-admin/payroll"
        component={BranchAdminPayroll}
        allowedRoles={["branch_admin"]}
      /> */}
      <ProtectedRoute
        path="/branch-admin/reports"
        component={BranchAdminReports}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/settings"
        component={BranchAdminSettings}
        allowedRoles={["branch_admin"]}
      />
      {/* <ProtectedRoute
        path="/admin/calendar"
        component={AdminCalendar}
        allowedRoles={["admin"]}
      /> */}
      {/* <ProtectedRoute
        path="/admin/messages"
        component={AdminMessages}
        allowedRoles={["admin"]}
      /> */}
      <ProtectedRoute
        path="/branch-admin/print-invoice/:invoiceId"
        component={BranchAdminPrintInvoice}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/print-receipt/:receiptNumber"
        component={BranchAdminPrintReceipt}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/print-receipt/:receiptNumber"
        component={PrintReceipt}
        allowedRoles={["branch_admin"]}
      />
      <ProtectedRoute
        path="/branch-admin/print-credit-note/:creditNoteNumber"
        component={PrintCreditNote}
        allowedRoles={["branch_admin"]}
      />
      
      {/* Teacher Routes */}
      <ProtectedRoute
        path="/teacher/dashboard"
        component={TeacherDashboard}
        allowedRoles={["teacher"]}
      />
      <ProtectedRoute
        path="/teacher/students"
        component={TeacherStudents}
        allowedRoles={["teacher"]}
      />
      <ProtectedRoute
        path="/teacher/attendance"
        component={TeacherAttendance}
        allowedRoles={["teacher"]}
      />
      <ProtectedRoute
        path="/teacher/calendar"
        component={TeacherCalendar}
        allowedRoles={["teacher"]}
      />
      <ProtectedRoute
        path="/teacher/batches"
        component={TeacherBatches}
        allowedRoles={["teacher"]}
      />
      <ProtectedRoute
        path="/teacher/messages"
        component={TeacherMessages}
        allowedRoles={["teacher"]}
      />
      {/* Parent Routes */}
      <ProtectedRoute
        path="/parent/dashboard"
        component={ParentDashboard}
        allowedRoles={["parent"]}
      />
      <ProtectedRoute
        path="/parent/children"
        component={ParentChildren}
        allowedRoles={["parent"]}
      />
      <ProtectedRoute
        path="/parent/attendance"
        component={ParentAttendance}
        allowedRoles={["parent"]}
      />
      <ProtectedRoute
        path="/parent/calendar"
        component={ParentCalendar}
        allowedRoles={["parent"]}
      />
      <ProtectedRoute
        path="/parent/messages"
        component={ParentMessages}
        allowedRoles={["parent"]}
      />
      <ProtectedRoute
        path="/parent/payments"
        component={ParentPayments}
        allowedRoles={["parent"]}
      />
      <ProtectedRoute
        path="/parent/invoice/:invoiceId"
        component={InvoicePage}
        allowedRoles={["parent"]}
      />
      <ProtectedRoute
        path="/parent/credit-notes"
        component={ParentCreditNotes}
        allowedRoles={["parent"]}
      />
      <ProtectedRoute
        path="/parent/print-credit-note/:creditNoteNumber"
        component={PrintCreditNote}
        allowedRoles={["parent"]}
      />

      {/* Student Routes */}
      <ProtectedRoute
        path="/student/dashboard"
        component={StudentDashboard}
        allowedRoles={["student"]}
      />
      <ProtectedRoute
        path="/student/courses"
        component={StudentCourses}
        allowedRoles={["student"]}
      />
      <ProtectedRoute
        path="/student/attendance"
        component={StudentAttendance}
        allowedRoles={["student"]}
      />
      <ProtectedRoute
        path="/student/payments"
        component={StudentPayments}
        allowedRoles={["student"]}
      />
      <ProtectedRoute
        path="/student/calendar"
        component={StudentCalendar}
        allowedRoles={["student"]}
      />
      <ProtectedRoute
        path="/student/messages"
        component={StudentMessages}
        allowedRoles={["student"]}
      />
      <ProtectedRoute
        path="/student/profile"
        component={StudentProfile}
        allowedRoles={["student"]}
      />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* <TestCubeConnection /> */}
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
