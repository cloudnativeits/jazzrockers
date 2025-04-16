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
  User, 
  Calculator, 
  BarChart2, 
  Calendar, 
  MessageSquare, 
  Settings,
  LogOut,
  HelpCircle,
  UserCircle
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
    {
      title: "Students",
      icon: <Users className="h-5 w-5 mr-3" />,
      href: "/admin/students"
    },
    {
      title: "Parents",
      icon: <Users className="h-5 w-5 mr-3" />,
      href: "/admin/parents"
    },
    {
      title: "Attendance",
      icon: <Clock className="h-5 w-5 mr-3" />,
      href: "/admin/attendance"
    },
    {
      title: "Payments & Invoices",
      icon: <CreditCard className="h-5 w-5 mr-3" />,
      href: "/admin/payments"
    },
    {
      title: "Teachers",
      icon: <User className="h-5 w-5 mr-3" />,
      href: "/admin/teachers"
    },
    {
      title: "Payroll",
      icon: <Calculator className="h-5 w-5 mr-3" />,
      href: "/admin/payroll"
    },
    {
      title: "Reports",
      icon: <BarChart2 className="h-5 w-5 mr-3" />,
      href: "/admin/reports"
    },
    {
      title: "Calendar",
      icon: <Calendar className="h-5 w-5 mr-3" />,
      href: "/admin/calendar"
    },
    {
      title: "Messages",
      icon: <MessageSquare className="h-5 w-5 mr-3" />,
      href: "/admin/messages"
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5 mr-3" />,
      href: "/admin/settings"
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
    {
      title: "Calendar",
      icon: <Calendar className="h-5 w-5 mr-3" />,
      href: "/teacher/calendar"
    },
    {
      title: "Messages",
      icon: <MessageSquare className="h-5 w-5 mr-3" />,
      href: "/teacher/messages"
    }
  ];

  const getParentNavItems = () => [
    {
      title: "Dashboard",
      icon: <Home className="h-5 w-5 mr-3" />,
      href: "/parent/dashboard"
    },
    {
      title: "My Children",
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
      title: "Messages",
      icon: <MessageSquare className="h-5 w-5 mr-3" />,
      href: "/parent/messages"
    },
    {
      title: "Calendar",
      icon: <Calendar className="h-5 w-5 mr-3" />,
      href: "/parent/calendar"
    }
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
    {
      title: "Calendar",
      icon: <Calendar className="h-5 w-5 mr-3" />,
      href: "/student/calendar"
    },
    {
      title: "Messages",
      icon: <MessageSquare className="h-5 w-5 mr-3" />,
      href: "/student/messages"
    }
  ];

  let navItems: { title: string; icon: JSX.Element; href: string }[] = [];

  switch (user?.role) {
    case "admin":
      navItems = getAdminNavItems();
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
      <div className="p-4 border-b border-neutral-200">
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
      </div>
      
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
        {(user?.role === "admin" || user?.role === "teacher") && (
          <>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 pl-3 mt-4">
              Management
            </div>
            {navItems.slice(1, user?.role === "admin" ? 6 : 5).map((item, index) => (
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

        {/* Staff (for admin) */}
        {user?.role === "admin" && (
          <>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 pl-3 mt-4">
              Staff
            </div>
            {navItems.slice(6, 8).map((item, index) => (
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
          Other
        </div>
        {user?.role === "admin" 
          ? navItems.slice(8).map((item, index) => (
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
              let startIndex = 4; // Default for parent
              if (user?.role === "teacher") startIndex = 5;
              if (user?.role === "student") startIndex = 4;
              
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
        
        <div className="bg-primary-light/10 rounded-lg p-3">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center mr-3">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-900">Need help?</div>
              <div className="text-xs text-neutral-600">View documentation</div>
            </div>
          </div>
        </div>
        
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
