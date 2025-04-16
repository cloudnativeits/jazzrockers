import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Bell, ChevronDown, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [notificationCount] = useState(3); // This would come from an API in a real app

  // Get initials from user's full name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <button 
            className="mr-2 p-2 rounded-md text-neutral-500 hover:bg-neutral-100 md:hidden"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mr-2 shadow-sm">
              <img src="/logo.jpeg" alt="Jazzrockers Logo" className="h-9 w-9 object-contain" />
            </div>
            <span className="text-2xl font-bold text-primary">Jazzrockers</span>
            <span className="ml-2 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
              {user?.role.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="relative mr-4">
            <button className="p-2 rounded-full hover:bg-neutral-100">
              <Bell className="h-6 w-6 text-neutral-600" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center">
              <Avatar className="h-10 w-10 bg-primary">
                <AvatarFallback>
                  {user ? getInitials(user.fullName) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block ml-2">
                <div className="font-medium text-sm text-neutral-900">{user?.fullName}</div>
                <div className="text-xs text-neutral-500">{user?.branch || "Main Branch"}</div>
              </div>
              <ChevronDown className="ml-2 h-5 w-5 text-neutral-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium text-neutral-900 md:hidden">
                {user?.fullName}
              </div>
              <div className="px-2 py-1.5 text-xs text-neutral-500 md:hidden">
                {user?.branch || "Main Branch"}
              </div>
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
