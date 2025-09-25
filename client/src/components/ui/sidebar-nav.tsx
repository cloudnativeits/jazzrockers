import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Home,
  BookOpen,
  Users,
  Clock,
  CreditCard,
  Calculator,
  BarChart2,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  HelpCircle,
  UserCircle,
  Package,
  Wallet,
  GraduationCap,
  UserCog,
  UserPlus,
  User,
  FileText,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  isMobile?: boolean;
  closeMobileMenu?: () => void;
}

export function SidebarNav({ className, isMobile, closeMobileMenu, ...props }: SidebarNavProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const getAdminNavItems = () => [
    {
      title: "Dashboard",
      icon: <Home className="h-5 w-5 mr-3" />,
      href: "/admin/dashboard"
    },
    {
      title: "Courses & Batches",
      icon: <BookOpen className="h-5 w-5 mr-3" />,
      href: "/admin/courses"
    },
    // {
    //   title: "Fee Structure",
    //   icon: <Wallet className="h-5 w-5 mr-3" />,
    //   href: "/admin/fees"
    // },
    {
      title: "Student Enquiry",
      icon: <User className="h-5 w-5 mr-3" />,
      href: "/admin/student-enquiry"
    },
    {
      title: "Students",
      icon: <GraduationCap className="h-5 w-5 mr-3" />,
      href: "/admin/students"
    },
    {
      title: "All Batches",
      icon: <FileText className="h-5 w-5 mr-3" />,
      href: "/admin/batches"
    },
    {
      title: "Attendance",
      icon: <Clock className="h-5 w-5 mr-3" />,
      href: "/admin/attendance"
    },
    // {
    //   title: "Student Enrollments",
    //   icon: <UserPlus className="h-5 w-5 mr-3" />,
    //   href: "/admin/student-enrollments"
    // },
    {
      title: "Inventory",
      icon: <Package className="h-5 w-5 mr-3" />,
      href: "/admin/inventory"
    },
    {
      title: "Stock Items",
      icon: <Warehouse className="h-5 w-5 mr-3" />,
      href: "/admin/stock-items"
    },
    {
      title: "Branch Admins",
      icon: <UserCircle className="h-5 w-5 mr-3" />,
      href: "/admin/branch-admins"
    },
    {
      title: "Parents",
      icon: <Users className="h-5 w-5 mr-3" />,
      href: "/admin/parents"
    },
    {
      title: "Teachers",
      icon: <UserCog className="h-5 w-5 mr-3" />,
      href: "/admin/teachers"
    },
    {
      title: "Invoices",
      icon: <Wallet className="h-5 w-5 mr-3" />,
      href: "/admin/invoices"
    },
    {
      title: "Payments & Receipts",
      icon: <CreditCard className="h-5 w-5 mr-3" />,
      href: "/admin/payments"
    },
    {
      title: "Credit Notes",
      icon: <FileText className="h-5 w-5 mr-3" />,
      href: "/admin/credit-notes"
    },
    // {
    //   title: "Payroll",
    //   icon: <Calculator className="h-5 w-5 mr-3" />,
    //   href: "/admin/payroll"
    // },
    {
      title: "Reports",
      icon: <BarChart2 className="h-5 w-5 mr-3" />,
      href: "/admin/reports"
    },
    // {
    //   title: "Calendar",
    //   icon: <Calendar className="h-5 w-5 mr-3" />,
    //   href: "/admin/calendar"
    // },
    // {
    //   title: "Messages",
    //   icon: <MessageSquare className="h-5 w-5 mr-3" />,
    //   href: "/admin/messages"
    // },
    {
      title: "Roles & Permissions",
      icon: <ShieldCheck className="h-5 w-5 mr-3" />,
      href: "/admin/roles"
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5 mr-3" />,
      href: "/admin/settings"
    }
  ];

  const getBranchAdminNavItems = () => [
    {
      title: "Dashboard",
      icon: <Home className="h-5 w-5 mr-3" />,
      href: "/branch-admin/dashboard"
    },
    {
      title: "Courses & Batches",
      icon: <BookOpen className="h-5 w-5 mr-3" />,
      href: "/branch-admin/courses"
    },
    // {
    //   title: "Fee Structure",
    //   icon: <Wallet className="h-5 w-5 mr-3" />,
    //   href: "/admin/fees"
    // },
    {
      title: "Student Enquiry",
      icon: <User className="h-5 w-5 mr-3" />,
      href: "/branch-admin/student-enquiry"
    },
    {
      title: "Students",
      icon: <GraduationCap className="h-5 w-5 mr-3" />,
      href: "/branch-admin/students"
    },
    {
      title: "All Batches",
      icon: <FileText className="h-5 w-5 mr-3" />,
      href: "/branch-admin/batches"
    },
    {
      title: "Attendance",
      icon: <Clock className="h-5 w-5 mr-3" />,
      href: "/branch-admin/attendance"
    },
    // {
    //   title: "Student Enrollments",
    //   icon: <UserPlus className="h-5 w-5 mr-3" />,
    //   href: "/branch-admin/student-enrollments"
    // },
    {
      title: "Inventory",
      icon: <Package className="h-5 w-5 mr-3" />,
      href: "/branch-admin/inventory"
    },
    {
      title: "Stock Items",
      icon: <Warehouse className="h-5 w-5 mr-3" />,
      href: "/branch-admin/stock-items"
    },
    {
      title: "Parents",
      icon: <Users className="h-5 w-5 mr-3" />,
      href: "/branch-admin/parents"
    },
    {
      title: "Teachers",
      icon: <UserCog className="h-5 w-5 mr-3" />,
      href: "/branch-admin/teachers"
    },
    {
      title: "Invoices",
      icon: <Wallet className="h-5 w-5 mr-3" />,
      href: "/branch-admin/invoices"
    },
    {
      title: "Payments & Receipts",
      icon: <CreditCard className="h-5 w-5 mr-3" />,
      href: "/branch-admin/payments"
    },
    {
      title: "Credit Notes",
      icon: <FileText className="h-5 w-5 mr-3" />,
      href: "/branch-admin/credit-notes"
    },
    {
      title: "Reports",
      icon: <BarChart2 className="h-5 w-5 mr-3" />,
      href: "/branch-admin/reports"
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5 mr-3" />,
      href: "/branch-admin/settings"
    }
  ];

  const getTeacherNavItems = () => [
    {
      title: "Dashboard",
      icon: <Home className="h-5 w-5 mr-3" />,
      href: "/teacher/dashboard"
    },
    {
      title: "My Batches",
      icon: <BookOpen className="h-5 w-5 mr-3" />,
      href: "/teacher/batches"
    },
    {
      title: "Students",
      icon: <Users className="h-5 w-5 mr-3" />,
      href: "/teacher/students"
    },
    {
      title: "Attendance",
      icon: <Clock className="h-5 w-5 mr-3" />,
      href: "/teacher/attendance"
    },
    // {
    //   title: "Calendar",
    //   icon: <Calendar className="h-5 w-5 mr-3" />,
    //   href: "/teacher/calendar"
    // },
    // {
    //   title: "Messages",
    //   icon: <MessageSquare className="h-5 w-5 mr-3" />,
    //   href: "/teacher/messages"
    // }
  ];

  const getParentNavItems = () => [
    {
      title: "Dashboard",
      icon: <Home className="h-5 w-5 mr-3" />,
      href: "/parent/dashboard"
    },
    {
      title: "My Students",
      icon: <Users className="h-5 w-5 mr-3" />,
      href: "/parent/children"
    },
    {
      title: "Attendance",
      icon: <Clock className="h-5 w-5 mr-3" />,
      href: "/parent/attendance"
    },
    {
      title: "Payments",
      icon: <CreditCard className="h-5 w-5 mr-3" />,
      href: "/parent/payments"
    },
    {
      title: "Credit Notes",
      icon: <FileText className="h-5 w-5 mr-3" />,
      href: "/parent/credit-notes"
    },
    // {
    //   title: "Messages",
    //   icon: <MessageSquare className="h-5 w-5 mr-3" />,
    //   href: "/parent/messages"
    // },
    // {
    //   title: "Calendar",
    //   icon: <Calendar className="h-5 w-5 mr-3" />,
    //   href: "/parent/calendar"
    // }
  ];

  const getStudentNavItems = () => [
    {
      title: "Dashboard",
      icon: <Home className="h-5 w-5 mr-3" />,
      href: "/student/dashboard"
    },
    {
      title: "My Courses",
      icon: <BookOpen className="h-5 w-5 mr-3" />,
      href: "/student/courses"
    },
    {
      title: "Attendance",
      icon: <Clock className="h-5 w-5 mr-3" />,
      href: "/student/attendance"
    },
    {
      title: "Payments",
      icon: <CreditCard className="h-5 w-5 mr-3" />,
      href: "/student/payments"
    },
    // {
    //   title: "Calendar",
    //   icon: <Calendar className="h-5 w-5 mr-3" />,
    //   href: "/student/calendar"
    // },
    // {
    //   title: "Messages",
    //   icon: <MessageSquare className="h-5 w-5 mr-3" />,
    //   href: "/student/messages"
    // }
  ];

  let navItems: { title: string; icon: JSX.Element; href: string }[] = [];

  switch (user?.role) {
    case "admin":
      navItems = getAdminNavItems();
      break;
    case "branch_admin":
      navItems = getBranchAdminNavItems();
      break;
    case "teacher":
      navItems = getTeacherNavItems();
      break;
    case "parent":
      navItems = getParentNavItems();
      break;
    case "student":
      navItems = getStudentNavItems();
      break;
    default:
      navItems = [];
  }

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)} {...props}>
      {/* <div className="p-4 border-b border-neutral-200">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-3 py-2 rounded-md border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm w-full"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 absolute left-3 top-2 text-neutral-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
      </div> */}

      <nav className="flex-1 overflow-y-auto p-2">
        {/* Organize nav items into groups with headings */}
        {/* Main */}
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 pl-3 mt-2">
          Main
        </div>
        {navItems.slice(0, 1).map((item, index) => (
          <Link
            key={index}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center pl-3 pr-4 py-2 mb-1 rounded-md hover:bg-neutral-100 transition-colors",
              isActive(item.href) && "bg-primary/10 text-primary border-l-3 border-primary"
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        ))}

        {/* Management (for admin and teacher) */}
        {(user?.role === "admin" || user?.role === "teacher" || user?.role === "branch_admin") && (
          <>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 pl-3 mt-4">
              Management
            </div>
            {navItems.slice(1, user?.role === "admin" || user?.role === "branch_admin" ? 6 : 5).map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={onClick}
                className={cn(
                  "flex items-center pl-3 pr-4 py-2 mb-1 rounded-md hover:bg-neutral-100 transition-colors",
                  isActive(item.href) && "bg-primary/10 text-primary border-l-3 border-primary"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </>
        )}

        {/* My Info (for parent) */}
        {user?.role === "parent" && (
          <>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 pl-3 mt-4">
              My Information
            </div>
            {navItems.slice(1, 3).map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={onClick}
                className={cn(
                  "flex items-center pl-3 pr-4 py-2 mb-1 rounded-md hover:bg-neutral-100 transition-colors",
                  isActive(item.href) && "bg-primary/10 text-primary border-l-3 border-primary"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </>
        )}

        {/* My Info (for student) */}
        {user?.role === "student" && (
          <>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 pl-3 mt-4">
              My Information
            </div>
            {navItems.slice(1, 4).map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={onClick}
                className={cn(
                  "flex items-center pl-3 pr-4 py-2 mb-1 rounded-md hover:bg-neutral-100 transition-colors",
                  isActive(item.href) && "bg-primary/10 text-primary border-l-3 border-primary"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </>
        )}

        {(user?.role === "admin" || user?.role === "branch_admin") && (
          <>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 pl-3 mt-4">
              Inventory
            </div>
            {(user?.role === "admin"
              ? navItems.slice(6, 8)  // Admin sees 3: 8, 9, 10
              : navItems.slice(6, 8)  // Branch Admin sees 2: 9, 10
            ).map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={onClick}
                className={cn(
                  "flex items-center pl-3 pr-4 py-2 mb-1 rounded-md hover:bg-neutral-100 transition-colors",
                  isActive(item.href) && "bg-primary/10 text-primary border-l-3 border-primary"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </>
        )}

        {/* Staff (for admin) */}
        {(user?.role === "admin" || user?.role === "branch_admin") && (
          <>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 pl-3 mt-4">
              Users
            </div>
            {(user?.role === "admin"
              ? navItems.slice(8, 11)  // Admin sees 3: 8, 9, 10
              : navItems.slice(8, 10)  // Branch Admin sees 2: 9, 10
            ).map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={onClick}
                className={cn(
                  "flex items-center pl-3 pr-4 py-2 mb-1 rounded-md hover:bg-neutral-100 transition-colors",
                  isActive(item.href) && "bg-primary/10 text-primary border-l-3 border-primary"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </>
        )}

        {/* Other */}
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 pl-3 mt-4">
          Accounts
        </div>
        {(user?.role === "admin" || user?.role === "branch_admin")
          ? (user?.role === "admin"
            ? navItems.slice(11, 15) // admin gets 11–14
            : navItems.slice(10, 14) // branch admin gets 11–13
          ).map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={onClick}
              className={cn(
                "flex items-center pl-3 pr-4 py-2 mb-1 rounded-md hover:bg-neutral-100 transition-colors",
                isActive(item.href) && "bg-primary/10 text-primary border-l-3 border-primary"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))
          : (() => {
            let startIndex = 4;
            if (user?.role === "teacher") startIndex = 5;
            if (user?.role === "student") startIndex = 4;
            if (user?.role === "parent") startIndex = 5;

            return navItems.slice(startIndex).map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={onClick}
                className={cn(
                  "flex items-center pl-3 pr-4 py-2 mb-1 rounded-md hover:bg-neutral-100 transition-colors",
                  isActive(item.href) && "bg-primary/10 text-primary border-l-3 border-primary"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ));
          })()
        }
        
        {(user?.role === "admin" || user?.role === "branch_admin") && (
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 pl-3 mt-4">
            Home
          </div>
        )}
        {(user?.role === "admin" || user?.role === "branch_admin")
          ? (user?.role === "admin"
            ? navItems.slice(15) // admin sees from index 15 onward
            : navItems.slice(14) // branch admin sees from index 14 onward
          ).map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={onClick}
              className={cn(
                "flex items-center pl-3 pr-4 py-2 mb-1 rounded-md hover:bg-neutral-100 transition-colors",
                isActive(item.href) && "bg-primary/10 text-primary border-l-3 border-primary"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))
          : (() => {
            let startIndex = 4;
            if (user?.role === "teacher") startIndex = 5;
            if (user?.role === "student") startIndex = 4;
            if (user?.role === "parent") startIndex = 3;

            return navItems.slice(startIndex).map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={onClick}
                className={cn(
                  "flex items-center pl-3 pr-4 py-2 mb-1 rounded-md hover:bg-neutral-100 transition-colors",
                  isActive(item.href) && "bg-primary/10 text-primary border-l-3 border-primary"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ));
          })()
        }
      </nav>

      <div className="p-4 border-t border-neutral-200">
        {/* Profile Link */}
        <Link
          href="/profile"
          onClick={onClick}
          className={cn(
            "flex items-center pl-3 pr-4 py-2 mb-4 rounded-md border border-neutral-200 hover:bg-neutral-100 transition-colors",
            isActive("/profile") && "bg-primary/10 text-primary border-primary"
          )}
        >
          <UserCircle className="h-5 w-5 mr-3" />
          My Profile
        </Link>

        {/* <div className="bg-primary-light/10 rounded-lg p-3">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center mr-3">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-900">Need help?</div>
              <div className="text-xs text-neutral-600">View documentation</div>
            </div>
          </div>
        </div> */}

        <Button
          variant="outline"
          className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
