import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCourses from "@/pages/admin/courses";
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

function Router() {
  return (
    <Switch>
      {/* Auth Page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Profile Page - accessible by all authenticated users */}
      <ProtectedRoute path="/profile" component={ProfilePage} allowedRoles={["admin", "teacher", "parent", "student"]} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/" component={AdminDashboard} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/courses" component={AdminCourses} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/students" component={AdminStudents} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/parents" component={AdminParents} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/attendance" component={AdminAttendance} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/payments" component={AdminPayments} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/teachers" component={AdminTeachers} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/employees" component={AdminTeachers} allowedRoles={["admin"]} /> {/* Temporary redirect to teachers */}
      <ProtectedRoute path="/admin/payroll" component={AdminPayroll} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/reports" component={AdminReports} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/calendar" component={AdminCalendar} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/messages" component={AdminMessages} allowedRoles={["admin"]} />
      
      {/* Teacher Routes */}
      <ProtectedRoute path="/teacher/dashboard" component={TeacherDashboard} allowedRoles={["teacher"]} />
      <ProtectedRoute path="/teacher/students" component={TeacherStudents} allowedRoles={["teacher"]} />
      <ProtectedRoute path="/teacher/attendance" component={TeacherAttendance} allowedRoles={["teacher"]} />
      <ProtectedRoute path="/teacher/calendar" component={TeacherCalendar} allowedRoles={["teacher"]} />
      <ProtectedRoute path="/teacher/batches" component={TeacherBatches} allowedRoles={["teacher"]} />
      <ProtectedRoute path="/teacher/messages" component={TeacherMessages} allowedRoles={["teacher"]} />
      
      {/* Parent Routes */}
      <ProtectedRoute path="/parent/dashboard" component={ParentDashboard} allowedRoles={["parent"]} />
      <ProtectedRoute path="/parent/children" component={ParentChildren} allowedRoles={["parent"]} />
      <ProtectedRoute path="/parent/attendance" component={ParentAttendance} allowedRoles={["parent"]} />
      <ProtectedRoute path="/parent/calendar" component={ParentCalendar} allowedRoles={["parent"]} />
      <ProtectedRoute path="/parent/messages" component={ParentMessages} allowedRoles={["parent"]} />
      <ProtectedRoute path="/parent/payments" component={ParentPayments} allowedRoles={["parent"]} />
      
      {/* Student Routes */}
      <ProtectedRoute path="/student/dashboard" component={StudentDashboard} allowedRoles={["student"]} />
      <ProtectedRoute path="/student/courses" component={StudentCourses} allowedRoles={["student"]} />
      <ProtectedRoute path="/student/attendance" component={StudentAttendance} allowedRoles={["student"]} />
      <ProtectedRoute path="/student/payments" component={StudentPayments} allowedRoles={["student"]} />
      <ProtectedRoute path="/student/calendar" component={StudentCalendar} allowedRoles={["student"]} />
      <ProtectedRoute path="/student/messages" component={StudentMessages} allowedRoles={["student"]} />
      <ProtectedRoute path="/student/profile" component={StudentProfile} allowedRoles={["student"]} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
