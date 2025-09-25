import { useState, useEffect } from "react";
import { Header } from "./header";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { useLocation } from "wouter";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [location] = useLocation();

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call initially

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with optional overlay for mobile */}
        {isSidebarOpen && (
          <>
            {/* Mobile overlay */}
            <div 
              className="fixed inset-0 bg-black/50 z-10 md:hidden" 
              onClick={toggleSidebar}
            />
            
            {/* Sidebar */}
            <aside 
              className="bg-white w-64 border-r border-neutral-200 shadow-sm flex-shrink-0 fixed md:static h-full z-20 transition-all duration-300"
            >
              <SidebarNav 
                isMobile={isMobile} 
                closeMobileMenu={() => setIsSidebarOpen(false)} 
              />
            </aside>
          </>
        )}
        
        {/* Main content */}
        <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${isSidebarOpen ? 'md:ml-0' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
