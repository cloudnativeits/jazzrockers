import * as React from "react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MobileBreadcrumb, type BreadcrumbItem as MobileBreadcrumbItem } from "@/components/ui/mobile-breadcrumb";
import { cn } from "@/lib/utils";

export interface PageBreadcrumbItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
}

interface PageBreadcrumbProps {
  items: PageBreadcrumbItem[];
  className?: string;
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);
  
  if (!items || items.length === 0) {
    return null;
  }
  
  // Convert items to mobile format
  const mobileItems: MobileBreadcrumbItem[] = items.map(item => ({
    title: item.title,
    href: item.href,
    icon: item.icon
  }));
  
  return (
    <div className={cn("mb-4", className)}>
      {isMobile ? (
        <MobileBreadcrumb items={mobileItems} />
      ) : (
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {index === items.length - 1 ? (
                    <BreadcrumbPage className="flex items-center">
                      {item.icon && <span className="mr-1">{item.icon}</span>}
                      {item.title}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      asChild={!!item.href}
                      className="flex items-center"
                    >
                      {item.href ? (
                        <Link href={item.href}>
                          {item.icon && <span className="mr-1">{item.icon}</span>}
                          {item.title}
                        </Link>
                      ) : (
                        <span>
                          {item.icon && <span className="mr-1">{item.icon}</span>}
                          {item.title}
                        </span>
                      )}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < items.length - 1 && (
                  <BreadcrumbSeparator />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </div>
  );
}